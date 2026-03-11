// Page component for global admin user management
'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/features/admin/api';
import { User } from '@/lib/types/api.types';
import { WorkspaceMember } from '@/features/workspaces/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await adminApi.getAllUsers();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast.error("Error al obtener la lista de usuarios");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleUpgrade = async (workspaceId: string, plan: 'pro' | 'premium') => {
        setIsUpgrading(workspaceId);
        try {
            await adminApi.upgradeWorkspace(workspaceId, plan);
            toast.success(`Espacio actualizado a plan ${plan.toUpperCase()} correctamente`);
            // Refresh data
            const data = await adminApi.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error("Hubo un error al actualizar el espacio");
        } finally {
            setIsUpgrading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Gestión de Usuarios - Admin</h1>
            
            <div className="space-y-6">
                {users.map(user => (
                    <div key={user.id} className="bg-card border rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b pb-4">
                            <div>
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    {user.firstName} {user.lastName} 
                                    {user.role === 'admin' && <Badge variant="default" className="ml-2">Admin</Badge>}
                                </h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                Fecha de registro: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        {user.workspaceMembers && user.workspaceMembers.length > 0 ? (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                                    Espacios de trabajo
                                </h4>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {user.workspaceMembers.map((member: WorkspaceMember) => {
                                        const ws = member.workspace;
                                        if (!ws) return null;
                                        
                                        return (
                                            <div key={member.id} className="border rounded-md p-4 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-900/50">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-semibold text-base truncate pr-2" title={ws.businessName}>
                                                            {ws.businessName}
                                                        </span>
                                                        <Badge variant={ws.plan === 'free' ? 'secondary' : ws.plan === 'pro' ? 'default' : 'destructive'}>
                                                            {ws.plan.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mb-4">
                                                        Rol: <span className="capitalize">{member.role}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="pt-3 border-t flex flex-wrap gap-2">
                                                    {ws.plan !== 'premium' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="default"
                                                            className="flex-1 w-full text-xs"
                                                            disabled={isUpgrading === ws.id}
                                                            onClick={() => handleUpgrade(ws.id, 'premium')}
                                                        >
                                                            {isUpgrading === ws.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ArrowUpCircle className="w-3 h-3 mr-1" />}
                                                            Upgrade a Premium
                                                        </Button>
                                                    )}
                                                    {ws.plan === 'free' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="flex-1 w-full text-xs"
                                                            disabled={isUpgrading === ws.id}
                                                            onClick={() => handleUpgrade(ws.id, 'pro')}
                                                        >
                                                            {isUpgrading === ws.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ArrowUpCircle className="w-3 h-3 mr-1" />}
                                                            Upgrade a Pro
                                                        </Button>
                                                    )}
                                                    {ws.plan === 'premium' && (
                                                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center w-full py-1">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Plan máximo
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic mt-2">
                                Este usuario no pertenece a ningún espacio de trabajo.
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {users.length === 0 && !isLoading && (
                <div className="text-center p-12 border rounded-lg bg-card text-muted-foreground">
                    No se encontraron usuarios.
                </div>
            )}
        </div>
    );
}
