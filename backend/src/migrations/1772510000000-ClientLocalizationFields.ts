import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClientLocalizationFields1772510000000 implements MigrationInterface {
  name = 'ClientLocalizationFields1772510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add type enum
    await queryRunner.query(
      `CREATE TYPE "public"."clients_type_enum" AS ENUM('person', 'company')`,
    );

    // Add new columns to clients table
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "country" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "type" "public"."clients_type_enum" NOT NULL DEFAULT 'person'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD "taxIdentifiers" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(`ALTER TABLE "clients" ADD "address" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "address"`);
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN "taxIdentifiers"`,
    );
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "phone"`);
    await queryRunner.query(`DROP TYPE "public"."clients_type_enum"`);
  }
}
