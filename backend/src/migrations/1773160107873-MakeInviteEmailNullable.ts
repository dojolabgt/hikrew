import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeInviteEmailNullable1773160107873 implements MigrationInterface {
  name = 'MakeInviteEmailNullable1773160107873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_connections" ALTER COLUMN "invite_email" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."quotation_items_chargetype_enum" RENAME TO "quotation_items_chargetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quotation_items_chargetype_enum" AS ENUM('ONE_TIME', 'HOURLY', 'RECURRING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "chargeType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "chargeType" TYPE "public"."quotation_items_chargetype_enum" USING "chargeType"::"text"::"public"."quotation_items_chargetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "chargeType" SET DEFAULT 'ONE_TIME'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."quotation_items_chargetype_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."quotation_items_unittype_enum" RENAME TO "quotation_items_unittype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quotation_items_unittype_enum" AS ENUM('HOUR', 'PROJECT', 'MONTH', 'UNIT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "unitType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "unitType" TYPE "public"."quotation_items_unittype_enum" USING "unitType"::"text"::"public"."quotation_items_unittype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "unitType" SET DEFAULT 'UNIT'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."quotation_items_unittype_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."quotation_items_unittype_enum_old" AS ENUM('HOUR', 'PROJECT', 'MONTH', 'UNIT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "unitType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "unitType" TYPE "public"."quotation_items_unittype_enum_old" USING "unitType"::"text"::"public"."quotation_items_unittype_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "unitType" SET DEFAULT 'UNIT'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."quotation_items_unittype_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."quotation_items_unittype_enum_old" RENAME TO "quotation_items_unittype_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quotation_items_chargetype_enum_old" AS ENUM('ONE_TIME', 'HOURLY', 'RECURRING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "chargeType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "chargeType" TYPE "public"."quotation_items_chargetype_enum_old" USING "chargeType"::"text"::"public"."quotation_items_chargetype_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ALTER COLUMN "chargeType" SET DEFAULT 'ONE_TIME'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."quotation_items_chargetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."quotation_items_chargetype_enum_old" RENAME TO "quotation_items_chargetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_connections" ALTER COLUMN "invite_email" SET NOT NULL`,
    );
  }
}
