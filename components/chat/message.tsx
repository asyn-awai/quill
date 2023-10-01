import type { ExtendedMessage } from "@/types/message";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { useIntersection } from "@mantine/hooks";
import React, { forwardRef } from "react";

const Message = forwardRef<
    React.ElementRef<"div">,
    {
        message: ExtendedMessage;
        isNextMessageSameAuthor: boolean;
    }
>(({ message, isNextMessageSameAuthor }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("flex items-end", {
                "justify-end": message.isUserMessage,
            })}
        >
            <div
                className={cn(
                    "relative flex aspect-square h-6 w-6 items-center justify-center",
                    {
                        "order-2 bg-blue-600 rounded-sm": message.isUserMessage,
                        "order-1 bg-zinc-800 rounded-sm":
                            !message.isUserMessage,
                        invisible: isNextMessageSameAuthor,
                    }
                )}
            >
                {message.isUserMessage ? (
                    <Icons.user className="fill-zinc-200 text-zinc-200 h-3/4 w-3/4" />
                ) : (
                    <Icons.logo className="fill-blue-600 text-blue-600 h-3/4 w-3/4" />
                )}
            </div>

            <div
                className={cn(
                    "flex flex-col max-w-md space-y-2 text-base mx-2",
                    {
                        "order-1 items-end": message.isUserMessage,
                        "order-2 items-start": !message.isUserMessage,
                    }
                )}
            >
                <div
                    className={cn("px-4 py-2 rounded-lg inline-block", {
                        "bg-blue-600 text-white": message.isUserMessage,
                        "bg-gray-200 text-gray-900": !message.isUserMessage,
                        "rounded-bg-none":
                            !isNextMessageSameAuthor && message.isUserMessage,
                        "rounded-bl-none":
                            !isNextMessageSameAuthor && !message.isUserMessage,
                    })}
                >
                    {typeof message.text === "string" ? (
                        <ReactMarkdown
                            className={cn("prose", {
                                "text-zinc-50": message.isUserMessage,
                            })}
                        >
                            {message.text}
                        </ReactMarkdown>
                    ) : (
                        message.text
                    )}
                    {message.id !== "loading-message" ? (
                        <div
                            className={cn(
                                "text-xs select-none mt-2 w-full text-right",
                                {
                                    "text-zinc-500": !message.isUserMessage,
                                    "text-blue-300": message.isUserMessage,
                                }
                            )}
                        >
                            {format(new Date(message.createdAt), "HH:mm")}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
});

Message.displayName = "Message";
export default Message;
