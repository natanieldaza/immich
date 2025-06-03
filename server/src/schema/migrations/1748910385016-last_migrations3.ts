import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sites_url" ADD "posts" integer DEFAULT 0;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sites_url" DROP COLUMN "posts";`.execute(db);
}
