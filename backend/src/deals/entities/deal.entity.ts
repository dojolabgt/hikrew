import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/workspace.entity';
import { Client } from '../../clients/client.entity';
import { DealStatus } from '../enums/deal-status.enum';
import { Brief } from './brief.entity';
import { Quotation } from './quotation.entity';
import { PaymentPlan } from './payment-plan.entity';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column()
  name: string;

  @Column({ nullable: true, unique: false })
  slug: string; // e.g. "branding-empresa-abc-4f2e" — unique per workspace enforced in service

  @Column({ nullable: true, type: 'uuid', unique: true })
  publicToken: string;

  @Column({
    type: 'enum',
    enum: DealStatus,
    default: DealStatus.DRAFT,
  })
  status: DealStatus;

  // Immutability snapshots
  @Column({ type: 'jsonb', nullable: true })
  currency: any; // Saves { code, symbol, format }

  @Column({ type: 'jsonb', nullable: true })
  taxes: any[]; // Array of WorkspaceTax objects snapped at creation

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  wonAt: Date;

  @Column({ nullable: true, default: 'brief' })
  currentStep: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  /** Carta de Introducción o texto de bienvenida para la Propuesta/Cotización */
  @Column({ type: 'text', nullable: true })
  proposalIntro: string;

  /** Términos y condiciones o notas contractuales específicas de esta Propuesta */
  @Column({ type: 'text', nullable: true })
  proposalTerms: string;

  /** Fecha de caducidad o validez de la propuesta comercial */
  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations

  // 1 to 1 with Brief
  @OneToOne(() => Brief, (brief) => brief.deal, {
    cascade: true,
    nullable: true,
  })
  brief: Brief;

  // 1 to Many with Quotations (A/B options)
  @OneToMany(() => Quotation, (quotation) => quotation.deal, { cascade: true })
  quotations: Quotation[];

  // 1 to 1 with Payment Plan (attached to the approved quotation usually)
  @OneToOne(() => PaymentPlan, (paymentPlan) => paymentPlan.deal, {
    cascade: true,
    nullable: true,
  })
  paymentPlan: PaymentPlan;

  // TODO: Add Project relation once Execution module is built
  @Column({ name: 'project_id', nullable: true })
  projectId: string;
}
