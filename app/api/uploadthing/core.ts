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
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

const f = createUploadthing();

export const fileRouter = {
    freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
        .middleware(middleware)
        .onUploadComplete(onUploadComplete),
    proPlanUploader: f({ pdf: { maxFileSize: "16MB" } })
        .middleware(middleware)
        .onUploadComplete(onUploadComplete),
} satisfies UTFileRouter;

export type FileRouter = typeof fileRouter;

async function middleware() {
    const user = getKindeServerSession().getUser();
    if (!user?.id) throw new Error("Unauthorized");

    const subscriptionPlan = await getUserSubscriptionPlan();

    return { userId: user.id, subscriptionPlan };
}

async function onUploadComplete({
    metadata: {
        userId,
        subscriptionPlan: { isSubscribed },
    },
    file: { name, key },
}: {
    metadata: Awaited<ReturnType<typeof middleware>>;
    file: { name: string; key: string; url: string };
}) {
    const fileExists = await prisma.file.findFirst({ where: { key } });

    const url = await utapi.getFileUrls(key).then(data => data[0].url);
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

        const quotaExceeded =
            numPages >
            PLANS.find(plan => plan.name === (isSubscribed ? "Pro" : "Free"))!
                .pagesPerPdf;

        if (quotaExceeded) {
            await prisma.file.update({
                where: { id: createdFile.id },
                data: {
                    uploadStatus: "FAILED",
                },
            });
        }

        const pinecone = await getPineconeClient();
        const pineconeIndex = pinecone.Index("quill");
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY!,
        });

        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
            pineconeIndex,
            namespace: createdFile.id,
        });

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

