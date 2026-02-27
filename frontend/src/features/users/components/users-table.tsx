"use client";

import React, { useEffect, useState } from "react";
import { User, getUsers } from "@/features/users/services/users-service";
import { Button } from "@/components/common/Button"; // Use Common Button
import { Input } from "@/components/common/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableContainer } from "@/components/common/Table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { UserAvatar } from "@/components/common/UserAvatar";
import { MoreHorizontal, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserDialog } from "./user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { Badge } from "@/components/common/Badge";
import type { InputChangeEvent } from "@/lib/types/events.types";
import { ITEMS_PER_PAGE, DEBOUNCE_DELAY } from "@/lib/constants";
import { UserRole, UserRoleLabels, UserRoleBadgeStyles } from "@/lib/types/enums";
import { useDebounce } from "@/hooks/useDebounce";

export function UsersTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Debounce search query to reduce API calls
    const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = ITEMS_PER_PAGE;

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users based on debounced search query
    const filteredUsers = users.filter((user) => {
        const query = debouncedSearchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            UserRoleLabels[user.role as UserRole].toLowerCase().includes(query)
        );
    });
    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getRoleBadge = (role: string) => {
        const userRole = role as UserRole;
        const style = UserRoleBadgeStyles[userRole] || "bg-gray-50 text-gray-600 border-gray-200";
        const label = UserRoleLabels[userRole] || role;

        return (
            <Badge variant="outline" className={`border ${style}`}>
                {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header / Search Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="relative w-full md:w-72 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 dark:text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input
                        placeholder="Buscar usuarios..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e: InputChangeEvent) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    {/* New User Button - First */}
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-gray-100 shadow-lg shadow-zinc-900/20 dark:shadow-white/10 px-4 flex-1 sm:flex-initial"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                    </Button>

                    {/* Pagination - Second */}
                    <div className="flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-1 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || isLoading}
                        >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Button>
                        <span className="text-xs font-medium px-2 text-gray-500 dark:text-zinc-400 min-w-[3rem] text-center">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || isLoading || totalPages === 0}
                        >
                            <span className="sr-only">Siguiente</span>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <TableContainer>
                <Table>
                    <TableHeader className="hidden md:table-header-group">
                        <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-zinc-800">
                            <TableHead className="text-zinc-700 dark:text-zinc-300">Usuario</TableHead>
                            <TableHead className="text-zinc-700 dark:text-zinc-300">Email</TableHead>
                            <TableHead className="text-center text-zinc-700 dark:text-zinc-300">Rol</TableHead>
                            <TableHead className="text-right text-zinc-700 dark:text-zinc-300">Fecha</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                                        <span className="text-sm text-gray-400 dark:text-zinc-500 animate-pulse">Cargando datos...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-gray-500 dark:text-zinc-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mb-2">
                                            <Search className="h-5 w-5 text-gray-300 dark:text-zinc-600" />
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white">No se encontraron usuarios</p>
                                        <p className="text-sm text-gray-400 dark:text-zinc-500">Intenta ajustar tu búsqueda</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedUsers.map((user) => (
                                <React.Fragment key={user.id}>
                                    {/* Desktop View (Table Row) */}
                                    <ContextMenu key={`desktop-${user.id}`}>
                                        <ContextMenuTrigger asChild>
                                            <TableRow className="group cursor-pointer hidden md:table-row">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar
                                                            user={user}
                                                            size="default"
                                                            showProfileCard={true}
                                                            className="border border-gray-100 dark:border-zinc-700 shadow-sm"
                                                            fallbackClassName="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-zinc-900 text-indigo-600 dark:text-indigo-400 font-medium"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500 dark:text-zinc-400">{user.email}</TableCell>
                                                <TableCell className="text-center">{getRoleBadge(user.role)}</TableCell>
                                                <TableCell className="text-sm text-gray-500 dark:text-zinc-400 text-right">
                                                    {format(new Date(user.createdAt), "dd MMM, yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-zinc-950/50 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                                            <DropdownMenuLabel className="text-xs text-gray-500 dark:text-zinc-400 font-normal">Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => setEditingUser(user)} className="cursor-pointer gap-2 text-gray-600 dark:text-zinc-300 focus:text-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-950/50 rounded-lg mx-1">
                                                                <Pencil className="h-3.5 w-3.5" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeletingUser(user)}
                                                                className="cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 rounded-lg mx-1 my-1"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-zinc-950/50 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                            <ContextMenuItem onClick={() => setEditingUser(user)} className="cursor-pointer gap-2 text-gray-600 dark:text-zinc-300 focus:text-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-950/50 rounded-lg mx-1 my-1">
                                                <Pencil className="h-3.5 w-3.5" />
                                                Editar Usuario
                                            </ContextMenuItem>
                                            <ContextMenuSeparator className="bg-gray-100 dark:bg-zinc-800" />
                                            <ContextMenuItem
                                                onClick={() => setDeletingUser(user)}
                                                className="cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50 rounded-lg mx-1 my-1"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Eliminar Usuario
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>

                                    {/* Mobile View (Card) - Rendered as a single cell spanning all columns */}
                                    <tr className="md:hidden border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                        <td colSpan={5} className="p-4 block">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar
                                                            user={user}
                                                            size="lg"
                                                            className="border border-gray-100 dark:border-zinc-700 shadow-sm"
                                                            fallbackClassName="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-zinc-900 text-indigo-600 dark:text-indigo-400 font-medium"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                            <p className="text-sm text-gray-500 dark:text-zinc-400 break-all">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                                            <DropdownMenuItem onClick={() => setEditingUser(user)} className="gap-2 text-gray-600 dark:text-zinc-300">
                                                                <Pencil className="h-3.5 w-3.5" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeletingUser(user)} className="gap-2 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50">
                                                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-zinc-800">
                                                    <div className="flex items-center gap-2">
                                                        {getRoleBadge(user.role)}
                                                    </div>
                                                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                                                        {format(new Date(user.createdAt), "dd MMM, yyyy", { locale: es })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Robust Bottom Pagination */}
                {!isLoading && filteredUsers.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30">
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            Mostrando <span className="font-medium text-gray-900 dark:text-white">{Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)}</span> a <span className="font-medium text-gray-900 dark:text-white">{Math.min(filteredUsers.length, currentPage * itemsPerPage)}</span> de <span className="font-medium text-gray-900 dark:text-white">{filteredUsers.length}</span> resultados
                        </p>

                        <div className="flex items-center gap-1">
                            {/* Numbered Pages */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "primary" : "ghost"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 p-0 rounded-lg text-xs font-medium transition-all ${currentPage === page
                                        ? "shadow-md shadow-zinc-900/10 dark:shadow-white/10"
                                        : "text-gray-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </TableContainer>


            <UserDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSuccess={fetchUsers}
            />

            <UserDialog
                open={!!editingUser}
                onOpenChange={(open) => !open && setEditingUser(null)}
                userToEdit={editingUser}
                onSuccess={fetchUsers}
            />

            <DeleteUserDialog
                open={!!deletingUser}
                onOpenChange={(open) => !open && setDeletingUser(null)}
                userToDelete={deletingUser}
                onSuccess={fetchUsers}
            />
        </div >
    );
}
