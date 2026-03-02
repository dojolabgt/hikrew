export interface Client {
    id: string;
    workspaceId: string;
    linkedUserId?: string;
    name: string;
    email: string;
    whatsapp?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClientDto {
    name: string;
    email: string;
    whatsapp?: string;
    notes?: string;
    linkedUserId?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> { }
