import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, SocialMedia } from 'src/db';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { parse } from 'tldts';


@Injectable()
export class SocialMediaRepository {

  constructor(
    @InjectKysely() private readonly db: Kysely<DB>,
    private logger: LoggingRepository
  ) {
    this.logger.setContext(SocialMediaRepository.name);
  }

  resolvedUrls = new Map<string, string>();

  socialMediaCache = new Map<string, SocialMedia>();

  async addOrUpdateSocialMedia(
    name: string,
    userId: string,
    userIdHash: string,
    platform: string,
    ownerId: string,
    description = '',
    thumbnailPath = '',
    url = '',
    posts: number,
    followers: number,
    following: number,
    assetPath: string,
  ): Promise<void> {
    const socialMedia = this.processProfile(
      name,
      userId,
      userIdHash,
      platform,
      ownerId,
      description,
      thumbnailPath,
      url,
      posts,
      followers,
      following
    );
    if ((!userId || !userIdHash) && platform === 'instagram') {
      //      this.logger.warn('userId or userIdHash is empty with filename: ' + assetPath);
      //      this.logger.debug(`incomplete social media profile: ${JSON.stringify(socialMedia)}`);
      return;
    }

    //    this.logger.debug(`Adding or updating social media profile: ${JSON.stringify(socialMedia)} file: ` + assetPath);
    //    this.logger.debug(`userIdHash is filled: ${userIdHash}`);
    const social = await this.createOrUpdate(socialMedia);
    this.addOrUpdateSocialMediaCache(social);
  }

  private addOrUpdateSocialMediaCache(socialMediaEntity: SocialMedia): void {

    let hash = socialMediaEntity.platformUserIdHash;

    if (socialMediaEntity.platform === 'instagram') {
      hash = socialMediaEntity.platformUserIdHash
    }
    else {
      hash = socialMediaEntity.url
    }
    if (!hash) {
      this.logger.warn('platformUserIdHash is empty');
      return;
    }

    const existing = this.socialMediaCache.get(hash);

    if (existing) {
      this.logger.verbose(`Updating social media cache for userIdHash: ${hash}`);

      existing.name ??= socialMediaEntity.name;
      existing.thumbnailPath ??= socialMediaEntity.thumbnailPath;
      existing.platform ??= socialMediaEntity.platform;
      existing.platformUserId ??= socialMediaEntity.platformUserId;
      existing.url ??= socialMediaEntity.url;

      if (socialMediaEntity.description &&
        (!existing.description || !existing.description.includes(socialMediaEntity.description))) {
        existing.description = existing.description
          ? `${existing.description} ${socialMediaEntity.description}`.trim()
          : socialMediaEntity.description;
      }

      existing.followers = Math.max(Number(existing.followers) || 0, Number(socialMediaEntity.followers) || 0);
      existing.following = Math.max(Number(existing.following) || 0, Number(socialMediaEntity.following) || 0);
      existing.posts = Math.max(Number(existing.posts) || 0, Number(socialMediaEntity.posts) || 0);

      this.logger.verbose(`Updated social media cache for userIdHash: ${hash} with values: ${JSON.stringify(existing)}`);
    } else {
      this.logger.verbose(`Adding social media cache for userIdHash: ${hash} with values: ${JSON.stringify(socialMediaEntity)}`);
      this.socialMediaCache.set(hash, socialMediaEntity);
      this.logger.verbose(`Current social media cache size: ${this.socialMediaCache.size}`);
    }
  }


