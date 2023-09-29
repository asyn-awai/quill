import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import trpc from "../trpc/client";
import prisma from "@/lib/prisma";
import Dashboard from "./dashboard";

export default async function DashboardPage() {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user?.id) return redirect("/auth-callback?origin=/dashboard");

    const dbUser = await prisma.user.findUnique({
        where: {
            id: user.id,
        },
    });

    if (!dbUser) return redirect("/auth-callback?origin=/dashboard");

    return <Dashboard />;
}
