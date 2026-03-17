"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, FileCheck, CreditCard, Circle, LayoutList } from "lucide-react";

/* ─────────────────────────────────────────
   Mini UI previews
───────────────────────────────────────── */

function DealPreview() {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/60">Nuevo Deal</span>
                <span className="text-[10px] text-white/30 bg-white/[0.06] rounded-full px-2.5 py-0.5">Borrador</span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
                {[["Cliente", "Café Raíz"], ["Proyecto", "Rediseño Web"], ["Brief", "✓ Completado"]].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30">{label}</span>
                        <span className="text-[11px] font-medium text-white/70">{value}</span>
                    </div>
                ))}
                <div className="pt-2 border-t border-white/[0.06] flex gap-2">
                    {["Opción A", "Opción B"].map((t, i) => (
                        <div key={t} className={`flex-1 rounded-lg px-3 py-1.5 text-center text-[10px] font-semibold ${i === 0 ? "bg-white text-gray-900" : "bg-white/[0.07] text-white/40"}`}>{t}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ApprovalPreview() {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-[11px] font-semibold text-white/60">Propuesta — Café Raíz</p>
                <p className="text-[10px] text-white/30 mt-0.5">enviado a sofía@caferaiz.com</p>
            </div>
            <div className="px-4 py-3 space-y-2">
                <div className="rounded-xl bg-white/[0.06] border border-white/[0.06] p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-white/70">Paquete Completo</span>
                        <span className="text-[12px] font-black text-white">$1,750</span>
                    </div>
                    {["Diseño web", "Hosting", "SEO"].map(s => (
                        <div key={s} className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-3 w-3 text-white/25 shrink-0" strokeWidth={2} />
                            <span className="text-[10px] text-white/40">{s}</span>
                        </div>
                    ))}
                </div>
                <button className="w-full rounded-xl bg-white text-gray-900 text-[11px] font-bold py-2.5 flex items-center justify-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Aprobar propuesta
                </button>
            </div>
        </div>
    );
}

function ProjectPreview() {
    const tasks = [
        { label: "Kick-off con el cliente", done: true },
        { label: "Wireframes (3 pantallas)", done: true },
        { label: "Diseño visual — Home", done: false, active: true },
        { label: "Revisión y ajustes", done: false },
        { label: "Entrega final + exportables", done: false },
    ];
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[11px] font-semibold text-white/60">Rediseño Web — Café Raíz</p>
                <span className="text-[10px] text-white/30 bg-white/[0.06] rounded-full px-2.5 py-0.5">2 / 5 tareas</span>
            </div>
            <div className="px-4 py-3 space-y-2">
                {tasks.map((t, i) => (
                    <div key={i} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg ${t.active ? "bg-white/[0.07] border border-white/[0.08]" : ""}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-white/80" : t.active ? "border border-white/30" : "border border-white/10"}`}>
                            {t.done && <CheckCircle2 className="h-2.5 w-2.5 text-gray-900" strokeWidth={3} />}
                            {t.active && <span className="w-1.5 h-1.5 rounded-full bg-white/60" />}
                        </div>
                        <span className={`text-[11px] ${t.done ? "text-white/30 line-through" : t.active ? "text-white/80 font-medium" : "text-white/40"}`}>{t.label}</span>
                        {t.active && <span className="ml-auto text-[9px] text-white/30 bg-white/[0.06] rounded-full px-2 py-0.5 shrink-0">En progreso</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function PaymentPreview() {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-[11px] font-semibold text-white/60">Plan de cobro · $1,750</p>
            </div>
            <div className="px-4 py-3 space-y-3">
                {[
                    { label: "Anticipo — inicio", amount: "$875", done: true },
                    { label: "Cierre — entrega final", amount: "$875", done: false },
                ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${m.done ? "bg-white" : "border border-white/20 bg-white/[0.05]"}`}>
                            {m.done ? <CheckCircle2 className="h-3 w-3 text-gray-900" strokeWidth={3} /> : <Clock className="h-2.5 w-2.5 text-white/30" strokeWidth={2} />}
                        </div>
                        <span className={`flex-1 text-[11px] ${m.done ? "text-white/35 line-through" : "text-white/70 font-medium"}`}>{m.label}</span>
                        <span className={`text-[12px] font-bold shrink-0 ${m.done ? "text-white/30" : "text-white"}`}>{m.amount}</span>
                    </div>
                ))}
                <button className="w-full mt-1 rounded-xl border border-white/[0.1] bg-white/[0.06] text-white/60 text-[11px] font-semibold py-2.5 flex items-center justify-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Marcar anticipo como cobrado
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Steps
───────────────────────────────────────── */

const STEPS = [
    {
        number: "01",
        tag: "Deal → Brief → Cotización",
        title: "Crea un Deal",
        description: "Centraliza el proyecto desde el primer día. Adjunta el cliente, lanza el cuestionario de brief y arma dos opciones de cotización — todo en un mismo hilo.",
        preview: <DealPreview />,
    },
    {
        number: "02",
        tag: "Link público · Sin registro",
        title: "Tu cliente aprueba en línea",
        description: "Comparte un link único. El cliente ve tu propuesta, compara las opciones y aprueba con un clic. Sin apps, sin correos, sin PDFs adjuntos.",
        preview: <ApprovalPreview />,
    },
    {
        number: "03",
        tag: "Tareas · Entregables · Seguimiento",
        title: "Gestiona el proyecto",
        description: "Crea tareas, asigna entregables y lleva el seguimiento del avance. Tu equipo y tu cliente siempre saben en qué etapa está el proyecto.",
        preview: <ProjectPreview />,
    },
    {
        number: "04",
        tag: "Hitos · Cobra como prefieras",
        title: "Cobra por hitos",
        description: "Define anticipo, avance y entrega final desde el inicio. Si operas en Guatemala o El Salvador, conecta Recurrente para cobrar en línea — o coordina por el medio que ya usas.",
        preview: <PaymentPreview />,
    },
];

/* ─────────────────────────────────────────
   Section
───────────────────────────────────────── */

export function HowItWorks() {
    return (
        <section id="funciones" className="bg-[#0d0d0d] pb-24 overflow-hidden relative">

            {/* Separator from Hero */}
            <div className="container mx-auto px-5 md:px-8 max-w-5xl">
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent mb-24" />
            </div>

            {/* Ambient glow */}
            <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-100"
                style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.022) 0%, transparent 65%)" }}
            />

            <div className="relative container mx-auto px-5 md:px-8 max-w-5xl">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-16 text-center max-w-xl mx-auto"
                >
                    <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-3">
                        Cómo funciona
                    </p>
                    <h2 className="text-4xl md:text-[44px] font-black tracking-tight text-white leading-[1.07] mb-4">
                        De la idea al cobro,<br className="hidden md:block" /> en cuatro pasos.
                    </h2>
                    <p className="text-[15px] text-white/40 font-light leading-relaxed">
                        Un flujo continuo — sin cambiar de app en cada etapa.
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative space-y-8">

                    {/* Vertical connector line */}
                    <div className="absolute left-[calc(50%-0.5px)] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent hidden md:block pointer-events-none" />

                    {STEPS.map((step, i) => {
                        const isEven = i % 2 === 0;
                        return (
                            <div key={i} className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">

                                {/* Dot on line */}
                                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/[0.12] items-center justify-center z-10">
                                    <span className="text-[11px] font-black text-white/40 tabular-nums">{step.number}</span>
                                </div>

                                {/* Text */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                                    className={`flex flex-col gap-3 ${isEven ? "md:pr-14 md:text-right md:items-end" : "md:order-last md:pl-14"}`}
                                >
                                    {/* Mobile number pill */}
                                    <div className="flex items-center gap-2 md:hidden">
                                        <span className="w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-[10px] font-black text-white/40">{step.number}</span>
                                        <span className="text-[10px] text-white/30 bg-white/[0.06] rounded-full px-2.5 py-0.5">{step.tag}</span>
                                    </div>

                                    <span className="hidden md:inline-block text-[10px] font-semibold text-white/30 bg-white/[0.06] border border-white/[0.07] rounded-full px-2.5 py-1 self-end">
                                        {step.tag}
                                    </span>

                                    <div>
                                        <h3 className="text-[22px] md:text-[24px] font-black text-white tracking-tight leading-tight mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-[14px] text-white/45 leading-relaxed max-w-xs md:ml-auto">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Preview */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                                    className={`${isEven ? "md:pl-14" : "md:pr-14 md:order-first"}`}
                                >
                                    {step.preview}
                                </motion.div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