  private processProfile(
    name: string,
    userId: string,
    userIdHash: string,
    platform: string,
    ownerId: string,
    description = '',
    thumbnailPath = '',
    url = '',
    posts?: number,
    followers?: number,
    following?: number
  ): SocialMedia {
    const socialMedia: SocialMedia = {
      name,
      thumbnailPath,
      platform: platform || this.getPlatformFromUrl(url),
      platformUserId: userId,
      platformUserIdHash: userIdHash,
      description,
      url: platform === 'instagram' && !url ? `https://www.instagram.com/${userId}` : url,
      followers: Number(followers) || 0,
      following: Number(following) || 0,
      posts: Number(posts) || 0,
      updatedAt: new Date(),
      lastDownloaded: undefined,
      lastDownloadedNode: '',
      personId: null,
      ownerId,
    };
    //delete id from socialMedia

    

    return socialMedia;
  }
  getPlatformFromUrl(url: string): string {
    try {
      const result = parse(url);
      if (result.domain) {
        return result.domain.split('.')[0]; // Extract "tiktok" from "tiktok.com"
      }
      return '';
    } catch (error) {
      this.logger.warn(`Invalid URL: ${url}`);
      return '';
    }
  }
  getInstagramIdFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname; // e.g. "/username/" or "/username/reels/..."
      const match = pathname.match(/^\/([^/]+)/); // match first segment after slash
      return match ? match[1] : '';
    } catch (error) {
      this.logger.warn(`Invalid URL: ${url}`);
      return '';
    }
  }

  getTiktokIdFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname; // e.g. "/@username" or "/@username/video/..."
      const match = pathname.match(/^\/(@[^/]+)/); // capture @username at the start
      return match ? match[1] : '';
    } catch (error) {
      this.logger.warn(`Invalid URL: ${url}`);
      return '';
    }
  }
  async resolveTiktokRedirect(shortUrl: string): Promise<string> {
    try {
      const response = await fetch(shortUrl, { redirect: 'follow' });

      if (this.resolvedUrls.has(shortUrl)) {
        const resolvedUrl = this.resolvedUrls.get(shortUrl) || '';
        const tiktokId = this.getTiktokIdFromUrl(resolvedUrl);
        this.logger.verbose(`1 Resolved TikTok ID: ${tiktokId} from URL: ${resolvedUrl}`);
        return tiktokId;
      }
      if (!response.ok) {
        this.logger.warn(`Failed to resolve TikTok URL: ${shortUrl}`);
        return '';
      }
      const resolvedUrl = response.url;
      this.resolvedUrls.set(shortUrl, resolvedUrl); // Cache the resolved URL
      const tiktokId = this.getTiktokIdFromUrl(resolvedUrl);
      this.logger.verbose(`Resolved TikTok ID: ${tiktokId} from URL: ${resolvedUrl}`);
      return tiktokId;

    } catch (error) {
      console.warn(`Failed to resolve TikTok URL: ${shortUrl}`);
      return '';
    }
  }

  getWhatsappNumberFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname; // e.g. "/59170409708"
      const rawNumber = pathname.replace('/', '');

      // Validate: must be digits only and at least 8 digits
      if (!/^\d{8,15}$/.test(rawNumber)) {
        this.logger.warn(`Invalid phone number in WhatsApp URL: ${url}`);
        return '';
      }

      // Normalize: prepend '+' for international format
      return `+${rawNumber}`;
    } catch (error) {
      this.logger.warn(`Invalid WhatsApp URL: ${url}`);
      return '';
    }
  }

  getFacebookIdFromUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Case: numeric ID via profile.php?id=...
      if (parsed.pathname === '/profile.php') {
        return parsed.searchParams.get('id') || '';
      }

      // Case: vanity username
      const match = parsed.pathname.match(/^\/([^/?]+)/);
      return match ? match[1] : '';
    } catch (error) {
      console.warn(`Invalid Facebook URL: ${url}`);
      return '';
    }
  }

  async create(data: Insertable<SocialMedia>): Promise<SocialMedia> {
    try {
      return (await this.db
        .insertInto('social_media')
        .values(data)
        .returningAll()
        .executeTakeFirst()) as SocialMedia;
    } catch (error) {
      this.logger.error('Error inserting social media entity', { error, data });
      throw error;
    }
  }

  async update(
    socialMedia: Partial<SocialMedia> 
  ): Promise<SocialMedia> {
    try {
      if(!socialMedia.id) {
        throw new Error('SocialMedia ID is required for update');
      }
      // Verifica si la entidad social_media existe antes de actualizar
      const existingSocialMedia = await this.db
        .selectFrom('social_media')
        .select(['id'])
        .where('id', '=', socialMedia.id)
        .executeTakeFirst();

      if (!existingSocialMedia) {
        throw new Error(`SocialMedia with id ${socialMedia.id} not found`);
      }

      // Si se incluye un nuevo personId, verifica que exista en la tabla person
      if (socialMedia.personId) {
        const existingPerson = await this.db
          .selectFrom('person')
          .select(['id'])
          .where('id', '=', socialMedia.personId)
          .executeTakeFirst();

        if (!existingPerson) {
          throw new Error(`PersonEntity with id ${socialMedia.personId} not found`);
        }
      }

      // Realiza la actualización de la entidad social_media
      const updatedSocialMedia = await this.db
        .updateTable('social_media')
        .set(socialMedia) // Aquí se pasan los datos a actualizar
        .where('id', '=', socialMedia.id) // Condición para identificar la entidad a actualizar
        .returningAll() // Regresa la entidad actualizada
        .executeTakeFirstOrThrow(); // Ejecuta y lanza un error si no se encuentra la entidad

      return updatedSocialMedia as SocialMedia;
    } catch (error) {
      this.logger.error('Error updating social media entity', {
        error,
        socialMedia,
      });
      throw error;
    }
  }



  async createOrUpdate(data: Insertable<SocialMedia>): Promise<SocialMedia> {
    if (data.personId === undefined || data.personId === null || data.personId === '') {
      delete data.personId;
    }

    // Remove any undefined values to prevent postgres driver crashes
    const sanitizedData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as Insertable<SocialMedia>;

    try {
      return (await this.db
        .insertInto('social_media')
        .values(sanitizedData)
        .onConflict((oc) =>
          oc.columns(['platform', 'platformUserId', 'platformUserIdHash']).doUpdateSet((eb) => ({
            name: sql`CASE 
                WHEN social_media.name IS NULL OR social_media.name = '' THEN excluded.name 
                ELSE social_media.name 
              END`,
            description: sql`CASE 
                WHEN POSITION(excluded.description IN social_media.description) > 0 THEN social_media.description
                ELSE social_media.description || ' ' || excluded.description
              END`,
            thumbnailPath: eb.ref('excluded.thumbnailPath'),
            url: eb.ref('excluded.url'),
            posts: sql`GREATEST(social_media.posts, excluded.posts)`,
            followers: sql`GREATEST(social_media.followers, excluded.followers)`,
            following: sql`GREATEST(social_media.following, excluded.following)`,
            personId: sql`CASE
                WHEN excluded."personId" IS NULL THEN social_media."personId"
                ELSE excluded."personId"
              END`,
          }))
        )
        .returningAll()
        .executeTakeFirst()) as SocialMedia;
    } catch (error) {
      this.logger.error('Error creating or updating social media entity', {
        error,
        data,
      });
      throw error;
    }
  }

  async bulkCreateOrUpdate(data: Insertable<SocialMedia>[]): Promise<void> {
    try {
      await this.db
        .insertInto('social_media')
        .values(data)
        .onConflict((oc) =>
          oc.columns(['platform', 'platformUserId']).doUpdateSet((eb) => ({
            name: eb.ref('excluded.name'),
            description: sql`CASE WHEN social_media.description IS NULL OR social_media.description = '' THEN excluded.description 
                    ELSE social_media.description || ' ' || excluded.description END`, // Append new description only if it's different
            thumbnailPath: eb.ref('excluded.thumbnailPath'),
            url: eb.ref('excluded.url'),
            posts: sql`GREATEST(social_media.posts, excluded.posts)`, // Keep max value
            followers: sql`GREATEST(social_media.followers, excluded.followers)`,
            following: sql`GREATEST(social_media.following, excluded.following)`,
            updatedAt: eb.ref('excluded.updatedAt'),
          }))
        )
        .execute();
    } catch (error) {
      this.logger.error('Error in bulk creating or updating social media entities', { error, data });
      throw error;
    }
  }


  async bulkInsert(data: Insertable<SocialMedia>[]): Promise<void> {
    try {
      await this.db.insertInto('social_media').values(data).execute();
    } catch (error) {
      this.logger.error('Error in bulk inserting social media entities', { error, data });
      throw error;
    }
  }

  async bulkUpdate(data: (Partial<SocialMedia> & { id: string })[]): Promise<void> {
    try {
      await this.db.transaction().execute(async (trx) => {
        for (const entity of data) {
          await trx
            .updateTable('social_media')
            .set(entity)
            .where('id', '=', entity.id)
            .execute();
        }
      });
    } catch (error) {
      this.logger.error('Error in bulk updating social media entities', { error, data });
      throw error;
    }
  }
  async delete(id: string): Promise<void> {
    try {
      await this.db.deleteFrom('social_media').where('id', '=', id).execute();
    } catch (error) {
      this.logger.error(`Error deleting social media entity with ID ${id}`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<SocialMedia | null> {
    return (await this.db.selectFrom('social_media')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()) as SocialMedia || null;
  }

  async findByUserIdOrHash(userId: string | null, userIdHash: string | null): Promise<SocialMedia | null> {
    return (await this.db
      .selectFrom('social_media')
      .selectAll()
      .where((eb) => {
        if (userId && userIdHash) {
          return eb.and([
            eb('platformUserId', '=', userId),
            eb('platformUserIdHash', '=', userIdHash)
          ]);
        } else if (userId) {
          return eb('platformUserId', '=', userId);
        } else if (userIdHash) {
          return eb('platformUserIdHash', '=', userIdHash);
        }
        return sql`false`; // if both are null, return false
      })
      .executeTakeFirst()) as SocialMedia || null;
  }

  async findbyUrl(url: string): Promise<SocialMedia | null> {
    return (await this.db.selectFrom('social_media')
      .selectAll()
      .where('url', '=', url)
      .executeTakeFirst()) as SocialMedia || null;
  }

  async findbyName(name: string): Promise<SocialMedia | null> {
    return (await this.db.selectFrom('social_media')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst()) as SocialMedia || null;
  }

  async findByUserIdandPlatform(userId: string, platform: string): Promise<SocialMedia | null> {
    return (await this.db.selectFrom('social_media')
      .selectAll()
      .where((eb) => eb.and([eb('platformUserId', '=', userId), eb('platform', '=', platform)]))
      .executeTakeFirst()) as SocialMedia || null;
  }

  async GetAllImcomplteSocialMediaProfiles(): Promise<SocialMedia[]> {
    return (await this.db.selectFrom('social_media')
      .selectAll()
      .where((eb) => eb.or([eb('followers', '=', 0),
      eb('following', '=', 0),
      eb('posts', '=', 0),
      eb('description', '=', ''),
      eb('name', '=', '')
      ]))
      .execute()) as SocialMedia[];
  }

  async GetAllSocialMediabyPersonId(personId: string): Promise<SocialMedia[]> {
    return (await this.db.selectFrom('social_media')
      .selectAll()
      .where('personId', '=', personId)
      .execute()) as SocialMedia[];
  }

  async GetAllSocialMediaByPersonIdAndPlatform(personId: string, platform: string): Promise<SocialMedia[]> {
    return (await this.db.selectFrom('social_media')
      .selectAll()
      .where((eb) => eb.and([eb('personId', '=', personId), eb('platform', '=', platform)]))
      .execute()) as SocialMedia[];
  }

  async GetAll(): Promise<SocialMedia[]> {
    return (await this.db.selectFrom('social_media').selectAll().execute()) as SocialMedia[];
  }

  async reassignSocialMedia(
    personId: string,
    oldPersonId: string,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      try {
        await trx
          .updateTable('social_media')
          .set({ personId })
          .where('personId', '=', oldPersonId)
          .execute();
      } catch (error) {
        this.logger.error('Error reassigning social media entities', { error, personId, oldPersonId });
        throw error;
      }
    });
  }
}
