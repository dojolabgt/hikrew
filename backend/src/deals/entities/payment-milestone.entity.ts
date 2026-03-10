import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentPlan } from './payment-plan.entity';
import { PaymentMilestoneStatus } from '../enums/deal-status.enum';

@Entity('payment_milestones')
export class PaymentMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_plan_id' })
  paymentPlanId: string;

  @ManyToOne(() => PaymentPlan, (plan) => plan.milestones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_plan_id' })
  paymentPlan: PaymentPlan;

  @Column()
  name: string; // e.g. "Anticipo", "Contra entrega", "Hito 1"

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  percentage: number; // e.g. 50.00

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentMilestoneStatus,
    default: PaymentMilestoneStatus.PENDING,
  })
  status: PaymentMilestoneStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
