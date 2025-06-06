import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sites_url" ALTER COLUMN "runAt" SET DEFAULT null;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sites_url" ALTER COLUMN "runAt" SET DEFAULT CURRENT_TIMESTAMP;`.execute(db);
}
