import { TRPCError, initTRPC } from "@trpc/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();
const { middleware } = t;
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */

const isAuth = middleware(async opts => {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user?.id)
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Unauthorized",
        });

    return opts.next({
        ctx: {
            userId: user.id,
            user,
        },
    });
});

export const { router, procedure: publicProcedure } = t;
export const privateProcedure = t.procedure.use(isAuth);
