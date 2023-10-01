"use client";

import { ArrowRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileNav({ isAuth }: { isAuth: boolean }) {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => setOpen(prev => !prev);

    const pathname = usePathname();

    useEffect(() => {
        if (open) toggleOpen();
    }, [pathname]);

    const closeOnCurrent = (href: string) => {
        if (pathname === href) toggleOpen();
    };

    return (
        <div className="sm:hidden">
            <Menu
                onClick={toggleOpen}
                className="relative z-50 h-5 w-5 text-zinc-700 cursor-pointer"
            />

            {open ? (
                <div className="fixed top-full inset-0 animate-in slide-in-from-top-5 fade-in-20 z-0 w-full">
                    <ul className="absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 py-8">
                        {!isAuth ? (
                            <>
                                <li>
                                    <Link
                                        onClick={() =>
                                            closeOnCurrent("/sign-up")
                                        }
                                        href="/sign-up"
                                        className="flex items-center w-full font-semibold text-green-600"
                                    >
                                        Get started
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </li>
                                <li className="my-3 h-px w-full bg-gray-300" />{" "}
                                <li>
                                    <Link
                                        onClick={() =>
                                            closeOnCurrent("/sign-in")
                                        }
                                        href="/sign-in"
                                        className="flex items-center w-full font-semibold"
                                    >
                                        Sign in
                                    </Link>
                                </li>
                                <li className="my-3 h-px w-full bg-gray-300" />{" "}
                                <li>
                                    <Link
                                        onClick={() =>
                                            closeOnCurrent("/sign-in")
                                        }
                                        href="/pricing"
                                        className="flex items-center w-full font-semibold"
                                    >
                                        Pricing
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link
                                        onClick={() =>
                                            closeOnCurrent("/dashboard")
                                        }
                                        href="/dashboard"
                                        className="flex items-center w-full font-semibold"
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                                <li className="my-3 h-px w-full bg-gray-300" />{" "}
                                <li>
                                    <Link
                                        href="/sign-out"
                                        className="flex items-center w-full font-semibold"
                                    >
                                        Sign out
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
