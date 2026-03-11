import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectsTable1773253727407 implements MigrationInterface {
  name = 'AddProjectsTable1773253727407';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."milestone_splits_status_enum" AS ENUM('assigned', 'paid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "milestone_splits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "milestone_id" uuid NOT NULL, "collaborator_workspace_id" uuid NOT NULL, "percentage" numeric(5,2), "amount" numeric(12,2) NOT NULL, "status" "public"."milestone_splits_status_enum" NOT NULL DEFAULT 'assigned', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4e7649100a52e85d53de66957b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."projects_status_enum" AS ENUM('active', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "deal_id" uuid NOT NULL, "name" character varying NOT NULL, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_1580c3f7b5d7a53b926f7e6002" UNIQUE ("deal_id"), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af78b8fc6857fe0a10d1bb1699" ON "projects" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1580c3f7b5d7a53b926f7e6002" ON "projects" ("deal_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_collaborators_role_enum" AS ENUM('viewer', 'editor')`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "role" "public"."project_collaborators_role_enum" NOT NULL DEFAULT 'viewer', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b5127c1db2bc3c9f5623328d13e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "project_id"`);
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
      `CREATE INDEX "IDX_5a994c441a4612d4a35e0927da" ON "clients" ("workspaceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b48860677afe62cd96e1265948" ON "clients" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fab024a65dc86a463a1d042ea7" ON "quotations" ("deal_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d0696dcb275b1754e3fc60bee" ON "deals" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a1770366da1de36b1efc62807" ON "deals" ("client_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" ADD CONSTRAINT "FK_0b842471ea6f6d5d5fc66ffab89" FOREIGN KEY ("milestone_id") REFERENCES "payment_milestones"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" ADD CONSTRAINT "FK_bd2ab107ce1d540caa720b72e3d" FOREIGN KEY ("collaborator_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_af78b8fc6857fe0a10d1bb1699e" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_1580c3f7b5d7a53b926f7e6002e" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_collaborators" ADD CONSTRAINT "FK_23bacaa9035c88b85468965f4ba" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_collaborators" ADD CONSTRAINT "FK_ecbe5053785a2a53a092672b1b5" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_collaborators" DROP CONSTRAINT "FK_ecbe5053785a2a53a092672b1b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_collaborators" DROP CONSTRAINT "FK_23bacaa9035c88b85468965f4ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_1580c3f7b5d7a53b926f7e6002e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_af78b8fc6857fe0a10d1bb1699e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" DROP CONSTRAINT "FK_bd2ab107ce1d540caa720b72e3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "milestone_splits" DROP CONSTRAINT "FK_0b842471ea6f6d5d5fc66ffab89"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a1770366da1de36b1efc62807"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d0696dcb275b1754e3fc60bee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fab024a65dc86a463a1d042ea7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b48860677afe62cd96e1265948"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5a994c441a4612d4a35e0927da"`,
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
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "project_id" character varying`,
    );
    await queryRunner.query(`DROP TABLE "project_collaborators"`);
    await queryRunner.query(
      `DROP TYPE "public"."project_collaborators_role_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1580c3f7b5d7a53b926f7e6002"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_af78b8fc6857fe0a10d1bb1699"`,
    );
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
    await queryRunner.query(`DROP TABLE "milestone_splits"`);
    await queryRunner.query(
      `DROP TYPE "public"."milestone_splits_status_enum"`,
    );
  }
}
