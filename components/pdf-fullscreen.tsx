"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Expand, Loader2 } from "lucide-react";
import SimpleBar from "simplebar-react";
import { Document, Page, pdfjs } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";

export default function PdfFullscreen({ url }: { url: string }) {
    const [open, setOpen] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);

    const { width, ref } = useResizeDetector();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    aria-label="fullscreen"
                    variant="ghost"
                    className="gap-1.5"
                >
                    <Expand size={20} />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-full">
                <SimpleBar
                    autoHide={false}
                    className="mt-6 max-h-[calc(100dvh-10rem)]"
                >
                    <div ref={ref}>
                        <Document
                            file={url}
                            className="max-h-full"
                            loading={
                                <div className="flex justify-center">
                                    <Loader2
                                        className="my-24 animate-spin"
                                        size={32}
                                    />
                                </div>
                            }
                            onLoadSuccess={({ numPages }) => {
                                setNumPages(numPages);
                            }}
                            onLoadError={err => {
                                toast({
                                    title: "Error loading PDF",
                                    description: "Please try again later.",
                                    variant: "destructive",
                                });
                            }}
                        >
                            {Array.from({ length: numPages ?? 0 }, (_, i) => (
                                <Page
                                    key={i}
                                    width={width ?? 1}
                                    pageNumber={i + 1}
                                />
                            ))}
                        </Document>
                    </div>
                </SimpleBar>
            </DialogContent>
        </Dialog>
    );
}
