import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { WorkspaceTax } from './workspace-tax.entity';
import { BillingSubscription } from '../billing/billing-subscription.entity';
import { WorkspaceConnection } from '../connections/entities/workspace-connection.entity';
import { ProjectCollaborator } from '../projects/entities/project-collaborator.entity';

export enum WorkspacePlan {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Mi Espacio' })
  businessName: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  brandColor: string;

  @Column({ select: false, nullable: true })
  recurrentePublicKey: string;

  @Column({ select: false, nullable: true })
  recurrentePrivateKey: string;

  @Column({ type: 'enum', enum: WorkspacePlan, default: WorkspacePlan.FREE })
  plan: WorkspacePlan;

  @Column({ type: 'timestamptz', nullable: true })
  planExpiresAt: Date;

  @Column({ type: 'int', default: 0 })
  quotesThisMonth: number;

  @Column({ type: 'timestamptz', nullable: true })
  quotesMonthReset: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  taxType: string;

  // Language & Region settings
  @Column({ nullable: true, default: 'en-US' })
  language: string;

  @Column({ nullable: true, default: 'America/Guatemala' })
  timezone: string;

  @Column({ nullable: true, default: 'MM/DD/YYYY' })
  dateFormat: string;

  @Column({ nullable: true, default: '12h' })
  timeFormat: string;

  @Column({ nullable: true, default: 'US' })
  numberFormat: string;

  @Column({ nullable: true, default: 'symbol-left' })
  currencyFormat: string;

  @Column({ nullable: true, default: 'sunday' })
  firstDayOfWeek: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  currencies: {
    code: string;
    name: string;
    symbol: string;
    isDefault: boolean;
  }[];

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  useCases: string[];

  @Column({ default: false })
  onboardingCompleted: boolean;

  /** Los precios en cotizaciones/cobros ya incluyen el impuesto principal */
  @Column({ name: 'tax_inclusive_pricing', default: false })
  taxInclusivePricing: boolean;

  /** El usuario quiere recibir resúmenes mensuales de impuestos */
  @Column({ name: 'tax_reporting', default: false })
  taxReporting: boolean;

  /** Términos y Condiciones por defecto que se inyectan a cada nueva Propuesta/Deal */
  @Column({ type: 'text', nullable: true, name: 'default_proposal_terms' })
  defaultProposalTerms: string;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => BillingSubscription, (sub) => sub.workspace)
  billingSubscriptions: BillingSubscription[];

  @OneToMany(() => WorkspaceTax, (tax) => tax.workspace)
  taxes: WorkspaceTax[];

  @OneToMany(
    () => WorkspaceConnection,
    (connection) => connection.inviterWorkspace,
  )
  connectionsSent: WorkspaceConnection[];

  @OneToMany(
    () => WorkspaceConnection,
    (connection) => connection.inviteeWorkspace,
  )
  connectionsReceived: WorkspaceConnection[];

  @OneToMany(
    () => ProjectCollaborator,
    (collaborator) => collaborator.workspace,
  )
  projectsCollaborating: ProjectCollaborator[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
