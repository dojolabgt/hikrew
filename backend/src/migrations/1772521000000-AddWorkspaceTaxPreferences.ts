import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceTaxPreferences1772521000000 implements MigrationInterface {
  name = 'AddWorkspaceTaxPreferences1772521000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workspaces"
        ADD COLUMN IF NOT EXISTS "tax_inclusive_pricing" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "tax_reporting"         BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workspaces"
        DROP COLUMN IF EXISTS "tax_inclusive_pricing",
        DROP COLUMN IF EXISTS "tax_reporting"
    `);
  }
}
