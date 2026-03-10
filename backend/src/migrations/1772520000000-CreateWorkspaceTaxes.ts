import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceTaxes1772520000000 implements MigrationInterface {
  name = 'CreateWorkspaceTaxes1772520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workspace_taxes" (
        "id"           UUID NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" UUID NOT NULL,
        "key"          VARCHAR NOT NULL,
        "label"        VARCHAR NOT NULL,
        "rate"         DECIMAL(6,4) NOT NULL,
        "applies_to"   VARCHAR NOT NULL DEFAULT 'all',
        "description"  VARCHAR,
        "is_default"   BOOLEAN NOT NULL DEFAULT false,
        "is_active"    BOOLEAN NOT NULL DEFAULT true,
        "order"        INTEGER NOT NULL DEFAULT 0,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_taxes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workspace_taxes_workspace"
          FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id")
          ON DELETE CASCADE,
        CONSTRAINT "UQ_workspace_taxes_key"
          UNIQUE ("workspace_id", "key")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_workspace_taxes_workspace_id"
        ON "workspace_taxes" ("workspace_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_workspace_taxes_workspace_id"`);
    await queryRunner.query(`DROP TABLE "workspace_taxes"`);
  }
}
