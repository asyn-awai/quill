import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { absoluteUrl } from "@/lib/utils";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

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
    getFileMessages: privateProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish(),
                fileId: z.string(),
            })
        )
        .query(
            async ({
                ctx: { userId },
                input: { fileId, limit: nullishLimit, cursor },
            }) => {
                const limit = nullishLimit ?? INFINITE_QUERY_LIMIT;
                const file = await prisma.file.findUnique({
                    where: {
                        id: fileId,
                        userId,
                    },
                });

                if (!file)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "File not found",
                    });

                const messages = await prisma.message.findMany({
                    where: {
                        fileId,
                    },
                    take: limit + 1,
                    orderBy: {
                        createdAt: "desc",
                    },
                    cursor: cursor ? { id: cursor } : undefined,
                    select: {
                        id: true,
                        isUserMessage: true,
                        createdAt: true,
                        text: true,
                    },
                });

                let nextCursor: typeof cursor | undefined = undefined;
                if (messages.length > limit) {
                    const nextItem = messages.pop();
                    nextCursor = nextItem?.id;
                }

                return {
                    messages,
                    nextCursor,
                };
            }
        ),
    getFileUploadStatus: privateProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ ctx: { userId }, input: { id } }) => {
            const file = await prisma.file.findUnique({
                where: {
                    id,
                    userId,
                },
            });

            if (!file) return { status: "PENDING" as const };
            return {
                status: file.uploadStatus as
                    | "PROCESSING"
                    | "SUCCESS"
                    | "FAILED",
            };
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
    createStripeSession: privateProcedure.mutation(
        async ({ ctx: { userId } }) => {
            const billingUrl = absoluteUrl("/dashboard/billing");
            if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

            const dbUser = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });
            if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

            const subscriptionPlan = await getUserSubscriptionPlan();

            if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
                const stripeSession =
                    await stripe.billingPortal.sessions.create({
                        customer: dbUser.stripeCustomerId,
                        return_url: billingUrl,
                    });
                return {
                    url: stripeSession.url,
                };
            }

            const stripeSession = await stripe.checkout.sessions.create({
                success_url: billingUrl,
                cancel_url: billingUrl,
                payment_method_types: ["card", "paypal"],
                mode: "subscription",
                billing_address_collection: "auto",
                line_items: [
                    {
                        price: PLANS.find(plan => plan.name === "Pro")?.price
                            .priceIds.test,
                        quantity: 1,
                    },
                ],
                metadata: {
                    userId,
                },
            });

            return { url: stripeSession.url };
        }
    ),
});

export type AppRouter = typeof appRouter;
