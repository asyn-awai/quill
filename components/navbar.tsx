import Link from "next/link";
import MaxWidthWrapper from "./max-width-wrapper";
import { buttonVariants } from "./ui/button";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/server";

export default function Navbar() {
    return (
        <nav className="sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all">
            <MaxWidthWrapper className="h-full">
                <div className="flex h-full items-center justify-between border-b border-zinc-200">
                    <Link href="/" className="font-semibold">
                        <span className="text-2xl font-medium">quill.</span>
                    </Link>

                    <div className="hidden items-center space-x-4 sm:flex">
                        <Link
                            href="/pricing"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}
                        >
                            Pricing
                        </Link>
                        <LoginLink
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}
                        >
                            Sign In
                        </LoginLink>
                        <RegisterLink
                            className={buttonVariants({
                                size: "sm",
                            })}
                        >
                            Get Started
                        </RegisterLink>
                    </div>
                </div>
            </MaxWidthWrapper>
        </nav>
    );
}
