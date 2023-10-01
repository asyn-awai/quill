import type { Metadata } from "next";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
    if (typeof globalThis.window !== "undefined") return path;
    if (process.env.VERCEL_URL)
        return `https://${process.env.VERCEL_URL}${path}`;
    return `http://localhost:${process.env.PORT ?? "3000"}${path}`;
}

export function constructMetadata({
    title = "Quill - the SaaS for students",
    description = "Quill is an open source software to make chatting with PDFs easy and intuitive.",
    image = "/images/thumbnail.png",
    icons = "/favicon.ico",
    noIndex = false,
}: Partial<{
    title: string;
    description: string;
    image: string;
    icons: string;
    noIndex: boolean;
}> = {}): Metadata {
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: image,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
        icons,
        metadataBase: new URL("https://quill-beta.vercel.app"),
        themeColor: "#ffffff",
        ...(noIndex && {
            robots: {
                index: false,
                follow: false,
            },
        }),
    };
}
