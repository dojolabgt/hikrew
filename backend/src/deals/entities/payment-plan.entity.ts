import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Deal } from './deal.entity';
import { Quotation } from './quotation.entity';
import { PaymentMilestone } from './payment-milestone.entity';

@Entity('payment_plans')
export class PaymentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'deal_id' })
  dealId: string;

  @OneToOne(() => Deal, (deal) => deal.paymentPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;

  // Cualesquiera de la cotizaciones del trato que sea aprobada
  @Column({ name: 'quotation_id', nullable: true })
  quotationId: string;

  @OneToOne(() => Quotation, (quotation) => quotation.paymentPlan, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PaymentMilestone, (milestone) => milestone.paymentPlan, {
    cascade: true,
  })
  milestones: PaymentMilestone[];
}
