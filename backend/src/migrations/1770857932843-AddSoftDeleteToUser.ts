import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToUser1770857932843 implements MigrationInterface {
  name = 'AddSoftDeleteToUser1770857932843';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
  }
}
