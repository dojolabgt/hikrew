import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealSlug1772900000000 implements MigrationInterface {
  name = 'AddDealSlug1772900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add slug column (nullable for existing deals)
    await queryRunner.query(`ALTER TABLE "deals" ADD "slug" character varying`);

    // Backfill existing deals with a slug based on their name + short uuid suffix
    await queryRunner.query(`
            UPDATE "deals"
            SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9 ]', '', 'g'), '\s+', '-', 'g'))
                || '-' || SUBSTRING(REPLACE(id::text, '-', ''), 1, 6)
            WHERE "slug" IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "slug"`);
  }
}
