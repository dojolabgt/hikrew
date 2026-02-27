"use client";

import { getFeatures } from "@/lib/api";
import { Globe, LayoutTemplate, Code2, Shield, Container, Layers } from "lucide-react";

const iconMap = {
    Globe: Globe,
    LayoutTemplate: LayoutTemplate,
    Code2: Code2,
    Shield: Shield,
    Container: Container,
    Layers: Layers,
};

export function Features() {
    const features = getFeatures();

    return (
        <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100 mb-6">
                        Todo lo que necesitas para escalar
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-light">
                        Deja de perder tiempo configurando. NexStack viene optimizado para productividad y rendimiento desde el primer commit.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const Icon = iconMap[feature.iconName as keyof typeof iconMap] || Code2;

                        return (
                            <div
                                key={index}
                                className="group p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
