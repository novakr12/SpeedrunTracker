import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1786626583992 implements MigrationInterface {
    name = 'InitialSchema1786626583992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category_segments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "name" character varying NOT NULL, "position" integer NOT NULL, CONSTRAINT "PK_ff09408d5355d568dfd3ba93dc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "rules" character varying, "gameId" uuid NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "platforms" text, "tags" text, "releaseYear" integer, "coverImage" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "run_segments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "segmentId" uuid NOT NULL, "durationMs" integer NOT NULL, CONSTRAINT "PK_b1316f86e3c181d351d214b9aca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_042b7fbf76f50e59e9e2032f59" ON "run_segments" ("segmentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9f6801c804a6c9aff623d4acb" ON "run_segments" ("runId") `);
        await queryRunner.query(`CREATE TABLE "runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "gameId" uuid NOT NULL, "categoryId" uuid NOT NULL, "timeMs" integer NOT NULL, "videoUrl" character varying, "status" character varying NOT NULL DEFAULT 'pending', "reviewComment" text, "reviewedById" uuid, "reviewedAt" TIMESTAMP, "playedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_46d6a1e257c38ba58f1a3c30836" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ca22ee3f26a9f711f5195939b9" ON "runs" ("userId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_4b0e33f5308f5eb2a65d2b48f2" ON "runs" ("categoryId", "status", "timeMs") `);
        await queryRunner.query(`CREATE INDEX "IDX_5434b5a8a1e17a785e1ff34e24" ON "runs" ("gameId", "status", "timeMs") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'user', "banned" boolean NOT NULL DEFAULT false, "bannedUntil" TIMESTAMP, "banReason" text, "bannedAt" TIMESTAMP, "banRunId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ban_appeals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "banIssuedAt" TIMESTAMP NOT NULL, "message" text NOT NULL, "status" character varying NOT NULL DEFAULT 'open', "adminComment" text, "resolvedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_df641ca7b2679eadd1efe526fe0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_followed_games" ("userId" uuid NOT NULL, "gameId" uuid NOT NULL, CONSTRAINT "PK_dcdfafb5fe9b832cfbab581bbae" PRIMARY KEY ("userId", "gameId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4c27b2ab579ee9d73776d98006" ON "user_followed_games" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1ebfd52bdcf63b4439b74691f4" ON "user_followed_games" ("gameId") `);
        await queryRunner.query(`ALTER TABLE "category_segments" ADD CONSTRAINT "FK_6cd5ec10cfeea9dd2c24a91579b" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_46af053a0ed55154d2cf0bc851d" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "run_segments" ADD CONSTRAINT "FK_b9f6801c804a6c9aff623d4acb1" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "run_segments" ADD CONSTRAINT "FK_042b7fbf76f50e59e9e2032f592" FOREIGN KEY ("segmentId") REFERENCES "category_segments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "runs" ADD CONSTRAINT "FK_336a74d21129fee621d57b01799" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "runs" ADD CONSTRAINT "FK_3aaf309901a6e42a29eb8098d6a" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "runs" ADD CONSTRAINT "FK_d7fd576a289e7bdb1e35149df14" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "runs" ADD CONSTRAINT "FK_6519487819934f9690cf5f711e1" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ban_appeals" ADD CONSTRAINT "FK_23eb5c345dd71b0ee529dd3f17f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_followed_games" ADD CONSTRAINT "FK_4c27b2ab579ee9d73776d980061" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_followed_games" ADD CONSTRAINT "FK_1ebfd52bdcf63b4439b74691f41" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_followed_games" DROP CONSTRAINT "FK_1ebfd52bdcf63b4439b74691f41"`);
        await queryRunner.query(`ALTER TABLE "user_followed_games" DROP CONSTRAINT "FK_4c27b2ab579ee9d73776d980061"`);
        await queryRunner.query(`ALTER TABLE "ban_appeals" DROP CONSTRAINT "FK_23eb5c345dd71b0ee529dd3f17f"`);
        await queryRunner.query(`ALTER TABLE "runs" DROP CONSTRAINT "FK_6519487819934f9690cf5f711e1"`);
        await queryRunner.query(`ALTER TABLE "runs" DROP CONSTRAINT "FK_d7fd576a289e7bdb1e35149df14"`);
        await queryRunner.query(`ALTER TABLE "runs" DROP CONSTRAINT "FK_3aaf309901a6e42a29eb8098d6a"`);
        await queryRunner.query(`ALTER TABLE "runs" DROP CONSTRAINT "FK_336a74d21129fee621d57b01799"`);
        await queryRunner.query(`ALTER TABLE "run_segments" DROP CONSTRAINT "FK_042b7fbf76f50e59e9e2032f592"`);
        await queryRunner.query(`ALTER TABLE "run_segments" DROP CONSTRAINT "FK_b9f6801c804a6c9aff623d4acb1"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_46af053a0ed55154d2cf0bc851d"`);
        await queryRunner.query(`ALTER TABLE "category_segments" DROP CONSTRAINT "FK_6cd5ec10cfeea9dd2c24a91579b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ebfd52bdcf63b4439b74691f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c27b2ab579ee9d73776d98006"`);
        await queryRunner.query(`DROP TABLE "user_followed_games"`);
        await queryRunner.query(`DROP TABLE "ban_appeals"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5434b5a8a1e17a785e1ff34e24"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4b0e33f5308f5eb2a65d2b48f2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca22ee3f26a9f711f5195939b9"`);
        await queryRunner.query(`DROP TABLE "runs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9f6801c804a6c9aff623d4acb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_042b7fbf76f50e59e9e2032f59"`);
        await queryRunner.query(`DROP TABLE "run_segments"`);
        await queryRunner.query(`DROP TABLE "games"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "category_segments"`);
    }

}
