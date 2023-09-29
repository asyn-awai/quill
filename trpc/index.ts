import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const appRouter = router({
    authCallback: publicProcedure.query(async () => {
        const { getUser } = getKindeServerSession();
        const user = getUser();

        if (!user?.id || !user?.email)
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            });

        const dbUser = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
        });

        if (!dbUser) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                },
            });
        }

        return { success: true };
    }),
    getUserFiles: privateProcedure.query(async ({ ctx }) => {
        const { userId } = ctx;

        return await prisma.file.findMany({
            orderBy: {
                createdAt: "desc",
            },
            where: {
                userId: userId,
            },
        });
    }),
    getFile: privateProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ ctx: { userId }, input: { key } }) => {
            const file = await prisma.file.findFirst({
                where: {
                    key,
                    userId,
                },
            });

            if (!file)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "File not found",
                });

            return file;
        }),
    deleteFile: privateProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx: { userId }, input: { id } }) => {
            const file = await prisma.file.findUnique({
                where: {
                    id,
                    userId,
                },
            });

            if (!file)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "File not found",
                });

            return await prisma.file.delete({
                where: {
                    id,
                    userId,
                },
            });
        }),
});

export type AppRouter = typeof appRouter;
