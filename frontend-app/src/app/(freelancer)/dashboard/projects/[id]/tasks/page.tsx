'use client';

import { useProject } from '../layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, CheckCircle2, Circle, Clock } from 'lucide-react';

export default function ProjectTasksPage() {
    const { isViewer } = useProject();

    // UI shell simulation for future implementation
    const columns = [
        { id: 'todo', title: 'Por Hacer', count: 3 },
        { id: 'in_progress', title: 'En Progreso', count: 2 },
        { id: 'review', title: 'En Revisión (Cliente)', count: 1 },
        { id: 'done', title: 'Completado', count: 5 },
    ];

    const dummyTasks = [
        { id: 1, title: 'Reunión inicial de Kickoff', status: 'done', column: 'done' },
        { id: 2, title: 'Bocetos y propuestas visuales', status: 'in_progress', column: 'in_progress' },
        { id: 3, title: 'Feedback sobre propuesta A', status: 'review', column: 'review' },
        { id: 4, title: 'Montaje en servidor de staging', status: 'todo', column: 'todo' },
        { id: 5, title: 'Pruebas de QA internas', status: 'todo', column: 'todo' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] w-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Seguimiento de Tareas</h2>
                    <p className="text-sm text-zinc-500">Módulo en construcción. Próximamente podrás gestionar el progreso aquí.</p>
                </div>
                {!isViewer && (
                    <Button size="sm" disabled>
                        <Plus className="w-4 h-4 mr-2" /> Nueva Tarea
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-6 h-full min-w-max px-1">
                    {columns.map(col => (
                        <div key={col.id} className="w-[300px] flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    {col.title}
                                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs px-2 py-0.5 rounded-full">
                                        {col.count}
                                    </span>
                                </h3>
                            </div>

                            <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 space-y-2 opacity-60 pointer-events-none">
                                {dummyTasks.filter(t => t.column === col.id).map(task => (
                                    <Card key={task.id} className="shadow-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950">
                                        <CardContent className="p-3">
                                            <div className="flex gap-2 items-start">
                                                <div className="mt-0.5 text-zinc-400">
                                                    {task.status === 'done' ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    ) : task.status === 'in_progress' ? (
                                                        <Clock className="w-4 h-4 text-amber-500" />
                                                    ) : (
                                                        <Circle className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                                                        {task.title}
                                                    </p>
                                                </div>
                                                <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600 cursor-grab" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
