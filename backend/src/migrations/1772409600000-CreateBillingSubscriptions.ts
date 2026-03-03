import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillingSubscriptions1772409600000 implements MigrationInterface {
  name = 'CreateBillingSubscriptions1772409600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."billing_subscriptions_status_enum" AS ENUM (
                'pending',
                'active',
                'past_due',
                'cancelled',
                'unable_to_start'
            )
        `);

    await queryRunner.query(`
            CREATE TYPE "public"."billing_subscriptions_interval_enum" AS ENUM (
                'month',
                'year'
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "billing_subscriptions" (
                "id"                          uuid              NOT NULL DEFAULT uuid_generate_v4(),
                "freelancerId"                uuid              NOT NULL,
                "recurrenteCheckoutId"        character varying NOT NULL,
                "recurrenteSubscriptionId"    character varying,
                "plan"                        character varying NOT NULL DEFAULT 'pro',
                "interval"                    "public"."billing_subscriptions_interval_enum" NOT NULL DEFAULT 'month',
                "status"                      "public"."billing_subscriptions_status_enum"   NOT NULL DEFAULT 'pending',
                "currentPeriodStart"          TIMESTAMP WITH TIME ZONE,
                "currentPeriodEnd"            TIMESTAMP WITH TIME ZONE,
                "createdAt"                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt"                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_billing_subscriptions" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_billing_subscriptions_freelancerId"
            ON "billing_subscriptions" ("freelancerId")
        `);

    await queryRunner.query(`
            ALTER TABLE "billing_subscriptions"
            ADD CONSTRAINT "FK_billing_subscriptions_freelancer"
            FOREIGN KEY ("freelancerId")
            REFERENCES "freelancer_profiles"("userId")
            ON DELETE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "billing_subscriptions"
            DROP CONSTRAINT "FK_billing_subscriptions_freelancer"
        `);
    await queryRunner.query(
      `DROP INDEX "IDX_billing_subscriptions_freelancerId"`,
    );
    await queryRunner.query(`DROP TABLE "billing_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."billing_subscriptions_interval_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."billing_subscriptions_status_enum"`,
    );
  }
}
