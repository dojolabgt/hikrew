'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getHeroData } from "@/lib/api";
import SplashCursor from "@/components/react-bits/backgrounds/SplashCursor";
import BlurText from "@/components/react-bits/text/BlurText";
import { motion } from "framer-motion";

export function Hero() {
    const data = getHeroData();

    return (
        <section className="relative w-full min-h-screen overflow-hidden bg-white flex flex-col items-center pt-40 md:pt-48 pb-10">
            {/* 1. SplashCursor Background (Z-0) */}
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60">
                <SplashCursor />
            </div>

            {/* 2. Text Content (Z-20, Top Layer) */}
            <div className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center gap-6 mb-0">
                <div className="space-y-4 max-w-5xl mx-auto">
                    <BlurText
                        text={data.title}
                        delay={200}
                        animateBy="words"
                        direction="top"
                        className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-gray-900 leading-[1.05] justify-center flex flex-wrap gap-x-4 gap-y-2"
                    />

                    <motion.p
                        className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
                    >
                        {data.subtitle}
                    </motion.p>
                </div>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
                >
                    <Button asChild size="lg" className="rounded-full h-12 px-8 text-base shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 bg-gray-900 text-white hover:bg-black">
                        <Link href="/login">
                            {data.ctaPrimary} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-8 text-base border-gray-300 hover:bg-gray-100/80 backdrop-blur-md hover:-translate-y-1 transition-all duration-300">
                        <Link href="/#docs">
                            {data.ctaSecondary}
                        </Link>
                    </Button>
                </motion.div>
            </div>

            {/* 3. Combined Wrapper for Mockup and Gradient (Flex Flow, closer to text) */}
            <div className="relative w-full flex-1 flex flex-col justify-start items-center mt-10">

                {/* Gradient Background attached to this wrapper */}
                <div className="absolute bottom-0 left-0 w-full h-[120%] z-0 pointer-events-none">
                    {/* Main Gradient: 65deg White -> Colors -> White */}
                    <div
                        className="absolute inset-0 opacity-40 blur-[80px]"
                        style={{
                            background: "linear-gradient(-170deg, #ffffff 0%, #ffffff 30%, #a8c0ff 45%, #3f2b96 50%, #c471f5 55%, #ffffff 70%, #ffffff 100%)",
                        }}
                    ></div>
                </div>

                {/* iPhone Mockup */}
                <motion.div
                    className="relative z-10 w-full flex justify-center pointer-events-none"
                    initial={{ opacity: 0, y: 100, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: -12 }}
                    transition={{ duration: 1.2, delay: 1.4, ease: "circOut" }}
                >
                    <div className="relative w-full flex justify-center drop-shadow-2xl">
                        <Image
                            src="/hero-mockup.png"
                            alt="App Dashboard on iPhone"
                            width={1284}
                            height={2778}
                            priority
                            className="w-[85%] max-w-[500px] md:max-w-[700px] lg:max-w-[900px] h-auto object-contain"
                        />
                    </div>
                </motion.div>
            </div>

        </section>
    );
}
