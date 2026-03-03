import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkspaceCurrencies1772500923828 implements MigrationInterface {
    name = 'WorkspaceCurrencies1772500923828'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "currencies" jsonb DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "currencies"`);
    }

}
