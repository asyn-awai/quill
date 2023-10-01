import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc";

type RouterOutput = inferRouterOutputs<AppRouter>;

type Message = RouterOutput["getFileMessages"]["messages"][number];

type OmitText = Omit<Message, "text">;

type ExtendedText = {
    text: string | JSX.Element;
};

export type ExtendedMessage = OmitText & ExtendedText;
