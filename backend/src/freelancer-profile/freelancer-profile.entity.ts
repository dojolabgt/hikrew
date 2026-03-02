import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export type FreelancerPlan = 'free' | 'pro' | 'premium';

@Entity('freelancer_profiles')
export class FreelancerProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column()
    @Index({ unique: true })
    userId: string;

    @Column({ type: 'varchar', nullable: true })
    businessName: string | null;

    @Column({ type: 'varchar', nullable: true })
    logo: string | null;

    @Column({ type: 'varchar', nullable: true })
    brandColor: string | null;

    /**
     * Stored encrypted via EncryptionService (AES-256-GCM).
     * Never return these fields raw in any response.
     */
    @Column({ type: 'varchar', nullable: true, select: false })
    recurrentePublicKey: string | null;

    @Column({ type: 'varchar', nullable: true, select: false })
    recurrentePrivateKey: string | null;

    @Column({ type: 'varchar', default: 'free' })
    plan: FreelancerPlan;

    @Column({ type: 'timestamptz', nullable: true })
    planExpiresAt: Date | null;

    @Column({ default: 0 })
    quotesThisMonth: number;

    @Column({ type: 'timestamptz', nullable: true })
    quotesMonthReset: Date | null;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
