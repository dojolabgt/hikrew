import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorToWorkspaces1772465252228 implements MigrationInterface {
  name = 'RefactorToWorkspaces1772465252228';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP CONSTRAINT "FK_billing_subscriptions_freelancer"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_billing_subscriptions_freelancerId"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_members_role_enum" AS ENUM('owner', 'collaborator', 'guest')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "workspaceId" uuid NOT NULL, "role" "public"."workspace_members_role_enum" NOT NULL DEFAULT 'guest', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_99bcb5fdac446371d41f048b24" ON "workspace_members" ("userId", "workspaceId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspaces_plan_enum" AS ENUM('free', 'pro', 'premium')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessName" character varying NOT NULL DEFAULT 'Mi Espacio', "logo" character varying, "brandColor" character varying, "recurrentePublicKey" character varying, "recurrentePrivateKey" character varying, "plan" "public"."workspaces_plan_enum" NOT NULL DEFAULT 'free', "planExpiresAt" TIMESTAMP WITH TIME ZONE, "quotesThisMonth" integer NOT NULL DEFAULT '0', "quotesMonthReset" TIMESTAMP WITH TIME ZONE, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "freelancerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "workspaceId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "interval"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."billing_subscriptions_interval_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "interval" character varying NOT NULL DEFAULT 'month'`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."billing_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "status" character varying NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "appName" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "appLogo" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "appFavicon" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "primaryColor" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "secondaryColor" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "allowRegistration" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "maintenanceMode" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ae49c53d5e0b5a33d6ac3e109" ON "billing_subscriptions" ("workspaceId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_22176b38813258c2aadaae32448" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "FK_9ae49c53d5e0b5a33d6ac3e1097" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP CONSTRAINT "FK_9ae49c53d5e0b5a33d6ac3e1097"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_22176b38813258c2aadaae32448"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9ae49c53d5e0b5a33d6ac3e109"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "maintenanceMode" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "allowRegistration" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "secondaryColor" SET DEFAULT '#252525ff'`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "primaryColor" SET DEFAULT '#ebebebff'`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "appFavicon" SET DEFAULT '/public/branding/favicon.ico'`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "appLogo" SET DEFAULT '/public/branding/NexLogo.png'`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "appName" SET DEFAULT 'NexStack'`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ALTER COLUMN "id" SET DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."billing_subscriptions_status_enum" AS ENUM('pending', 'active', 'past_due', 'cancelled', 'unable_to_start')`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "status" "public"."billing_subscriptions_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "interval"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."billing_subscriptions_interval_enum" AS ENUM('month', 'year')`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "interval" "public"."billing_subscriptions_interval_enum" NOT NULL DEFAULT 'month'`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" DROP COLUMN "workspaceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD "freelancerId" uuid NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(`DROP TYPE "public"."workspaces_plan_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99bcb5fdac446371d41f048b24"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_members"`);
    await queryRunner.query(`DROP TYPE "public"."workspace_members_role_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_billing_subscriptions_freelancerId" ON "billing_subscriptions" ("freelancerId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "FK_billing_subscriptions_freelancer" FOREIGN KEY ("freelancerId") REFERENCES "freelancer_profiles"("userId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
