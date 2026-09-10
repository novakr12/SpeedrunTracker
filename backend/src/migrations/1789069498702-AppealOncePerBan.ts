import { MigrationInterface, QueryRunner } from "typeorm";

export class AppealOncePerBan1789069498702 implements MigrationInterface {
    name = 'AppealOncePerBan1789069498702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ban_appeals_userId_banIssuedAt" ON "ban_appeals" ("userId", "banIssuedAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_ban_appeals_userId_banIssuedAt"`);
    }

}
