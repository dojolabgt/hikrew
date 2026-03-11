'use client';

import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/use-network';
import { useDeals } from '@/hooks/use-deals';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Plus, Trash2, Users, Eye, Pencil } from 'lucide-react';

interface CollaboratorsDrawerProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deal: Record<string, any>;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function DealCollaboratorsDrawer({ deal, isOpen, onClose, onUpdate }: CollaboratorsDrawerProps) {
    const { activeWorkspace } = useAuth();
    const { networkData, fetchConnections } = useNetwork();
    const { addCollaborator, removeCollaborator } = useDeals();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<Record<string, 'viewer' | 'editor'>>({});

    const isViewer = React.useMemo(() => {
        if (!activeWorkspace || !deal?.collaborators) return false;
        const collab = deal.collaborators.find((c: { workspace: { id: string }, role: string }) => c.workspace.id === activeWorkspace.id);
        return collab?.role === 'viewer';
    }, [activeWorkspace, deal]);

    useEffect(() => {
        if (isOpen) {
            fetchConnections();
        }
    }, [isOpen, fetchConnections]);

    const existingCollaboratorsIds = deal?.collaborators?.map((c: { workspace: { id: string } }) => c.workspace.id) || [];

    const handleAdd = async (workspaceId: string) => {
        setIsLoading(true);
        const role = selectedRoles[workspaceId] || 'editor';
        const added = await addCollaborator(deal.id, { collaboratorWorkspaceId: workspaceId, role });
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
        const removed = await removeCollaborator(deal.id, collaboratorId);
        if (removed) onUpdate();
        setIsLoading(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6">
                <SheetHeader className="mb-6 mt-2">
                    <SheetTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> Colaboradores
                    </SheetTitle>
                    <SheetDescription>
                        Agrega conexiones a esta propuesta para que puedan visualizar y ayudar a editar el trato.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 pb-6">
                    {/* Current Collaborators */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 tracking-tight">Colaboradores Actuales</h3>
                        {!deal?.collaborators || deal.collaborators.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">No hay colaboradores en esta propuesta.</p>
                        ) : (
                            <div className="space-y-3">
                                {deal.collaborators.map((collaborator: { id: string; role: string; workspace: { businessName: string; logo: string | null } }) => (
                                    <div key={collaborator.id} className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={collaborator.workspace.logo || undefined} />
                                                <AvatarFallback>{collaborator.workspace.businessName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{collaborator.workspace.businessName}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {collaborator.role === 'editor' ? (
                                                        <Pencil className="w-3 h-3 text-emerald-500" />
                                                    ) : (
                                                        <Eye className="w-3 h-3 text-indigo-500" />
                                                    )}
                                                    <p className="text-xs text-zinc-500">
                                                        Rol: <span className="capitalize font-medium">{collaborator.role === 'editor' ? 'Editor' : 'Lector'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {!isViewer && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 h-7"
                                                onClick={() => handleRemove(collaborator.id)}
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add from Network */}
                    {!isViewer && (
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-semibold mb-3 tracking-tight">Tu Red</h3>
                        {!networkData.active || networkData.active.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">
                                Aún no tienes conexiones. Ve a &quot;Mi Red&quot; para invitar colaboradores.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {networkData.active.map((conn) => {
                                    const partner = conn.inviterWorkspace?.id === activeWorkspace?.id 
                                        ? conn.inviteeWorkspace 
                                        : conn.inviterWorkspace;
                                    if (!partner) return null;

                                    const isAdded = existingCollaboratorsIds.includes(partner.id);

                                    return (
                                        <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={partner.logo || undefined} />
                                                    <AvatarFallback>{partner.businessName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <p className="text-sm font-medium">{partner.businessName}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!isAdded && (
                                                    <Select
                                                        value={selectedRoles[partner.id] || 'editor'}
                                                        onValueChange={(val: 'viewer' | 'editor') => 
                                                            setSelectedRoles(prev => ({ ...prev, [partner.id]: val }))
                                                        }
                                                        disabled={isLoading}
                                                    >
                                                        <SelectTrigger className="h-7 w-[100px] text-xs">
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
                                                    className="h-7 text-xs"
                                                    disabled={isAdded || isLoading}
                                                    onClick={() => handleAdd(partner.id)}
                                                >
                                                    {isAdded ? 'Agregado' : (
                                                        <><Plus className="w-3.5 h-3.5 mr-1" /> Añadir</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex justify-center mt-4">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
