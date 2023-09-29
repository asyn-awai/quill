import type { AppRouter } from "@/trpc";
import { createTRPCReact } from "@trpc/react-query";

const trpc = createTRPCReact<AppRouter>()

export default trpc;