import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Workspace } from '../workspaces/workspace.entity';

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    workspaceId: string;

    @ManyToOne(() => Workspace)
    workspace: Workspace;

    @Column({ nullable: true })
    linkedUserId: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    whatsapp: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
