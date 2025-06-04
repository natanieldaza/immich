import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sites_url" ADD "runAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;`.execute(db);
  await sql`ALTER TABLE "sites_url" ADD "failed" boolean;`.execute(db);
  await sql`ALTER TABLE "sites_url" ADD "lastDownloadedNode" character varying DEFAULT false;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sites_url" DROP COLUMN "runAt";`.execute(db);
  await sql`ALTER TABLE "sites_url" DROP COLUMN "failed";`.execute(db);
  await sql`ALTER TABLE "sites_url" DROP COLUMN "lastDownloadedNode";`.execute(db);
}
