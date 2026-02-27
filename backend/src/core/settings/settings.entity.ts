import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('app_settings')
export class AppSettings {
  @PrimaryColumn()
  id: number;

  @Column()
  appName: string;

  @Column({ nullable: true })
  appLogo: string;

  @Column({ nullable: true })
  appFavicon: string;

  @Column()
  primaryColor: string;

  @Column()
  secondaryColor: string;

  @Column()
  allowRegistration: boolean;

  @Column()
  maintenanceMode: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
