import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleDriveToWorkspace1773920000000 implements MigrationInterface {
  name = 'AddGoogleDriveToWorkspace1773920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "google_drive_access_token" text DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "google_drive_refresh_token" text DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "google_drive_email" character varying DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "google_drive_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "google_drive_refresh_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "google_drive_access_token"`,
    );
  }
}
