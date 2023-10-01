"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsUpDown,
    Loader2,
    RotateCcw,
    RotateCw,
    Search,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResizeDetector } from "react-resize-detector";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import SimpleBar from "simplebar-react";
import PdfFullscreen from "./pdf-fullscreen";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PdfRenderer({ url }: { url: string }) {
    const { width, ref } = useResizeDetector();

    const [numPages, setNumPages] = useState<number | null>(null);
    const [curPage, setCurPage] = useState(1);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [renderedScale, setRenderedScale] = useState<number | null>(null);

    const isLoading = renderedScale !== scale;

    type TCustomPageSchema = z.infer<typeof customPageSchema>;
    const customPageSchema = z.object({
        page: z.string().refine(num => +num > 0 && +num <= numPages!),
    });
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<TCustomPageSchema>({
        resolver: zodResolver(customPageSchema),
        defaultValues: {
            page: "" + curPage,
        },
    });

    const handleCustomPageSubmit = ({ page }: TCustomPageSchema) => {
        setCurPage(+page);
        setValue("page", "" + page);
    };

    return (
        <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
            <div className="w-full border-b border-zinc-200 flex items-center justify-between px-2 h-14">
                <div className="flex items-center gap-1.5">
                    <Button
                        disabled={numPages === null || curPage === 1}
                        variant="ghost"
                        aria-label="previous page"
                        onClick={() => {
                            setCurPage(prev => Math.max(1, prev - 1));
                            setValue("page", "" + (curPage - 1));
                        }}
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-1.5">
                        <Input
                            {...register("page")}
                            className={cn(
                                "w-12 h-8",
                                errors.page && "focus-visible:ring-red-500"
                            )}
                            placeholder={"" + curPage}
                            onKeyDown={({ key }) => {
                                if (key !== "Enter") return;
                                handleSubmit(handleCustomPageSubmit)();
                            }}
                        />
                        <p className="text-zinc-700 text-sm space-x-1">
                            <span>/</span>
                            <span>{numPages ?? "..."}</span>
                        </p>
                    </div>
                    <Button
                        disabled={numPages === null || curPage === numPages}
                        variant="ghost"
                        aria-label="next page"
                        onClick={() => {
                            setCurPage(prev => Math.min(numPages!, prev + 1));
                            setValue("page", "" + (curPage + 1));
                        }}
                    >
                        <ChevronRight size={20} />
                    </Button>
                </div>
                <div className="">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="gap-1.5"
                                aria-label="zoom"
                                variant="ghost"
                            >
                                <Search size={20} />
                                {scale * 100}%
                                <ChevronsUpDown size={14} opacity={0.5} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {[1, 1.5, 2, 2.5].map(scale => (
                                <DropdownMenuItem
                                    key={scale}
                                    onSelect={() => setScale(scale)}
                                >
                                    {scale * 100}%
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        aria-label="rotate 90 degrees clockwise"
                        onClick={() => setRotation(prev => prev + 90)}
                    >
                        <RotateCw size={20} />
                    </Button>

                    <PdfFullscreen url={url} />
                </div>
            </div>

            <div className="flex-1 w-full max-h-screen">
                <SimpleBar
                    autoHide={false}
                    className="max-h-[calc(100dvh-10rem)]"
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
                            {isLoading && renderedScale ? (
                                <>
                                    <Page
                                        key={`@${renderedScale}`}
                                        width={width ?? 1}
                                        pageNumber={curPage}
                                        scale={scale}
                                        rotate={rotation}
                                    />
                                </>
                            ) : null}
                            <Page
                                key={`@${scale}`}
                                className={cn(isLoading ? "hidden" : "")}
                                width={width ?? 1}
                                pageNumber={curPage}
                                scale={scale}
                                rotate={rotation}
                                loading={
                                    <div className="flex justify-center">
                                        <Loader2
                                            className="my-24 animate-spin"
                                            size={36}
                                        />
                                    </div>
                                }
                                onRenderSuccess={() => setRenderedScale(scale)}
                            />
                        </Document>
                    </div>
                </SimpleBar>
            </div>
        </div>
    );
}
