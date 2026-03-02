import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Workspace } from '../workspaces/workspace.entity';

export enum ServiceCurrency {
    GTQ = 'GTQ',
    USD = 'USD',
}

@Entity('services')
export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    workspaceId: string;

    @ManyToOne(() => Workspace, (workspace) => workspace.billingSubscriptions) // Adjust relation name if needed later
    workspace: Workspace;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    defaultPrice: number;

    @Column({ type: 'enum', enum: ServiceCurrency, default: ServiceCurrency.GTQ })
    currency: ServiceCurrency;

    @Column({ nullable: true })
    category: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
