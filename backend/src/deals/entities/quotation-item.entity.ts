import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Quotation } from './quotation.entity';
import { ServiceChargeType } from '../../services/service.entity';

@Entity('quotation_items')
export class QuotationItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'quotation_id' })
    quotationId: string;

    @ManyToOne(() => Quotation, (quotation) => quotation.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quotation_id' })
    quotation: Quotation;

    // Snapshot of what the service was at the time of creation
    @Column({ name: 'service_id', nullable: true })
    serviceId: string; // Loose reference, no strict foreign key necessary for snapshots

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ServiceChargeType,
        default: ServiceChargeType.ONE_TIME,
    })
    chargeType: ServiceChargeType;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    price: number;

    @Column({ type: 'int', default: 1 })
    quantity: number;

    @Column({ type: 'boolean', default: true })
    isTaxable: boolean;

    @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
    discount: number; // Discount exact amount for the item

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
