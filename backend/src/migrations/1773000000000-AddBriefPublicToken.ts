import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBriefPublicToken1773000000000 implements MigrationInterface {
  name = 'AddBriefPublicToken1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add publicToken column
    await queryRunner.query(
      `ALTER TABLE "briefs" ADD "publicToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "briefs" ADD CONSTRAINT "UQ_publicToken" UNIQUE ("publicToken")`,
    );

    // Backfill existing briefs with a random uuid
    // Generate via gen_random_uuid() which is available in pgcrypto (standard in postgres 13+)
    await queryRunner.query(`
            UPDATE "briefs"
            SET "publicToken" = gen_random_uuid()
            WHERE "publicToken" IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "briefs" DROP CONSTRAINT "UQ_publicToken"`,
    );
    await queryRunner.query(`ALTER TABLE "briefs" DROP COLUMN "publicToken"`);
  }
}
