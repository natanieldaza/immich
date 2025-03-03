import { MigrationInterface, QueryRunner } from "typeorm";

export class Socialmeadia1739399873476 implements MigrationInterface {
    name = 'Socialmeadia1739399873476'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "social_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "thumbnailPath" character varying NOT NULL DEFAULT '', "platform" character varying NOT NULL, "platformUserId" character varying NOT NULL, "url" character varying NOT NULL, "followers" integer DEFAULT '0', "following" integer DEFAULT '0', "posts" integer DEFAULT '0', "lastUpdated" TIMESTAMP, "personId" uuid, CONSTRAINT "PK_54ac0fd97432069e7c9ab567f8b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "social_media" ADD CONSTRAINT "FK_aaf27905995c991ed4833a82f6c" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_media" DROP CONSTRAINT "FK_aaf27905995c991ed4833a82f6c"`);
        await queryRunner.query(`DROP TABLE "social_media"`);
    }

}
