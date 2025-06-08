import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "assets" ADD "directoryId" uuid;`.execute(db);
  await sql`ALTER TABLE "assets" ADD CONSTRAINT "FK_73ea3630c20583d37469d20b0f1" FOREIGN KEY ("directoryId") REFERENCES "directory" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "IDX_73ea3630c20583d37469d20b0f" ON "assets" ("directoryId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_73ea3630c20583d37469d20b0f";`.execute(db);
  await sql`ALTER TABLE "assets" DROP CONSTRAINT "FK_73ea3630c20583d37469d20b0f1";`.execute(db);
  await sql`ALTER TABLE "assets" DROP COLUMN "directoryId";`.execute(db);
}
