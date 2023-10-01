import { openai } from "@/lib/openai";
import { getPineconeClient } from "@/lib/pinecone";
import prisma from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validation/send-message";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextResponse } from "next/server";
import { z } from "zod";
import { OpenAIStream, StreamingTextResponse } from "ai";

export async function POST(req: NextResponse) {
    const body = await req.json();
    const user = getKindeServerSession().getUser();

    const { id: userId } = user;

    if (!user?.id) return new Response("Unauthorized", { status: 401 });

    const { fileId, message } = sendMessageSchema.parse(body);

    const file = await prisma.file.findUnique({
        where: {
            id: fileId,
            userId,
        },
    });

    if (!file) {
        return new Response("Not found", { status: 404 });
    }

    await prisma.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId,
        },
    });

    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index("quill");

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: fileId,
    });

    const results = await vectorStore.similaritySearch(message, 4);

    const prevMessages = await prisma.message.findMany({
        where: {
            fileId,
        },
        orderBy: {
            createdAt: "asc",
        },
        take: 6,
    });

    const formattedMessages = prevMessages.map(message => ({
        role: message.isUserMessage
            ? ("user" as const)
            : ("assistant" as const),
        content: message.text,
    }));

    const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        stream: true,
        messages: [
            {
                role: "system",
                content:
                    "Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.",
            },
            {
                role: "user",
                content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
              
        \n----------------\n
        
        PREVIOUS CONVERSATION:
        ${formattedMessages.map(message =>
            message.role === "user"
                ? `User: ${message.content}\n`
                : `Assistant: ${message.content}\n`
        )}
        
        \n----------------\n
        
        CONTEXT:
        ${results.map(r => r.pageContent).join("\n\n")}
        
        USER INPUT: ${message}`,
            },
        ],
    });

    const stream = OpenAIStream(res, {
        async onCompletion(completion) {
            await prisma.message.create({
                data: {
                    text: completion,
                    isUserMessage: false,
                    fileId,
                    userId,
                },
            });
        },
    });

    return new StreamingTextResponse(stream);
}
