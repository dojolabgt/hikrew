import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestoneSplits1773175355105 implements MigrationInterface {
  name = 'AddMilestoneSplits1773175355105';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."milestone_splits_status_enum" AS ENUM('assigned', 'paid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "milestone_splits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "milestone_id" uuid NOT NULL, "collaborator_workspace_id" uuid NOT NULL, "percentage" numeric(5,2), "amount" numeric(12,2) NOT NULL, "status" "public"."milestone_splits_status_enum" NOT NULL DEFAULT 'assigned', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4e7649100a52e85d53de66957b" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" ADD CONSTRAINT "FK_0b842471ea6f6d5d5fc66ffab89" FOREIGN KEY ("milestone_id") REFERENCES "payment_milestones"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" ADD CONSTRAINT "FK_bd2ab107ce1d540caa720b72e3d" FOREIGN KEY ("collaborator_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" DROP CONSTRAINT "FK_bd2ab107ce1d540caa720b72e3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" DROP CONSTRAINT "FK_0b842471ea6f6d5d5fc66ffab89"`,
    );
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
    await queryRunner.query(`DROP TABLE "milestone_splits"`);
    await queryRunner.query(
      `DROP TYPE "public"."milestone_splits_status_enum"`,
    );
  }
}
