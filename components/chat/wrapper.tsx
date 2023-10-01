"use client";

import Link from "next/link";
import Messages from "@/components/chat/messages";
import ChatInput from "@/components/chat/input";
import { buttonVariants } from "@/components/ui/button";
import trpc from "@/app/trpc/client";
import { ChevronLeft, Loader2, XCircle } from "lucide-react";
import { ChatContextProvider } from "@/components/chat/context";

export default function ChatWrapper({ fileId }: { fileId: string }) {
    const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
        {
            id: fileId,
        },
        {
            refetchInterval(data) {
                return data?.status === "SUCCESS" || data?.status === "FAILED"
                    ? false
                    : 500;
            },
        }
    );

    if (isLoading)
        return (
            <LoadingState
                title="Loading..."
                description="We're preparing your pdf."
            />
        );

    if (data?.status === "PROCESSING")
        return (
            <LoadingState
                title="Processing PDF..."
                description="This won't take long."
            />
        );

    if (data?.status === "FAILED")
        return (
            <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
                <div className="flex-1 flex justify-center items-center flex-col mb-28">
                    <div className="flex flex-col items-center gap-2">
                        <XCircle size={48} className="text-destructive" />
                        <h3 className="font-semibold text-xl">
                            Too Many Pages in PDF
                        </h3>
                        <p className="text-zinc-500 text-sm">
                            Your <span className="font-medium">Free</span> plan
                            only allows up to 5 pages per PDF.
                        </p>
                        <Link
                            href="/dashboard"
                            className={buttonVariants({
                                variant: "secondary",
                                className: "mt-4",
                            })}
                        >
                            <ChevronLeft size={16} className="mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
                <ChatInput isDisabled />
            </div>
        );

    return (
        <ChatContextProvider fileId={fileId}>
            <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
                <div className="flex-1 justify-between flex-col mb-28 flex">
                    <Messages fileId={fileId} />
                </div>
                <ChatInput isDisabled={isLoading} />
            </div>
        </ChatContextProvider>
    );
}

function LoadingState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
            <div className="flex-1 flex justify-center items-center flex-col mb-28">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 size={48} className="animate-spin text-primary" />
                    <h3 className="font-semibold text-xl">{title}</h3>
                    <p className="text-zinc-500 text-sm">{description}</p>
                </div>
            </div>
            <ChatInput isDisabled />
        </div>
    );
}
