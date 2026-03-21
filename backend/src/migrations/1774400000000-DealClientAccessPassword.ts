import { MigrationInterface, QueryRunner } from 'typeorm';

export class DealClientAccessPassword1774400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "client_access_password" text DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" DROP COLUMN IF EXISTS "client_access_password"`,
    );
  }
}
