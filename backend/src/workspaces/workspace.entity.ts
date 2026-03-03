import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { BillingSubscription } from '../billing/billing-subscription.entity';

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
  currencies: { code: string; name: string; symbol: string; isDefault: boolean }[];

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => BillingSubscription, (sub) => sub.workspace)
  billingSubscriptions: BillingSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
