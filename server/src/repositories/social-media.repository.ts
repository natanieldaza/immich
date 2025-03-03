import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, Selectable, sql } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFaces, DB, FaceSearch, Person } from 'src/db';
import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { SourceType } from 'src/enum';
import { mapUpsertColumns } from 'src/utils/database';
import { Paginated, PaginationOptions } from 'src/utils/pagination';
import { FindOptionsRelations } from 'typeorm';

import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SocialMediaEntity } from 'src/entities/social-media.entity';


@Injectable()
export class SocialMediaRepository {
  constructor(@InjectKysely() private readonly db: Kysely<DB>) {}

  async create(data: Insertable<SocialMediaEntity>): Promise<SocialMediaEntity> {
    return this.db.insertInto('social_media').values(data).returningAll().executeTakeFirst() as Promise<SocialMediaEntity>;
    
  }
  
  async update(social_media: Partial<SocialMediaEntity> & { id: string }): Promise<SocialMediaEntity> {
    return this.db
    .updateTable('social_media')
    .set(social_media)
    .where('id', '=', social_media.id)
    .returningAll().executeTakeFirstOrThrow() as Promise<SocialMediaEntity>;
    
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('social_media').where('id', '=', id).execute();
  }

  
  findById(social_media_id: string ): Promise<SocialMediaEntity | null> {
    return (this.db
    .selectFrom('social_media')
    .selectAll('social_media')
    .where('id', '=', social_media_id)
    .executeTakeFirst() ?? null) as Promise<SocialMediaEntity | null>;
  }

  find (social_media_uid :string, social_media_hashid:string): Promise<SocialMediaEntity | null> {
    return (this.db
    .selectFrom('social_media')
    .selectAll('social_media')
    .where('platformUserId', '=', social_media_uid)
    .where('platformUserIdHash', '=', social_media_hashid)
    .executeTakeFirst() ?? null) as Promise<SocialMediaEntity | null>;
   
  }

}

