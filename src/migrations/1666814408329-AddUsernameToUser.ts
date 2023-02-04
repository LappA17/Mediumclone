import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameToUser1666814408329 implements MigrationInterface {
    name = 'AddUsernameToUser1666814408329'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }

}
