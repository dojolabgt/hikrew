import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceQuotingFields1772478112677 implements MigrationInterface {
  name = 'ServiceQuotingFields1772478112677';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN "defaultPrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "sku" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "basePrice" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."services_unittype_enum" AS ENUM('HOUR', 'PROJECT', 'MONTH', 'UNIT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "unitType" "public"."services_unittype_enum" NOT NULL DEFAULT 'UNIT'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."services_chargetype_enum" AS ENUM('ONE_TIME', 'HOURLY', 'RECURRING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "chargeType" "public"."services_chargetype_enum" NOT NULL DEFAULT 'ONE_TIME'`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "internalCost" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "isTaxable" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "imageUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "estimatedDeliveryDays" integer`,
    );
    await queryRunner.query(`ALTER TABLE "services" ADD "specificTerms" text`);
    await queryRunner.query(`ALTER TABLE "services" ADD "metadata" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "metadata"`);
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN "specificTerms"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN "estimatedDeliveryDays"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "imageUrl"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "isTaxable"`);
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN "internalCost"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "chargeType"`);
    await queryRunner.query(`DROP TYPE "public"."services_chargetype_enum"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "unitType"`);
    await queryRunner.query(`DROP TYPE "public"."services_unittype_enum"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "basePrice"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "sku"`);
    await queryRunner.query(
      `ALTER TABLE "services" ADD "defaultPrice" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }
}
