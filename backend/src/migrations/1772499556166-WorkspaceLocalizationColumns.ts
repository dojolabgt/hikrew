import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkspaceLocalizationColumns1772499556166 implements MigrationInterface {
    name = 'WorkspaceLocalizationColumns1772499556166'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "taxId" character varying`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "taxType" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "taxType"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "taxId"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "country"`);
    }

}
