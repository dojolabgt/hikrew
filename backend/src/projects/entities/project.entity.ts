import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Workspace } from '../../workspaces/workspace.entity';
import { Deal } from '../../deals/entities/deal.entity';
import { ProjectStatus } from '../enums/project-status.enum';
import { ProjectCollaborator } from './project-collaborator.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Index()
  @Column({ name: 'deal_id' })
  dealId: string;

  // Relation to the deal that originated this project
  @OneToOne(() => Deal, (deal) => deal.project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(
    () => ProjectCollaborator,
    (collaborator) => collaborator.project,
    { cascade: true },
  )
  collaborators: ProjectCollaborator[];
}
