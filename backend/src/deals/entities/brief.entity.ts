import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Deal } from './deal.entity';
import { BriefTemplate } from './brief-template.entity';

@Entity('briefs')
export class Brief {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'deal_id' })
  dealId: string;

  @OneToOne(() => Deal, (deal) => deal.brief, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @ManyToOne(() => BriefTemplate, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template: BriefTemplate;

  @Column({ unique: true, nullable: true })
  publicToken: string;

  // Stores the actual replies. Format: { fieldId: answerValue }
  @Column({ type: 'jsonb', default: {} })
  responses: any;

  @Column({ default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
