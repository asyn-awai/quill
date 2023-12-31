"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Dropzone from "react-dropzone";
import { Cloud, File, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import trpc from "@/app/trpc/client";
import { useRouter } from "next/navigation";
import { getUserSubscriptionPlan } from "@/lib/stripe";

export default function UploadButton({
    isSubscribed,
}: {
    isSubscribed: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={() => setOpen(true)}>
                <Button size="lg">Upload PDF</Button>
            </DialogTrigger>
            <DialogContent>
                <UploadDropzone isSubscribed={isSubscribed} />
            </DialogContent>
        </Dialog>
    );
}

function UploadDropzone({ isSubscribed }: { isSubscribed: boolean }) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { startUpload } = useUploadThing(
        isSubscribed ? "proPlanUploader" : "freePlanUploader"
    );

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
        console.log(acceptedFile);
        const res = await startUpload([acceptedFile[0]]);
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
                            onClick={e => e.stopPropagation()}
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
                                    PDF (up to {isSubscribed ? 16 : 4}MB)
                                </p>
                            </div>

                            {acceptedFiles &&
                            acceptedFiles[0] &&
                            (uploading || uploadProgress === 100) ? (
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

                            {uploading || uploadProgress === 100 ? (
                                <div className="w-full mt-4 max-w-xs mx-auto">
                                    <Progress
                                        indicatorColor={
                                            uploadProgress === 100
                                                ? "bg-green-500"
                                                : "bg-primary"
                                        }
                                        value={uploadProgress}
                                        className="h-1 w-full bg-zinc-200 transition-colors"
                                    />
                                    {uploadProgress === 100 ? (
                                        <div className="items-center justify-center text-sm text-zinc-700 text-center pt-2 flex gap-1">
                                            <Loader2
                                                className="animate-spin"
                                                size={24}
                                            />
                                            Redirecting...
                                        </div>
                                    ) : null}
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
