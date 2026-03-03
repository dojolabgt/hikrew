import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkspaceLocalizationFormatting1772500210199 implements MigrationInterface {
    name = 'WorkspaceLocalizationFormatting1772500210199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "language" character varying DEFAULT 'en-US'`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "timezone" character varying DEFAULT 'America/Guatemala'`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "dateFormat" character varying DEFAULT 'MM/DD/YYYY'`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "timeFormat" character varying DEFAULT '12h'`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "numberFormat" character varying DEFAULT 'US'`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "currencyFormat" character varying DEFAULT 'symbol-left'`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "firstDayOfWeek" character varying DEFAULT 'sunday'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "firstDayOfWeek"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "currencyFormat"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "numberFormat"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "timeFormat"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "dateFormat"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "timezone"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "language"`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "city" character varying`);
    }

}
