import trpc from "@/app/trpc/client";
import Message from "@/components/chat/message";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { Loader2, MessageSquare } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { useChatContext } from "@/components/chat/context";
import { useEffect, useRef } from "react";
import { useIntersection } from "@mantine/hooks";

export default function Messages({ fileId }: { fileId: string }) {
    const { isLoading: isAIThinking } = useChatContext();

    const { data, isLoading, fetchNextPage } =
        trpc.getFileMessages.useInfiniteQuery(
            {
                fileId,
                limit: INFINITE_QUERY_LIMIT,
            },
            {
                getNextPageParam(lastPage) {
                    return lastPage.nextCursor;
                },
                keepPreviousData: true,
            }
        );

    const messages = data?.pages.flatMap(page => page.messages);
    const loadingMessage: Omit<NonNullable<typeof messages>[number], "text"> & {
        text: JSX.Element;
    } = {
        createdAt: new Date().toISOString(),
        id: "loading-message",
        isUserMessage: false,
        text: (
            <span className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin" size={20} />
            </span>
        ),
    };

    const combinedMessages = [
        ...(isAIThinking ? [loadingMessage] : []),
        ...(messages ?? []),
    ];

    const lastMessageRef = useRef<React.ElementRef<"div">>(null);
    const { ref, entry } = useIntersection({
        root: lastMessageRef.current,
        threshold: 1,
    });

    useEffect(() => {
        if (entry?.isIntersecting) {
            fetchNextPage();
        }
    }, [entry, fetchNextPage]);

    return (
        <div className="flex max-h-[calc(100dvh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
            {combinedMessages && combinedMessages.length > 0 ? (
                combinedMessages.map((message, i, a) => {
                    const isNextMessageSameAuthor =
                        a[i - 1]?.isUserMessage === a[i]?.isUserMessage;
                    if (i === a.length - 1) {
                        return (
                            <Message
                                ref={ref}
                                key={message.id}
                                isNextMessageSameAuthor={
                                    isNextMessageSameAuthor
                                }
                                message={message}
                            />
                        );
                    }
                    return (
                        <Message
                            key={message.id}
                            isNextMessageSameAuthor={isNextMessageSameAuthor}
                            message={message}
                        />
                    );
                })
            ) : isLoading ? (
                <div className="w-full flex flex-col gap-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <MessageSquare size={42} className="text-primary" />
                    <h3 className="font-semibold text-xl">
                        You&apos;re all set!
                    </h3>
                    <p className="text-zinc-500 text-sm">
                        Ask a question to get started.
                    </p>
                </div>
            )}
        </div>
    );
}
