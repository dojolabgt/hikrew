import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceTax } from './workspace-tax.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class WorkspaceTaxesService {
    private readonly logger = new Logger(WorkspaceTaxesService.name);

    constructor(
        @InjectRepository(WorkspaceTax)
        private readonly taxRepository: Repository<WorkspaceTax>,
    ) { }

    /** Devuelve todos los taxes del workspace, ordenados */
    async findAll(workspaceId: string): Promise<WorkspaceTax[]> {
        return this.taxRepository.find({
            where: { workspaceId },
            order: { order: 'ASC', createdAt: 'ASC' },
        });
    }

    /** Crea un nuevo tax. La key debe ser única dentro del workspace. */
    async create(
        workspaceId: string,
        dto: CreateTaxDto,
    ): Promise<WorkspaceTax> {
        const existing = await this.taxRepository.findOne({
            where: { workspaceId, key: dto.key },
        });
        if (existing) {
            throw new ConflictException(
                `Ya existe un impuesto con la clave "${dto.key}" en este workspace.`,
            );
        }

        // Si el nuevo tax es isDefault, quitarle ese flag a los demás
        if (dto.isDefault) {
            await this.taxRepository.update({ workspaceId }, { isDefault: false });
        }

        const tax = this.taxRepository.create({ ...dto, workspaceId });
        return this.taxRepository.save(tax);
    }

    /** Actualiza un tax existente */
    async update(
        workspaceId: string,
        id: string,
        dto: UpdateTaxDto,
    ): Promise<WorkspaceTax> {
        const tax = await this.findOne(workspaceId, id);

        // Si pasa a ser isDefault, limpia los demás
        if (dto.isDefault && !tax.isDefault) {
            await this.taxRepository.update({ workspaceId }, { isDefault: false });
        }

        Object.assign(tax, dto);
        return this.taxRepository.save(tax);
    }

    /** Elimina un tax */
    async remove(workspaceId: string, id: string): Promise<{ deleted: boolean }> {
        const tax = await this.findOne(workspaceId, id);
        await this.taxRepository.remove(tax);
        return { deleted: true };
    }

    /**
     * Pobla los taxes del workspace desde el pais.json del frontend.
     * Se llama una vez al terminar el onboarding con el country seleccionado.
     * Si ya existen taxes para el workspace, no hace nada (idempotente).
     */
    async seedFromCountry(
        workspaceId: string,
        taxes: Array<{
            key: string;
            label: string;
            rate: number;
            appliesTo?: 'all' | 'services' | 'products';
            description?: string;
            isDefault?: boolean;
        }>,
    ): Promise<WorkspaceTax[]> {
        const count = await this.taxRepository.count({ where: { workspaceId } });
        if (count > 0) {
            this.logger.log(
                `Workspace ${workspaceId} already has taxes — skipping seed.`,
            );
            return this.findAll(workspaceId);
        }

        const entities = taxes.map((t, index) =>
            this.taxRepository.create({
                workspaceId,
                key: t.key,
                label: t.label,
                rate: t.rate,
                appliesTo: t.appliesTo ?? 'all',
                description: t.description,
                isDefault: t.isDefault ?? false,
                isActive: true,
                order: index,
            }),
        );

        return this.taxRepository.save(entities);
    }

    /** Helper interno */
    private async findOne(
        workspaceId: string,
        id: string,
    ): Promise<WorkspaceTax> {
        const tax = await this.taxRepository.findOne({
            where: { id, workspaceId },
        });
        if (!tax) throw new NotFoundException('Impuesto no encontrado.');
        return tax;
    }
}
