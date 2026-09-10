import { MigrationInterface, QueryRunner } from "typeorm";

export class CascadeFollowedGameDeletes1789069498701 implements MigrationInterface {
    name = 'CascadeFollowedGameDeletes1789069498701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_followed_games" DROP CONSTRAINT "FK_1ebfd52bdcf63b4439b74691f41"`);
        await queryRunner.query(`ALTER TABLE "user_followed_games" ADD CONSTRAINT "FK_1ebfd52bdcf63b4439b74691f41" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_followed_games" DROP CONSTRAINT "FK_1ebfd52bdcf63b4439b74691f41"`);
        await queryRunner.query(`ALTER TABLE "user_followed_games" ADD CONSTRAINT "FK_1ebfd52bdcf63b4439b74691f41" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
