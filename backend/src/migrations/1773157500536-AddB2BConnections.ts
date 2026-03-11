import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddB2BConnections1773157500536 implements MigrationInterface {
  name = 'AddB2BConnections1773157500536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_connections_status_enum" AS ENUM('pending', 'accepted', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inviter_workspace_id" uuid NOT NULL, "invitee_workspace_id" uuid, "invite_email" character varying NOT NULL, "token" character varying NOT NULL, "status" "public"."workspace_connections_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6b5e61ba241ab52cee4d38b2019" UNIQUE ("token"), CONSTRAINT "PK_5aa24abd47a3219658033df01bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deal_collaborators_role_enum" AS ENUM('viewer', 'editor')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deal_collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deal_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "role" "public"."deal_collaborators_role_enum" NOT NULL DEFAULT 'viewer', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0ee3c48d118f211f5b371946c6c" PRIMARY KEY ("id"))`,
    );
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
      `ALTER TABLE "workspace_connections" ADD CONSTRAINT "FK_86c10824b8da6087d848c8cb61b" FOREIGN KEY ("inviter_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_connections" ADD CONSTRAINT "FK_94dd32508a96f6cce00a7674aae" FOREIGN KEY ("invitee_workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_collaborators" ADD CONSTRAINT "FK_6c14de89761aec694b9d8dd9997" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_collaborators" ADD CONSTRAINT "FK_66e2f877f3a3b54362de3defd34" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_collaborators" DROP CONSTRAINT "FK_66e2f877f3a3b54362de3defd34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_collaborators" DROP CONSTRAINT "FK_6c14de89761aec694b9d8dd9997"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_connections" DROP CONSTRAINT "FK_94dd32508a96f6cce00a7674aae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_connections" DROP CONSTRAINT "FK_86c10824b8da6087d848c8cb61b"`,
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
    await queryRunner.query(`DROP TABLE "deal_collaborators"`);
    await queryRunner.query(
      `DROP TYPE "public"."deal_collaborators_role_enum"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_connections"`);
    await queryRunner.query(
      `DROP TYPE "public"."workspace_connections_status_enum"`,
    );
  }
}
