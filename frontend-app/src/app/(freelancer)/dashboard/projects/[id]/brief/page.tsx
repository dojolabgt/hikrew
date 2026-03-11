'use client';

import React from 'react';
import { useProject } from '../layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutTemplate } from 'lucide-react';

export default function ProjectBriefPage() {
    const { project } = useProject();
    const brief = project?.deal?.brief;

    if (!brief) {
        return (
            <div className="flex items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/20 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500 text-sm">No se completó un brief para este proyecto.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                        Respuestas del Brief
                    </CardTitle>
                    {brief?.template && (
                        <Badge variant="outline" className="font-normal border-zinc-200 dark:border-zinc-700">
                            Plantilla: {brief.template.name}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="pt-8">
                    {(brief.template?.schema?.length ?? 0) > 0 ? (
                        <div className="space-y-8">
                            {brief.template?.schema?.map((field: { id: string; label: string }, idx: number) => (
                                <div key={field.id} className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-700">
                                    <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                        {idx + 1}
                                    </div>
                                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-2 leading-relaxed">
                                        {field.label}
                                    </h3>
                                    <div className="text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                                        {(() => {
                                            const answer = brief.responses?.[field.id];
                                            if (answer !== undefined && answer !== '') {
                                                if (Array.isArray(answer)) {
                                                    return (
                                                        <ul className="list-disc pl-5 space-y-1.5">
                                                            {answer.map((ans: string, i: number) => <li key={i}>{ans}</li>)}
                                                        </ul>
                                                    );
                                                }
                                                return <p className="whitespace-pre-wrap">{String(answer)}</p>;
                                            }
                                            return <span className="italic opacity-60 text-zinc-400">Sin respuesta proporcionada</span>;
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-sm text-zinc-500 italic">No hay preguntas registradas en este brief.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
