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
import { Client } from '../../clients/client.entity';
import { ProjectStatus } from '../enums/project-status.enum';
import { ProjectCollaborator } from './project-collaborator.entity';
import { ProjectBrief } from './project-brief.entity';

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

  // ─── Origin (deal or standalone) ──────────────────────────────────────────

  @Index()
  @Column({ type: 'uuid', name: 'deal_id', nullable: true })
  dealId: string | null;

  /** Deal that originated this project. Null for standalone projects. */
  @OneToOne(() => Deal, (deal) => deal.project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal | null;

  // ─── Direct client (for standalone projects) ───────────────────────────────

  @Index()
  @Column({ type: 'uuid', name: 'client_id', nullable: true })
  clientId: string | null;

  /** Client directly assigned (standalone projects). Deal-based projects use deal.client. */
  @ManyToOne(() => Client, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;

  // ─── Core fields ───────────────────────────────────────────────────────────

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** ISO currency code (e.g. 'USD'). For deal-based projects use deal.currency.code. */
  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  /** Agreed budget for standalone projects. For deal-based use quotation total. */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget: number | null;

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

  // ─── Relations ─────────────────────────────────────────────────────────────

  @OneToMany(() => ProjectCollaborator, (c) => c.project, { cascade: true })
  collaborators: ProjectCollaborator[];

  @OneToMany(() => ProjectBrief, (b) => b.project, { cascade: true })
  briefs: ProjectBrief[];

  // ─── Google Drive ──────────────────────────────────────────────────────────

  @Column({ type: 'varchar', nullable: true, name: 'drive_folder_id' })
  driveFolderId: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'drive_folder_url' })
  driveFolderUrl: string | null;

  // ─── Client portal settings ────────────────────────────────────────────────

  /** Allow the client to upload files to this project via the public deal page */
  @Column({ type: 'boolean', default: false, name: 'client_uploads_enabled' })
  clientUploadsEnabled: boolean;

  // ─── PDF generation tracking ───────────────────────────────────────────────

  /** Tracks which PDFs have been generated so the button knows what's pending. */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'generated_documents',
    default: null,
  })
  generatedDocuments: {
    quotationGenerated: boolean;
    generatedBriefIds: string[];
  } | null;
}
