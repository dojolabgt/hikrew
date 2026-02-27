import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1770854674196 implements MigrationInterface {
  name = 'InitialSchema1770854674196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
                    CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user', 'team');
                END IF;
            END$$;
        `);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "refreshToken" text, "profileImage" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "app_settings" ("id" integer NOT NULL DEFAULT '1', "appName" character varying NOT NULL DEFAULT 'NexStack', "appLogo" character varying DEFAULT '/public/branding/NexLogo.png', "appFavicon" character varying DEFAULT '/public/branding/favicon.ico', "primaryColor" character varying NOT NULL DEFAULT '#ebebebff', "secondaryColor" character varying NOT NULL DEFAULT '#252525ff', "allowRegistration" boolean NOT NULL DEFAULT true, "maintenanceMode" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4800b266ba790931744b3e53a74" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_settings"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
