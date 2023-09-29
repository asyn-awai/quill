import { notFound, redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/lib/prisma";
import PdfRenderer from "@/components/pdf-renderer";
import ChatWrapper from "@/components/chat-wrapper";

interface Props {
    params: {
        fileId: string;
    };
}

export default async function File({ params: { fileId } }: Props) {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user?.id)
        return redirect(`/auth-callback?origin=/dashboard/${fileId}`);

    const file = await prisma.file.findUnique({
        where: {
            id: fileId,
            userId: user.id,
        },
    });

    if (!file) return notFound();

    return (
        <div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
            <div className="grow lg:flex xl:px-2 border mx-auto w-full max-w-8xl">
                <div className="flex-1 xl:flex">
                    <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
                        <PdfRenderer />
                    </div>
                </div>
                <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:border-l lg:border-t-0 lg:w-96">
                    <ChatWrapper></ChatWrapper>
                </div>
            </div>
        </div>
    );
}
