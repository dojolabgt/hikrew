import { MigrationInterface, QueryRunner } from "typeorm";

export class ServiceCurrencyToVarchar1772655577823 implements MigrationInterface {
    name = 'ServiceCurrencyToVarchar1772655577823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_taxes" DROP CONSTRAINT "FK_workspace_taxes_workspace"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_taxes_workspace_id"`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" DROP CONSTRAINT "UQ_workspace_taxes_key"`);
        await queryRunner.query(`ALTER TABLE "workspaces" ALTER COLUMN "useCases" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "currency"`);
        await queryRunner.query(`DROP TYPE "public"."services_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "services" ADD "currency" character varying(3) NOT NULL DEFAULT 'GTQ'`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "taxIdentifiers" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" ADD CONSTRAINT "FK_1f2b76e5c6d5e05df8b01224ed1" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_taxes" DROP CONSTRAINT "FK_1f2b76e5c6d5e05df8b01224ed1"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "taxIdentifiers" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "currency"`);
        await queryRunner.query(`CREATE TYPE "public"."services_currency_enum" AS ENUM('GTQ', 'USD')`);
        await queryRunner.query(`ALTER TABLE "services" ADD "currency" "public"."services_currency_enum" NOT NULL DEFAULT 'GTQ'`);
        await queryRunner.query(`ALTER TABLE "workspaces" ALTER COLUMN "useCases" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" ADD CONSTRAINT "UQ_workspace_taxes_key" UNIQUE ("workspace_id", "key")`);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_taxes_workspace_id" ON "workspace_taxes" ("workspace_id") `);
        await queryRunner.query(`ALTER TABLE "workspace_taxes" ADD CONSTRAINT "FK_workspace_taxes_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
