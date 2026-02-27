"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    Settings,
    Bell,
    Search,
    CreditCard,
    Activity
} from "lucide-react";
import Image from "next/image";

export function DashboardPreview() {
    return (
        <section id="demo" className="py-24 bg-white dark:bg-black overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-black dark:to-purple-950/20 blur-3xl opacity-60" />
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <div className="max-w-4xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100 mb-6">
                        Interfaz Premium lista para usar
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-light">
                        Diseñado con atención obsesiva al detalle. Componentes modulares, accesibles y totalmente personalizables.
                    </p>
                </div>

                {/* Dashboard Browser Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative max-w-7xl mx-auto"
                >
                    <div className="rounded-xl bg-zinc-950 shadow-2xl overflow-hidden border border-gray-800">
                        {/* Browser Header */}
                        <div className="bg-zinc-900 px-4 py-3 flex items-center gap-2 border-b border-white/5">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="flex-1 text-center">
                                <div className="bg-zinc-800 rounded-md px-3 py-1 text-xs text-gray-400 inline-block font-mono">
                                    localhost:3000/dashboard
                                </div>
                            </div>
                        </div>

                        {/* Real Dashboard Layout: Dark Sidebar + White Content Card */}
                        <div className="flex h-[800px] bg-zinc-950 text-left overflow-hidden relative font-sans">

                            {/* Dark Sidebar */}
                            <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col hidden md:flex">
                                {/* Branding */}
                                <div className="h-16 flex items-center px-6 border-b border-white/5">
                                    <div className="flex items-center gap-2 font-bold text-xl text-white">
                                        <Image
                                            src="/logos/NexLogo.png"
                                            alt="NexStack Logo"
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-lg object-contain"
                                        />
                                        <span>NexStack</span>
                                    </div>
                                </div>

                                {/* Nav Items */}
                                <nav className="flex-1 px-3 py-6 space-y-1">
                                    {[
                                        { icon: LayoutDashboard, label: "Overview", active: true },
                                        { icon: Users, label: "Usuarios", active: false },
                                        { icon: Settings, label: "Settings", active: false },
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-center px-3 py-2.5 rounded-xl cursor-default transition-all ${item.active ? 'bg-white text-zinc-900 shadow-lg shadow-white/10' : 'text-zinc-400 opacity-60'}`}>
                                            <item.icon size={18} className="mr-3" />
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </div>
                                    ))}
                                </nav>

                                {/* User Profile */}
                                <div className="p-4 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10" />
                                        <div className="flex-1">
                                            <div className="h-3 w-20 bg-zinc-800 rounded mb-1" />
                                            <div className="h-2 w-12 bg-zinc-800 rounded opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Content Wrapper - White Card Layout */}
                            <div className="flex-1 flex flex-col h-full relative p-4">
                                <main className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 flex flex-col overflow-hidden relative">
                                    {/* Header Inside Card */}
                                    <header className="px-8 py-6 flex items-center justify-between border-b border-gray-50">
                                        <div>
                                            <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
                                            <p className="text-zinc-500 text-sm">Bienvenido de nuevo, Admin</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                                                <Search size={18} />
                                            </div>
                                            <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 relative">
                                                <Bell size={18} />
                                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                                            </div>
                                        </div>
                                    </header>

                                    {/* Content Area */}
                                    <div className="flex-1 overflow-hidden p-8 bg-slate-50/50">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                            {[
                                                { label: "Total Revenue", value: "$45,231", change: "+20.1%", icon: CreditCard },
                                                { label: "Active Users", value: "2,845", change: "+12.5%", icon: Users },
                                                { label: "Projects", value: "127", change: "+8.2%", icon: Activity },
                                            ].map((stat, i) => (
                                                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <stat.icon size={20} />
                                                        </div>
                                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">{stat.change}</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                                    <div className="text-sm text-gray-500">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </main>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
