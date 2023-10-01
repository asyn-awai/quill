"use client";

import trpc from "@/app/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpgradeButton() {
    const router = useRouter();

    const { mutate: createStripeSession } =
        trpc.createStripeSession.useMutation({
            onSuccess({ url }) {
                router.push(url ?? "/dashboard/billing");
            },
        });

    return (
        <Button className="w-full" onClick={() => createStripeSession()}>
            Upgrade now
            <ArrowRight className="h-5 w-5 ml-1.5" />
        </Button>
    );
}
