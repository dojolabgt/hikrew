import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/workspace.entity';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('workspace_connections')
export class WorkspaceConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inviter_workspace_id' })
  inviterWorkspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_workspace_id' })
  inviterWorkspace: Workspace;

  @Column({ name: 'invitee_workspace_id', nullable: true })
  inviteeWorkspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitee_workspace_id' })
  inviteeWorkspace: Workspace;

  @Column({ name: 'invite_email', type: 'varchar', nullable: true })
  inviteEmail: string | null;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
