"use client";

import LogoLoop from "@/components/react-bits/LogoLoop";

// Array of technologies to display with local SVGs
const technologies = [
    { src: "/logos/nextjs.svg", alt: "Next.js", title: "Next.js" },
    { src: "/logos/nestjs.svg", alt: "NestJS", title: "NestJS" },
    { src: "/logos/docker.svg", alt: "Docker", title: "Docker" },
    { src: "/logos/typescript.svg", alt: "TypeScript", title: "TypeScript" },
    { src: "/logos/react.svg", alt: "React", title: "React" },
    // Duplicate for loop effect
    { src: "/logos/nextjs.svg", alt: "Next.js", title: "Next.js" },
    { src: "/logos/nestjs.svg", alt: "NestJS", title: "NestJS" },
    { src: "/logos/docker.svg", alt: "Docker", title: "Docker" },
    { src: "/logos/typescript.svg", alt: "TypeScript", title: "TypeScript" },
    { src: "/logos/react.svg", alt: "React", title: "React" },
];

export function Technologies() {
    return (
        <section className="w-full py-12 border-y border-gray-100 bg-white/50 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm font-medium text-gray-400 mb-8 uppercase tracking-widest">
                    Potenciado por Modern Tech Stack
                </p>

                <div className="w-full max-w-4xl mx-auto h-16 md:h-24 flex items-center opacity-50 hover:opacity-80 transition-opacity duration-300 grayscale invert-[0.3]">
                    <LogoLoop
                        logos={technologies}
                        speed={50}
                        direction="left"
                        logoHeight={60}
                        gap={60}
                        hoverSpeed={0}
                        scaleOnHover={false}
                        fadeOut={false}
                    />
                </div>
            </div>
        </section>
    );
}
