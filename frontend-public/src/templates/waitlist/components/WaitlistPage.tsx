'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail } from 'lucide-react';
import Image from 'next/image';
import BlurText from '@/components/react-bits/text/BlurText';

export function WaitlistPage() {
    const [email, setEmail] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate submission
        setTimeout(() => setSubmitted(true), 1000);
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black text-white flex flex-col items-center justify-center p-4">
            {/* 1. Simple Animated Gradient Background */}
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-900/30 blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-violet-900/30 blur-[150px] animate-pulse delay-1000" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md mx-auto space-y-12 text-center">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="flex justify-center items-center gap-2 mb-8"
                >
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
                        <Image
                            src="/logos/NexLogo.png"
                            alt="NexStack Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white/90">NexStack</span>
                </motion.div>

                {/* Headlines */}
                <div className="space-y-6">
                    <BlurText
                        text="Únete a la revolución."
                        delay={150}
                        animateBy="words"
                        direction="top"
                        className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight justify-center"
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                        className="text-lg text-zinc-400 font-light max-w-sm mx-auto leading-relaxed"
                    >
                        Sé el primero en acceder a la plantilla de dashboard premium diseñada para equipos de ingeniería modernos.
                    </motion.p>
                </div>

                {/* Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
                    className="w-full relative"
                >
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-green-400 font-medium flex flex-col items-center gap-2"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            </div>
                            ¡Estás en la lista! Nos pondremos en contacto pronto.
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all shadow-inner">
                                    <Mail className="absolute left-4 text-zinc-500 w-5 h-5" />
                                    <Input
                                        type="email"
                                        placeholder="Ingresa tu correo electrónico..."
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="border-none bg-transparent h-12 pl-12 pr-4 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-600">
                                Sin spam. Date de baja cuando quieras.
                            </p>
                        </div>
                    )}
                </motion.form>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-6 left-0 w-full text-center"
            >
                <p className="text-xs text-zinc-700 font-mono">
                    &copy; {new Date().getFullYear()} NexStack Inc.
                </p>
            </motion.div>
        </div>
    );
}
