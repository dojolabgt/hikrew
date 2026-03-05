import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/workspace.entity';

@Entity('brief_templates')
export class BriefTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id' })
    workspaceId: string;

    @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workspace_id' })
    workspace: Workspace;

    @Column()
    name: string; // e.g. "Pre-Brief Web Design"

    @Column({ type: 'text', nullable: true })
    description: string;

    // Stores the schema for dynamic generation
    // format could be array of { id, type: 'text'|'textarea'|'radio', question, required, options }
    @Column({ type: 'jsonb', default: [] })
    schema: any[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
