"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const APP_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || '';

export function Header() {
    return (
        <header className="fixed top-4 left-4 right-4 z-50 flex justify-center">
            <motion.div
                className="w-full max-w-3xl flex items-center justify-between gap-3 px-4 h-14 rounded-2xl bg-[#111]/90 backdrop-blur-xl border border-white/[0.08]"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
                    <Image src="/HiKrewLogo.png" alt="Hi Krew" width={24} height={24} className="object-contain" />
                    <span className="font-bold text-[15px] text-white tracking-tight">Hi Krew</span>
                </Link>

                {/* Nav — desktop only */}
                <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
                    <Button variant="ghost" size="sm" asChild className="rounded-full text-white/50 hover:text-white hover:bg-white/[0.07] text-[13px]">
                        <Link href="#funciones">Funciones</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="rounded-full text-white/50 hover:text-white hover:bg-white/[0.07] text-[13px]">
                        <Link href="#precios">Precios</Link>
                    </Button>
                </nav>

                {/* CTA */}
                <Button size="sm" asChild className="shrink-0 rounded-full bg-white text-gray-900 hover:bg-gray-100 text-[13px] px-4 font-semibold shadow-none">
                    <Link href={`${APP_URL}/login`}>
                        Entrar
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                </Button>
            </motion.div>
        </header>
    );
}
