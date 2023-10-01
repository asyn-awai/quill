import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/providers";
import Navbar from "@/components/navbar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { constructMetadata } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <html lang="en">
                <body
                    className={cn(
                        "min-h-screen font-sans antialiased",
                        // "grainy",
                        inter.className
                    )}
                >
                    <Analytics />
                    <Navbar />
                    <Toaster />
                    {children}
                </body>
            </html>
        </Providers>
    );
}
