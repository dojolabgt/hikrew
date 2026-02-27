import { UsersTable } from "@/features/users/components/users-table";

export default function UsersPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col gap-4 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">
                    Administra y gestiona los usuarios del sistema.
                </p>
            </div>

            <UsersTable />
        </div>
    );
}
