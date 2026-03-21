import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceDriveRootFolder1774200000000 implements MigrationInterface {
    name = 'AddWorkspaceDriveRootFolder1774200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD COLUMN IF NOT EXISTS "google_drive_root_folder_id"   VARCHAR   NULL,
            ADD COLUMN IF NOT EXISTS "google_drive_root_folder_name" VARCHAR   NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "workspaces"
            DROP COLUMN IF EXISTS "google_drive_root_folder_id",
            DROP COLUMN IF EXISTS "google_drive_root_folder_name"
        `);
    }
}
