"use client";

import trpc from "@/app/trpc/client";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import MaxWidthWrapper from "./max-width-wrapper";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function BillingForm({
    subscriptionPlan,
}: {
    subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}) {
    const router = useRouter();
    const { mutate: createStripeSession, isLoading } =
        trpc.createStripeSession.useMutation({
            onSuccess({ url }) {
                if (url) router.push(url);
                else
                    return toast({
                        title: "There was a problem",
                        description: "Please try again later",
                        variant: "destructive",
                    });
            },
        });

    return (
        <MaxWidthWrapper className="max-w-5xl">
            <form
                className="mt-12"
                onSubmit={e => {
                    e.preventDefault();
                    createStripeSession();
                }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Plan</CardTitle>
                        <CardDescription>
                            You are currently on the{" "}
                            <strong>{subscriptionPlan.name ?? "Free"}</strong>{" "}
                            plan.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col items-start gap-y-2 md:flex-row md:justify-between md:gap-x-0">
                        <Button type="submit">
                            {isLoading ? (
                                <Loader2
                                    className="mr-4 animate-spin"
                                    size={20}
                                />
                            ) : null}
                            {subscriptionPlan.isSubscribed
                                ? "Manage Subscription"
                                : "Upgrade to Pro"}
                        </Button>

                        {subscriptionPlan.isSubscribed ? (
                            <p className="rounded-full text-xs font-medium">
                                {subscriptionPlan.isCanceled
                                    ? "Your plan will be cancelled on "
                                    : "Your plan renews on "}
                                {format(
                                    subscriptionPlan.stripeCurrentPeriodEnd!,
                                    "dd.MM.yyyy"
                                )}
                            </p>
                        ) : null}
                    </CardFooter>
                </Card>
            </form>
        </MaxWidthWrapper>
    );
}
