"use client";

import {
    useState,
    createContext,
    useContext,
    PropsWithChildren,
    useRef,
} from "react";
import { toast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import trpc from "@/app/trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";

interface StreamResponse {
    addMessage: () => void;
    message: string;
    handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>;
    isLoading: boolean;
}

const chatContext = createContext<StreamResponse>({
    addMessage: () => {},
    message: "",
    handleInputChange: () => {},
    isLoading: true,
});

export const useChatContext = () => useContext(chatContext);

export function ChatContextProvider({
    fileId,
    children,
}: PropsWithChildren<{
    fileId: string;
}>) {
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const utils = trpc.useContext();

    const backupMessage = useRef("");

    const { mutate: sendMessage } = useMutation({
        async mutationFn({ message }: { message: string }) {
            const res = await fetch(`/api/message`, {
                method: "POST",
                body: JSON.stringify({
                    fileId,
                    message,
                }),
            });

            if (!res.ok) throw new Error("Failed to send message");
            return res.body;
        },
        async onMutate({ message }) {
            backupMessage.current = message;
            setMessage("");

            await utils.getFileMessages.cancel();
            const prevMessages = utils.getFileMessages.getInfiniteData();
            utils.getFileMessages.setInfiniteData(
                {
                    fileId,
                    limit: INFINITE_QUERY_LIMIT,
                },
                prev => {
                    if (!prev)
                        return {
                            pages: [],
                            pageParams: [],
                        };

                    let newPages = [...prev.pages];
                    let lastestPage = newPages[0];
                    lastestPage.messages = [
                        {
                            createdAt: new Date().toISOString(),
                            id: crypto.randomUUID(),
                            text: message,
                            isUserMessage: true,
                        },
                        ...lastestPage.messages,
                    ];

                    newPages[0] = lastestPage;

                    return {
                        ...prev,
                        pages: newPages,
                    };
                }
            );

            setIsLoading(true);

            return {
                prevMessages:
                    prevMessages?.pages.flatMap(page => page.messages) ?? [],
            };
        },
        async onSuccess(stream) {
            setIsLoading(false);
            if (!stream)
                return toast({
                    title: "An Error Occurred",
                    description:
                        "There was a problem sending your message, please refresh the page and try again.",
                });

            const reader = stream.getReader();
            const decoder = new TextDecoder();

            let done = false;
            let accRes = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;

                const chunkVal = decoder.decode(value);
                accRes += chunkVal;

                utils.getFileMessages.setInfiniteData(
                    {
                        fileId,
                        limit: INFINITE_QUERY_LIMIT,
                    },
                    prev => {
                        if (!prev) {
                            return {
                                pages: [],
                                pageParams: [],
                            };
                        }
                        let aiResCreated = prev.pages.some(page =>
                            page.messages.some(msg => msg.id === "ai-response")
                        );
                        let updatedPages = prev.pages.map(page => {
                            if (page === prev.pages[0]) {
                                let updatedMessages;

                                if (!aiResCreated) {
                                    updatedMessages = [
                                        {
                                            createdAt: new Date().toISOString(),
                                            id: "ai-response",
                                            text: accRes,
                                            isUserMessage: false,
                                        },
                                        ...page.messages,
                                    ];
                                } else {
                                    updatedMessages = page.messages.map(msg => {
                                        if (msg.id === "ai-response") {
                                            return {
                                                ...msg,
                                                text: accRes,
                                            };
                                        }
                                        return msg;
                                    });
                                }
                                return {
                                    ...page,
                                    messages: updatedMessages,
                                };
                            }
                            return page;
                        });
                        return { ...prev, pages: updatedPages };
                    }
                );
            }
        },
        onError(_, __, ctx) {
            setMessage(backupMessage.current);
            utils.getFileMessages.setData(
                { fileId },
                { messages: ctx?.prevMessages ?? [] }
            );
        },
        async onSettled() {
            setIsLoading(false);
            await utils.getFileMessages.invalidate({ fileId });
        },
    });

    const handleInputChange: StreamResponse["handleInputChange"] = e =>
        setMessage(e.target.value);

    const addMessage = () => sendMessage({ message });

    return (
        <chatContext.Provider
            value={{
                message,
                addMessage,
                isLoading,
                handleInputChange,
            }}
        >
            {children}
        </chatContext.Provider>
    );
}
