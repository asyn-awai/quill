import prisma from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
    createUploadthing,
    type FileRouter as UTFileRouter,
} from "uploadthing/next";
import { utapi } from "uploadthing/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getPineconeClient } from "@/lib/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";

const f = createUploadthing();

export const fileRouter = {
    pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
        .middleware(async ({ req }) => {
            const user = getKindeServerSession().getUser();
            if (!user?.id) throw new Error("Unauthorized");

            return { userId: user.id };
        })
        .onUploadComplete(
            async ({ metadata: { userId }, file: { name, key } }) => {
                const url = await utapi
                    .getFileUrls(key)
                    .then(data => data[0].url);
                const createdFile = await prisma.file.create({
                    data: {
                        key,
                        name,
                        // url: `https://uploadthing.com/prod/s3.us-west-2.amazonaws.com/${key}`,
                        url,
                        uploadStatus: "PROCESSING",
                        userId,
                    },
                });

                try {
                    const res = await fetch(url);
                    const blob = await res.blob();

                    const loader = new PDFLoader(blob);
                    const pageLevelDocs = await loader.load();
                    const numPages = pageLevelDocs.length;

                    const pinecone = await getPineconeClient();
                    const pineconeIndex = pinecone.Index("quill");
                    const embeddings = new OpenAIEmbeddings({
                        openAIApiKey: process.env.OPENAI_API_KEY!,
                    });

                    await PineconeStore.fromDocuments(
                        pageLevelDocs,
                        embeddings,
                        {
                            pineconeIndex,
                            namespace: createdFile.id,
                        }
                    );

                    await prisma.file.update({
                        data: {
                            uploadStatus: "SUCCESS",
                        },
                        where: {
                            id: createdFile.id,
                        },
                    });
                } catch (err) {
                    console.error(err);
                    await prisma.file.update({
                        data: {
                            uploadStatus: "FAILED",
                        },
                        where: {
                            id: createdFile.id,
                        },
                    });
                }
            }
        ),
} satisfies UTFileRouter;

export type FileRouter = typeof fileRouter;
