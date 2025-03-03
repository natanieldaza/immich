import { MigrationInterface, QueryRunner } from "typeorm";

export class Socialmeadia1739403315543 implements MigrationInterface {
    name = 'Socialmeadia1739403315543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_media" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "social_media" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "social_media" ADD "lastdownloaded" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "social_media" ADD "lastdownloadednode" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_media" DROP COLUMN "lastdownloadednode"`);
        await queryRunner.query(`ALTER TABLE "social_media" DROP COLUMN "lastdownloaded"`);
        await queryRunner.query(`ALTER TABLE "social_media" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "social_media" DROP COLUMN "name"`);
    }

}
