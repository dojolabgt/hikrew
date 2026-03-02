import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../auth/constants/roles';
import { WorkspaceMember } from '../workspaces/workspace-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index() // Index for faster email lookups
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.FREELANCER })
  @Index() // Index for role-based queries
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ nullable: true })
  profileImage: string;

  @OneToMany(() => WorkspaceMember, member => member.user)
  workspaceMembers: WorkspaceMember[];

  @CreateDateColumn()
  @Index() // Index for sorting by creation date
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  @Index() // Index for soft-delete queries
  deletedAt: Date;
}
