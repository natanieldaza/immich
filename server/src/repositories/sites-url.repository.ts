import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { AuthDto } from 'src/dtos/auth.dto';
import { SitesUrlCreateDto, SitesUrlResponseDto, SitesUrlUpdateDto } from 'src/dtos/sites-url.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';


@Injectable()
export class SitesUrlRepository {
  constructor(
    @InjectKysely() private readonly db: Kysely<DB>,
    private readonly logger: LoggingRepository,
  ) { }

  async insert(auth: AuthDto,data: Partial<SitesUrlCreateDto>): Promise<SitesUrlResponseDto> {
    this.logger.log(`Inserting new site URL ${JSON.stringify(data)}`);
    try {
      const [result] = await this.db
        .insertInto('sites_url')
        .values({
          url: data.url!, // Ensure required fields are defined
          preference: data.preference ?? 0,
          description: data.description ?? null,
          visitedAt: data.visitedAt ?? null,
          createdAt: data.createdAt ?? new Date().toISOString(),
          ownerId: String(auth.user.id), // Ensure this is provided
          posts: data.posts ?? 0, // Default to 0 if not provided
        }).onConflict((oc) => oc.columns(['url']) // Specify the unique constraint column
        //if different preference, update it
        .doUpdateSet({
          preference: sql`CASE 
            WHEN sites_url.preference IS DISTINCT FROM EXCLUDED.preference 
            THEN EXCLUDED.preference 
            ELSE sites_url.preference 
            END`       }))//.doUpdateSet({ preference: sql`GREATEST(sites_url.preference, EXCLUDED.preference)` }) // Update preference if the new one is greater
        .returningAll()
        .execute();
  
      if (!result) {
        throw new Error('Insert failed, no result returned');
      }
  
      const response: SitesUrlResponseDto = {
        id: result.id!, // Ensure this is defined or handle it
        url: result.url,
        createdAt: new Date(result.createdAt),
        visitedAt: result.visitedAt ? new Date(result.visitedAt) : null,
        preference: result.preference ?? null,
        description: result.description ?? null,
        posts: result.posts ?? 0,
        runAt: result.runAt ? new Date(result.runAt) : null,
        failed: result.failed ?? null, // Ensure this is included
      };
  
      return response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key value violates unique constraint')
      ) {
        throw new Error('A record with the same URL already exists.');
      }
      throw error;
    }
  }
  

  async getById(id: string): Promise<SitesUrlResponseDto | null> {
    const result = await this.db
      .selectFrom('sites_url')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return result ?? null;
  }

  async getAll(): Promise<SitesUrlResponseDto[]> {
    const result = await this.db
      .selectFrom('sites_url')
      .selectAll()
      .execute();

    return result ?? [];
  }

async setVisited(id: string, visitedAt: Date): Promise<SitesUrlResponseDto | null> {
    const [result] = await this.db
      .updateTable('sites_url')
      .set({
        visitedAt: visitedAt.toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .execute();
    return result ? {
      id: result.id ? String(result.id) : '',
      url: result.url,
      createdAt: result.createdAt ? new Date(String(result.createdAt)) : null,  
      visitedAt: result.visitedAt ? new Date(String(result.visitedAt)) : null,
      preference: result.preference,
      description: result.description,
      posts: result.posts ?? 0,
      runAt: result.runAt ? new Date(result.runAt) : null,
      failed: result.failed ?? null,
      lastDownloadedNode: result.lastDownloadedNode ? String(result.lastDownloadedNode) : null,
    } : null;
  }

  
  async getAllSortedByPreference(): Promise<SitesUrlResponseDto[]> {
    const result = await this.db
      .selectFrom('sites_url')
      .selectAll()
      .where(() => sql`failed IS NULL OR failed = TRUE`)
      .orderBy('preference', 'desc')
      .execute();
  
    return result.map(siteUrl => ({
      id: siteUrl.id ? String(siteUrl.id) : '',
      url: siteUrl.url,
      createdAt: siteUrl.createdAt ? new Date(String(siteUrl.createdAt)) : null,
      visitedAt: siteUrl.visitedAt ? new Date(String(siteUrl.visitedAt)) : null,
      preference: siteUrl.preference,
      description: siteUrl.description,
      posts: siteUrl.posts ?? 0,
      lastDownloadedNode: siteUrl.lastDownloadedNode ? String(siteUrl.lastDownloadedNode) : null,
    })) ?? [];
  }
  
  
  async setProcessed(id: string, runAt: Date, failed: boolean,lastDownloadedNode:string|null): Promise<SitesUrlResponseDto | null> {
    this.logger.log(`Setting site URL ${id} as processed at ${runAt.toISOString()} with failed status: ${failed}`);
    const [result] = await this.db
      .updateTable('sites_url')
      .set({
        runAt: runAt.toISOString(),
        failed,
        lastDownloadedNode
      })
      .where('id', '=', id)
      .returningAll()
      .execute();
    return result ? {
      id: result.id ? String(result.id) : '',
      url: result.url,  
      createdAt: result.createdAt ? new Date(String(result.createdAt)) : null,
      visitedAt: result.visitedAt ? new Date(String(result.visitedAt)) : null,
      preference: result.preference,
      description: result.description,
      posts: result.posts ?? 0,
      runAt: result.runAt ? new Date(result.runAt) : null,
      failed: result.failed ?? null,
      lastDownloadedNode: result.lastDownloadedNode ? String(result.lastDownloadedNode) : null,
    } : null;
  }

  async getAllByPreferenceSortedByPosts(preference: number): Promise<SitesUrlResponseDto[]> {
    const result = await this.db
      .selectFrom('sites_url')
      .selectAll()
      .where(() => sql`(case when preference = 0 then preference >= ${preference} else preference = ${preference} end)`)
      .where(() => sql`failed IS NULL OR failed = TRUE`)
      .orderBy('posts', 'desc')
      .execute();
  
    return result ?? [];
  }
     

  async getByOwnerId(ownerId: string): Promise<SitesUrlResponseDto[]> {
    const result = await this.db
      .selectFrom('sites_url')
      .selectAll()
      .where('ownerId', '=', ownerId) 
      .execute();
    return result ?? [];
  }

  async update(auth: AuthDto,id: string, data: Partial<SitesUrlUpdateDto>): Promise<SitesUrlResponseDto | null> {
    const [result] = await this.db
      .updateTable('sites_url')
      .set(data)
      .where('id', '=', id)
      .where('ownerId', '=', String(auth.user.id)) // Ensure the user owns the URL
      .returningAll()
      .execute();

    return result ?? null;
  }
  async delete(id: string): Promise<SitesUrlResponseDto | null> {
    const [result] = await this.db
      .deleteFrom('sites_url')
      .where('id', '=', id)
      .returningAll()
      .execute();

    return result ?? null;
  }
  async getByUrl(url: string): Promise<SitesUrlResponseDto | null> {
    const result = await this.db
      .selectFrom('sites_url')
      .selectAll()
      .where('url', '=', url)
      .executeTakeFirst();
  
    return result ?? null; // `, result` already matches the shape of SitesUrlResponseDto
  }
}