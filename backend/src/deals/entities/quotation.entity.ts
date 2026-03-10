import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Deal } from './deal.entity';
import { QuotationItem } from './quotation-item.entity';
import { PaymentPlan } from './payment-plan.entity';

@Entity('quotations') // Migrating the old one conceptually
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'deal_id' })
  dealId: string;

  @ManyToOne(() => Deal, (deal) => deal.quotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;

  // For multiple options (e.g. "Opción A: Plan Básico", "Opción B: Plan Full")
  @Column({ default: 'Opción 1' })
  optionName: string;

  // Optional cover letter or introduction specific to this quotation option
  @Column({ type: 'text', nullable: true })
  description: string;

  // Currency code for this quotation (e.g. 'USD', 'GTQ'). Null = use workspace default.
  @Column({ type: 'varchar', length: 10, nullable: true, default: null })
  currency: string | null;

  @Column({ default: false })
  isApproved: boolean; // Only one quotation per deal should be true at WON

  // Subtotals and totals can be calculated computationally, but we can store snapshots
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  taxTotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => QuotationItem, (item) => item.quotation, { cascade: true })
  items: QuotationItem[];

  // Inverse relation to PaymentPlan that is linked to quotes
  @OneToOne(() => PaymentPlan, (pp) => pp.quotation, { nullable: true })
  paymentPlan: PaymentPlan;
}
