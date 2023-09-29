import prisma from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
    createUploadthing,
    type FileRouter as UTFileRouter,
} from "uploadthing/next";

const f = createUploadthing();

export const fileRouter = {
    pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
        .middleware(async ({ req }) => {
            const user = getKindeServerSession().getUser();
            if (!user?.id) throw new Error("Unauthorized");

            return { userId: user.id };
        })
        .onUploadComplete(
            async ({ metadata: { userId }, file: { name, key, url } }) => {
                const createdFile = await prisma.file.create({
                    data: {
                        key,
                        name,
                        url: `https://uploadthing.com/prod/s3.us-west-2.amazonaws.com/${key}`,
                        userId,
                        uploadStatus: "PROCESSING",
                    },
                });
            }
        ),
} satisfies UTFileRouter;

export type FileRouter = typeof fileRouter;
