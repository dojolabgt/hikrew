import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitUserName1772498940757 implements MigrationInterface {
    name = 'SplitUserName1772498940757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add new columns allowing null temporarily
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying`);

        // 2. Migrate existing data: split 'name' by the first space
        // firstName gets the first word, lastName gets the rest (or 'User' if no second word)
        await queryRunner.query(`
            UPDATE "users" 
            SET "firstName" = split_part("name", ' ', 1),
                "lastName" = COALESCE(NULLIF(substring("name" from position(' ' in "name") + 1), ''), 'Blend')
            WHERE "name" IS NOT NULL
        `);

        // Set fallbacks for any users that might have had a null name
        await queryRunner.query(`UPDATE "users" SET "firstName" = 'Friendly' WHERE "firstName" IS NULL OR "firstName" = ''`);
        await queryRunner.query(`UPDATE "users" SET "lastName" = 'User' WHERE "lastName" IS NULL OR "lastName" = ''`);

        // 3. Make them NOT NULL 
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`);

        // 4. Safely drop the old column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-create name
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying`);

        // Concat firstName and lastName back into name
        await queryRunner.query(`UPDATE "users" SET "name" = "firstName" || ' ' || "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL`);

        // Drop the new columns
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    }

}
