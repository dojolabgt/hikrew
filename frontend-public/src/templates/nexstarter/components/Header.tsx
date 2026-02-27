"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { AppBranding } from "@/components/common/AppBranding";
import { motion } from "framer-motion";
import GlassSurface from "@/components/react-bits/effects/GlassSurface";

export function Header() {
    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 pt-6 px-4"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="container mx-auto max-w-5xl">
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <GlassSurface
                        width="100%"
                        height="3.5rem"
                        borderRadius={9999}
                        borderWidth={0.2}
                        opacity={0.6}
                        blur={15}
                        className="shadow-xl shadow-blue-500/10"
                    >
                        <div className="w-full h-full flex items-center justify-between px-6">
                            <Link href="/" className="hover:opacity-80 transition-opacity">
                                <AppBranding variant="default" />
                            </Link>

                            <motion.nav
                                className="flex items-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <Button variant="ghost" size="sm" asChild className="hidden md:flex rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                                    <Link href="#docs">Docs</Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild className="hidden md:flex rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                                    <Link href="#features">Features</Link>
                                </Button>

                                <Button size="sm" className="rounded-full ml-2 bg-gray-900 text-white hover:bg-black border-0 shadow-md hover:shadow-lg transition-all duration-300" asChild>
                                    <Link href={process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/login` : "/login"}>
                                        <LogIn className="mr-2 h-4 w-4" /> Entrar
                                    </Link>
                                </Button>
                            </motion.nav>
                        </div>
                    </GlassSurface>
                </motion.div>
            </div>
        </motion.header>
    );
}
