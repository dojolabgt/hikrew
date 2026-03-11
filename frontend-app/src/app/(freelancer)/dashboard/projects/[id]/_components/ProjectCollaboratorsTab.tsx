'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/use-network';
import { useProjects } from '@/hooks/use-projects';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Plus, Trash2, Users, Eye, Pencil } from 'lucide-react';

import { ProjectData } from '../layout';

interface ProjectCollaboratorsTabProps {
    project: ProjectData;
    isViewer: boolean;
    onUpdate: () => void;
}

export function ProjectCollaboratorsTab({ project, isViewer, onUpdate }: ProjectCollaboratorsTabProps) {
    const { activeWorkspace } = useAuth();
    const { networkData, fetchConnections } = useNetwork();
    const { addCollaborator, removeCollaborator } = useProjects();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<Record<string, 'viewer' | 'editor'>>({});

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const existingCollaboratorsIds = project?.collaborators?.map((c) => c.workspace.id) || [];

    const handleAdd = async (workspaceId: string) => {
        setIsLoading(true);
        const role = selectedRoles[workspaceId] || 'editor';
        const added = await addCollaborator(project.id, { collaboratorWorkspaceId: workspaceId, role });
        if (added) {
            setSelectedRoles(prev => {
                const newState = { ...prev };
                delete newState[workspaceId];
                return newState;
            });
            onUpdate();
        }
        setIsLoading(false);
    };

    const handleRemove = async (collaboratorId: string) => {
        setIsLoading(true);
        const removed = await removeCollaborator(project.id, collaboratorId);
        if (removed) onUpdate();
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header info */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Equipo del Proyecto
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                    Gestiona los freelancers y agencias invitadas a participar en la ejecución de este proyecto.
                </p>
            </div>

            {/* Current Collaborators */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4 tracking-tight">Colaboradores Actuales</h3>
                {!project?.collaborators || project.collaborators.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic bg-zinc-50/50 dark:bg-zinc-900/20 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                        No hay colaboradores en este proyecto.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {project.collaborators.map((collaborator) => (
                            <div key={collaborator.id} className="flex items-center justify-between p-3.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/30 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                                <div className="flex items-center gap-3.5">
                                    <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <AvatarImage src={collaborator.workspace.logo || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                            {collaborator.workspace.businessName?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold leading-none text-zinc-900 dark:text-zinc-100">
                                            {collaborator.workspace.businessName}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            {collaborator.role === 'editor' ? (
                                                <Pencil className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                                <Eye className="w-3 h-3 text-indigo-500" />
                                            )}
                                            <p className="text-xs text-zinc-500">
                                                Rol: <span className="capitalize font-medium text-zinc-700 dark:text-zinc-300">{collaborator.role === 'editor' ? 'Editor' : 'Lector'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {!isViewer && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 w-8 p-0 rounded-lg"
                                        onClick={() => handleRemove(collaborator.id)}
                                        disabled={isLoading}
                                        title="Eliminar colaborador"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add from Network */}
            {!isViewer && (
                <div className="bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-1 tracking-tight">Invitar desde tu Red</h3>
                    <p className="text-xs text-zinc-500 mb-4">Selecciona freelancers de tus conexiones para agregarlos al proyecto.</p>
                    
                    {!networkData.active || networkData.active.length === 0 ? (
                        <p className="text-sm text-zinc-500 italic p-3 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            Aún no tienes conexiones activas en tu red. Ve a la sección &quot;Mi Red&quot; para invitar talentos a trabajar contigo.
                        </p>
                    ) : (
                        <div className="grid gap-3">
                            {networkData.active.map((conn) => {
                                const partner = conn.inviterWorkspace?.id === activeWorkspace?.id 
                                    ? conn.inviteeWorkspace 
                                    : conn.inviterWorkspace;
                                if (!partner) return null;

                                const isAdded = existingCollaboratorsIds.includes(partner.id);

                                return (
                                    <div key={conn.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors gap-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={partner.logo || undefined} />
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs">
                                                    {partner.businessName?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium">{partner.businessName}</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            {!isAdded && (
                                                <Select
                                                    value={selectedRoles[partner.id] || 'editor'}
                                                    onValueChange={(val: 'viewer' | 'editor') => 
                                                        setSelectedRoles(prev => ({ ...prev, [partner.id]: val }))
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    <SelectTrigger className="h-8 w-[110px] text-xs shrink-0 bg-transparent">
                                                        <SelectValue placeholder="Rol" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="editor" className="text-xs">Editor</SelectItem>
                                                        <SelectItem value="viewer" className="text-xs">Lector</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            <Button
                                                variant={isAdded ? "secondary" : "default"}
                                                size="sm"
                                                className="h-8 text-xs sm:w-auto w-full"
                                                disabled={isAdded || isLoading}
                                                onClick={() => handleAdd(partner.id)}
                                            >
                                                {isAdded ? 'Agregado' : (
                                                    <><Plus className="w-3.5 h-3.5 mr-1.5" /> Añadir</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="flex justify-center mt-6">
                            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
