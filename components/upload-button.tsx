"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Dropzone from "react-dropzone";
import { Cloud, File } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import trpc from "@/app/trpc/client";
import { useRouter } from "next/navigation";

export default function UploadButton() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={() => setOpen(true)}>
                <Button size="lg">Upload PDF</Button>
            </DialogTrigger>
            <DialogContent>
                <UploadDropzone />
            </DialogContent>
        </Dialog>
    );
}

function UploadDropzone() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { startUpload } = useUploadThing("pdfUploader");

    const { mutate: startPolling } = trpc.getFile.useMutation({
        onSuccess: ({ id }) => {
            router.push(`/dashboard/${id}`);
        },
        retry: true,
        retryDelay: 500,
    });

    const startSimulatedProgress = () => {
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 5;
            });
        }, 500);
        return interval;
    };

    const handleDrop = async <T extends File>(acceptedFile: T[]) => {
        setUploading(() => true);
        const progressInterval = startSimulatedProgress();
        const res = await startUpload(acceptedFile);
        const { toast } = await import("@/components/ui/use-toast");

        if (!res) {
            clearInterval(progressInterval);
            setUploading(() => false);
            setUploadProgress(0);
            return toast({
                title: "Something went wrong",
                description: "Please try again later.",
                variant: "destructive",
            });
        }
        const [fileResponse] = res;
        const { key } = fileResponse;

        if (!key) {
            clearInterval(progressInterval);
            setUploading(() => false);
            setUploadProgress(0);
            return toast({
                title: "Something went wrong",
                description: "Please try again later.",
                variant: "destructive",
            });
        }

        clearInterval(progressInterval);
        setUploading(() => false);
        setUploadProgress(100);
        startPolling({ key });
    };

    return (
        <Dropzone multiple={false} onDrop={handleDrop}>
            {({ getRootProps, getInputProps, acceptedFiles }) => (
                <div
                    {...getRootProps()}
                    className="border h-64 m-4 border-dashed border-gray-300 rounded-lg"
                >
                    <div className="flex items-center justify-center h-full w-full">
                        <label
                            htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                            <div className="select-none flex flex-col items-center justify-center pt-5 pb-6">
                                <Cloud
                                    className="text-zinc-500 mb-2"
                                    size={36}
                                />
                                <p className="mb-2 text-sm text-zinc-700">
                                    <span className="font-semibold">
                                        Click to upload
                                    </span>{" "}
                                    or drag and drop
                                </p>
                                <p className="text-sm text-zinc-500">
                                    PDF (up to 4MB)
                                </p>
                            </div>

                            {acceptedFiles && acceptedFiles[0] && uploading ? (
                                <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                                    <div className="px-3 py-2 h-full grid place-items-center">
                                        <File
                                            size={24}
                                            className="text-primary"
                                        />
                                    </div>
                                    <div className="px-3 py-2 h-full text-sm truncate">
                                        {acceptedFiles[0].name}
                                    </div>
                                </div>
                            ) : null}

                            {uploading ? (
                                <div className="w-full mt-4 max-w-xs mx-auto">
                                    <Progress
                                        value={uploadProgress}
                                        className="h-1 w-full bg-zinc-200"
                                    />
                                </div>
                            ) : null}

                            <input
                                {...getInputProps()}
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                aria-hidden="true"
                            />
                        </label>
                    </div>
                </div>
            )}
        </Dropzone>
    );
}
