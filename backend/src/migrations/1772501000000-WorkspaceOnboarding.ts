import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceOnboarding1772501000000 implements MigrationInterface {
    name = 'WorkspaceOnboarding1772501000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "workspaces" ADD "useCases" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "workspaces" ADD "onboardingCompleted" boolean NOT NULL DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "workspaces" DROP COLUMN "onboardingCompleted"`,
        );
        await queryRunner.query(
            `ALTER TABLE "workspaces" DROP COLUMN "useCases"`,
        );
    }
}
