import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientWorkspaceRole1773950000000 implements MigrationInterface {
  name = 'AddClientWorkspaceRole1773950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL requires ALTER TYPE ... ADD VALUE to run outside a transaction
    // so we commit the current one, alter the enum, then start a new transaction.
    await queryRunner.commitTransaction();

    await queryRunner.query(
      `ALTER TYPE "workspace_members_role_enum" ADD VALUE IF NOT EXISTS 'client'`,
    );

    await queryRunner.startTransaction();

    // For every client record that has a linked user, create a CLIENT workspace
    // membership — this migrates existing CLIENT-role users to the new model.
    await queryRunner.query(`
      INSERT INTO workspace_members (id, "userId", "workspaceId", role, "createdAt", "updatedAt")
      SELECT
        gen_random_uuid(),
        c."linkedUserId"::uuid,
        c."workspaceId"::uuid,
        'client',
        NOW(),
        NOW()
      FROM clients c
      INNER JOIN users u ON u.id = c."linkedUserId"::uuid
      WHERE c."linkedUserId" IS NOT NULL
      ON CONFLICT ("userId", "workspaceId") DO NOTHING
    `);

    // Demote existing CLIENT users to FREELANCER at the user level.
    // Their client context is now carried by the workspace membership above.
    await queryRunner.query(`
      UPDATE users SET role = 'freelancer' WHERE role = 'client'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore CLIENT role for users who only have client workspace memberships
    // (i.e. no owner/collaborator/guest membership anywhere).
    await queryRunner.query(`
      UPDATE users u
      SET role = 'client'
      WHERE u.id IN (
        SELECT wm."userId"
        FROM workspace_members wm
        WHERE wm.role = 'client'
        AND NOT EXISTS (
          SELECT 1 FROM workspace_members wm2
          WHERE wm2."userId" = wm."userId"
            AND wm2.role IN ('owner', 'collaborator', 'guest')
        )
      )
    `);

    // Remove client workspace memberships that were created by the up migration
    await queryRunner.query(`
      DELETE FROM workspace_members wm
      WHERE wm.role = 'client'
        AND EXISTS (
          SELECT 1 FROM clients c
          WHERE c."linkedUserId" = wm."userId"
            AND c."workspaceId" = wm."workspaceId"
        )
    `);

    // Note: the 'client' enum value cannot be removed from PostgreSQL without
    // recreating the type. It remains harmlessly unused after rollback.
  }
}
