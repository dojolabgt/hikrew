import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workspace } from './workspace.entity';

export type TaxAppliesTo = 'all' | 'services' | 'products';

@Entity('workspace_taxes')
export class WorkspaceTax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  /** Slug único dentro del workspace, ej. "iva", "isr_retencion" */
  @Column()
  key: string;

  /** Nombre visible en la UI, ej. "IVA", "Retención ISR" */
  @Column()
  label: string;

  /** Tasa decimal, ej. 0.12 para 12% */
  @Column({ type: 'decimal', precision: 6, scale: 4 })
  rate: number;

  /** A qué tipo de ítems aplica */
  @Column({ name: 'applies_to', type: 'varchar', default: 'all' })
  appliesTo: TaxAppliesTo;

  /** Descripción opcional para el usuario */
  @Column({ nullable: true })
  description: string;

  /** Impuesto principal del workspace (solo uno puede serlo) */
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  /** Activo = se incluye en cotizaciones/cobros */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /** Orden de visualización en la UI */
  @Column({ name: 'order', type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
