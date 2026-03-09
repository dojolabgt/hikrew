import { MigrationInterface, QueryRunner } from "typeorm";

export class DealsModuleEnhancements1772800000000 implements MigrationInterface {
    name = 'DealsModuleEnhancements1772800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add currentStep and notes to deals
        await queryRunner.query(`ALTER TABLE "deals" ADD "currentStep" character varying DEFAULT 'brief'`);
        await queryRunner.query(`ALTER TABLE "deals" ADD "notes" text`);

        // Add unitType enum and internalCost to quotation_items
        await queryRunner.query(`CREATE TYPE "public"."quotation_items_unittype_enum" AS ENUM('HOUR', 'PROJECT', 'MONTH', 'UNIT')`);
        await queryRunner.query(`ALTER TABLE "quotation_items" ADD "unitType" "public"."quotation_items_unittype_enum" DEFAULT 'UNIT'`);
        await queryRunner.query(`ALTER TABLE "quotation_items" ADD "internalCost" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quotation_items" DROP COLUMN "internalCost"`);
        await queryRunner.query(`ALTER TABLE "quotation_items" DROP COLUMN "unitType"`);
        await queryRunner.query(`DROP TYPE "public"."quotation_items_unittype_enum"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "currentStep"`);
    }
}
