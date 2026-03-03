import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BlendFoundation migration.
 *
 * Runs AFTER: InitialSchema (1770854674196) which creates:
 *   - users table with "users_role_enum" AS ENUM('admin', 'user', 'team')
 *
 * This migration:
 *   1. Replaces "users_role_enum" with new Blend roles
 *   2. Creates freelancer_profiles table
 */
export class BlendFoundation1770864000000 implements MigrationInterface {
  name = 'BlendFoundation1770864000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----------------------------------------------------------------
    // 1. Migrate users_role_enum: user/team → freelancer/support/client
    // ----------------------------------------------------------------

    // Step 1a: Create the new enum type
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum_new"
        AS ENUM ('admin', 'support', 'freelancer', 'client')
    `);

    // Step 1b: Convert column to text so we can remap values freely
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role"
        TYPE varchar
        USING "role"::text
    `);

    // Step 1c: Remap old values → new values
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'freelancer' WHERE "role" = 'user'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'support'    WHERE "role" = 'team'`,
    );

    // Step 1d: Cast back to new enum type (varchar → enum works fine with USING)
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role"
        TYPE "public"."users_role_enum_new"
        USING "role"::text::"public"."users_role_enum_new"
    `);

    // Step 1e: Set new default
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role"
        SET DEFAULT 'freelancer'::"public"."users_role_enum_new"
    `);

    // Step 1f: Drop old enum and rename new one to keep original name
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`
      ALTER TYPE "public"."users_role_enum_new"
        RENAME TO "users_role_enum"
    `);

    // ----------------------------------------------------------------
    // 2. Create freelancer_profiles table
    // ----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "freelancer_profiles" (
        "id"                    uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                uuid              NOT NULL,
        "businessName"          character varying,
        "logo"                  character varying,
        "brandColor"            character varying,
        "recurrentePublicKey"   character varying,
        "recurrentePrivateKey"  character varying,
        "plan"                  character varying NOT NULL DEFAULT 'free',
        "planExpiresAt"         TIMESTAMPTZ,
        "quotesThisMonth"       integer           NOT NULL DEFAULT 0,
        "quotesMonthReset"      TIMESTAMPTZ,
        "isActive"              boolean           NOT NULL DEFAULT true,
        "createdAt"             TIMESTAMPTZ       NOT NULL DEFAULT now(),
        "updatedAt"             TIMESTAMPTZ       NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_freelancer_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_freelancer_profiles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "freelancer_profiles"
        ADD CONSTRAINT "FK_freelancer_profiles_user"
        FOREIGN KEY ("userId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop freelancer_profiles
    await queryRunner.query(`
      ALTER TABLE "freelancer_profiles"
        DROP CONSTRAINT "FK_freelancer_profiles_user"
    `);
    await queryRunner.query(`DROP TABLE "freelancer_profiles"`);

    // Restore old enum
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum_old"
        AS ENUM ('admin', 'user', 'team')
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role"
        TYPE varchar
        USING "role"::text
    `);
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'user' WHERE "role" IN ('freelancer', 'client')`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'team' WHERE "role" = 'support'`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role"
        TYPE "public"."users_role_enum_old"
        USING "role"::text::"public"."users_role_enum_old"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role"
        SET DEFAULT 'user'::"public"."users_role_enum_old"
    `);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`
      ALTER TYPE "public"."users_role_enum_old"
        RENAME TO "users_role_enum"
    `);
  }
}
