import { MigrationInterface, QueryRunner } from 'typeorm';

export class DealsPipelineEntities1772671830533 implements MigrationInterface {
  name = 'DealsPipelineEntities1772671830533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "brief_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "schema" jsonb NOT NULL DEFAULT '[]', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1ee9b202122abad54a23a53289" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "briefs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deal_id" uuid NOT NULL, "template_id" uuid, "responses" jsonb NOT NULL DEFAULT '{}', "isCompleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_5f9b244e3e67b330e2de093ac7" UNIQUE ("deal_id"), CONSTRAINT "PK_1e3944bfaf5baf0f14b0bc892b9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_milestones_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_milestones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payment_plan_id" uuid NOT NULL, "name" character varying NOT NULL, "percentage" numeric(5,2), "amount" numeric(12,2) NOT NULL, "description" text, "dueDate" date, "status" "public"."payment_milestones_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4c0f5e58e9668a999e7f96151af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deal_id" uuid NOT NULL, "quotation_id" uuid, "totalAmount" numeric(12,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_b45dd997f8d3b69e3f25c2e7bc" UNIQUE ("deal_id"), CONSTRAINT "REL_f3f96fee44b50d848c165ea018" UNIQUE ("quotation_id"), CONSTRAINT "PK_8f05aee900e96c2e0c24df48262" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deals_status_enum" AS ENUM('DRAFT', 'SENT', 'VIEWED', 'NEGOTIATING', 'WON', 'LOST')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "client_id" uuid NOT NULL, "name" character varying NOT NULL, "status" "public"."deals_status_enum" NOT NULL DEFAULT 'DRAFT', "currency" jsonb, "taxes" jsonb, "sentAt" TIMESTAMP, "wonAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "project_id" character varying, CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quotation_items_chargetype_enum" AS ENUM('ONE_TIME', 'HOURLY', 'RECURRING')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quotation_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quotation_id" uuid NOT NULL, "service_id" character varying, "name" character varying NOT NULL, "description" text, "chargeType" "public"."quotation_items_chargetype_enum" NOT NULL DEFAULT 'ONE_TIME', "price" numeric(12,2) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "isTaxable" boolean NOT NULL DEFAULT true, "discount" numeric(12,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a5ff0786836b65d12bafd0ac91e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quotations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deal_id" uuid NOT NULL, "optionName" character varying NOT NULL DEFAULT 'Opción 1', "description" text, "isApproved" boolean NOT NULL DEFAULT false, "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "taxTotal" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c00eb8ba181f28c21ffba7ecb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "brief_templates" ADD CONSTRAINT "FK_1dd219de694f443ea5134de73ba" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "briefs" ADD CONSTRAINT "FK_5f9b244e3e67b330e2de093ac7d" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "briefs" ADD CONSTRAINT "FK_69420cf4371d66d7bf6a197501e" FOREIGN KEY ("template_id") REFERENCES "brief_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_milestones" ADD CONSTRAINT "FK_247547ae48ca3eedb0e4e59a688" FOREIGN KEY ("payment_plan_id") REFERENCES "payment_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_plans" ADD CONSTRAINT "FK_b45dd997f8d3b69e3f25c2e7bc9" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_plans" ADD CONSTRAINT "FK_f3f96fee44b50d848c165ea018c" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_6d0696dcb275b1754e3fc60bee8" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_7a1770366da1de36b1efc628073" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" ADD CONSTRAINT "FK_c9e2dea84928feba1d24874c160" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotations" ADD CONSTRAINT "FK_fab024a65dc86a463a1d042ea73" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotations" DROP CONSTRAINT "FK_fab024a65dc86a463a1d042ea73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotation_items" DROP CONSTRAINT "FK_c9e2dea84928feba1d24874c160"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" DROP CONSTRAINT "FK_7a1770366da1de36b1efc628073"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" DROP CONSTRAINT "FK_6d0696dcb275b1754e3fc60bee8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_plans" DROP CONSTRAINT "FK_f3f96fee44b50d848c165ea018c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_plans" DROP CONSTRAINT "FK_b45dd997f8d3b69e3f25c2e7bc9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_milestones" DROP CONSTRAINT "FK_247547ae48ca3eedb0e4e59a688"`,
    );
    await queryRunner.query(
      `ALTER TABLE "briefs" DROP CONSTRAINT "FK_69420cf4371d66d7bf6a197501e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "briefs" DROP CONSTRAINT "FK_5f9b244e3e67b330e2de093ac7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brief_templates" DROP CONSTRAINT "FK_1dd219de694f443ea5134de73ba"`,
    );
    await queryRunner.query(`DROP TABLE "quotations"`);
    await queryRunner.query(`DROP TABLE "quotation_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."quotation_items_chargetype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "deals"`);
    await queryRunner.query(`DROP TYPE "public"."deals_status_enum"`);
    await queryRunner.query(`DROP TABLE "payment_plans"`);
    await queryRunner.query(`DROP TABLE "payment_milestones"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_milestones_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "briefs"`);
    await queryRunner.query(`DROP TABLE "brief_templates"`);
  }
}
