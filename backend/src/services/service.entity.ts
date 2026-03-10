import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Workspace } from '../workspaces/workspace.entity';

export enum ServiceUnitType {
  HOUR = 'HOUR',
  PROJECT = 'PROJECT',
  MONTH = 'MONTH',
  UNIT = 'UNIT',
}

export enum ServiceChargeType {
  ONE_TIME = 'ONE_TIME',
  HOURLY = 'HOURLY',
  RECURRING = 'RECURRING',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.billingSubscriptions) // Adjust relation name if needed later
  workspace: Workspace;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice: number;

  @Column({
    type: 'enum',
    enum: ServiceUnitType,
    default: ServiceUnitType.UNIT,
  })
  unitType: ServiceUnitType;

  @Column({
    type: 'enum',
    enum: ServiceChargeType,
    default: ServiceChargeType.ONE_TIME,
  })
  chargeType: ServiceChargeType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  internalCost: number;

  @Column({ default: true })
  isTaxable: boolean;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', nullable: true })
  estimatedDeliveryDays: number;

  @Column({ type: 'text', nullable: true })
  specificTerms: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 3, default: 'GTQ' })
  currency: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
