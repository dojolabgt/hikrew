import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Workspace } from '../workspaces/workspace.entity';

export type BillingInterval = 'month' | 'year';
export type BillingSubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unable_to_start';

@Entity('billing_subscriptions')
export class BillingSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The workspace this subscription belongs to */
  @Column({ type: 'uuid' })
  @Index()
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId', referencedColumnName: 'id' })
  workspace: Workspace;

  /** Recurrente checkout ID created when subscribing */
  @Column({ type: 'varchar' })
  recurrenteCheckoutId: string;

  /** Recurrente subscription ID — set when the checkout is paid (from webhook) */
  @Column({ type: 'varchar', nullable: true })
  recurrenteSubscriptionId: string | null;

  @Column({ type: 'varchar', default: 'month' })
  interval: BillingInterval;

  @Column({ type: 'varchar', default: 'pro' })
  plan: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: BillingSubscriptionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
