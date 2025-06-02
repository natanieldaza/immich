import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, Selectable, sql, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFaces, DB, FaceSearch, Person, PersonSidecar } from 'src/db';

import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType, AssetVisibility, SourceType } from 'src/enum';

import { PersonRelationshipDto } from 'src/dtos/person-relationship.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';
import { SocialMediaResponseDto } from 'src/dtos/social-media.dto';

import { LoggingRepository } from 'src/repositories/logging.repository';
import { removeUndefinedKeys } from 'src/utils/database';
import { paginationHelper, PaginationOptions } from 'src/utils/pagination';

export interface PersonSearchOptions {
  minimumFaceCount: number;
  withHidden: boolean;
  closestFaceAssetId?: string;
}

export interface PersonNameSearchOptions {
  withHidden?: boolean;
}

export interface PersonNameResponse {
  id: string;
  name: string;
}

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface UpdateFacesData {
  oldPersonId?: string;
  faceIds?: string[];
  newPersonId: string;
}

export interface PersonStatistics {
  assets: number;
}

export interface DeleteFacesOptions {
  sourceType: SourceType;
}

export interface SidecarPerson {
  id: string;
  ownerId: string;
  hashId: string | null;
  name: string | null;
  userId: string;
  description: string | null;
  relationType?: string;
  filePath?: string;
  platform?: string;
}


export interface GetAllPeopleOptions {
  ownerId?: string;
  thumbnailPath?: string;
  faceAssetId?: string | null;
  isHidden?: boolean;
}

export interface GetAllFacesOptions {
  personId?: string | null;
  assetId?: string;
  sourceType?: SourceType;
}

export type UnassignFacesOptions = DeleteFacesOptions;

export type SelectFaceOptions = (keyof Selectable<AssetFaces>)[];

const withPerson = (eb: ExpressionBuilder<DB, 'asset_faces'>) => {
  return jsonObjectFrom(
    eb.selectFrom('person').selectAll('person').whereRef('person.id', '=', 'asset_faces.personId'),
  ).as('person');
};

const withAsset = (eb: ExpressionBuilder<DB, 'asset_faces'>) => {
  return jsonObjectFrom(
    eb.selectFrom('assets').selectAll('assets').whereRef('assets.id', '=', 'asset_faces.assetId'),
  ).as('asset');
};

const withFaceSearch = (eb: ExpressionBuilder<DB, 'asset_faces'>) => {
  return jsonObjectFrom(
    eb.selectFrom('face_search').selectAll('face_search').whereRef('face_search.faceId', '=', 'asset_faces.id'),
  ).as('faceSearch');
};

@Injectable()
export class PersonRepository {
  constructor(@InjectKysely() private db: Kysely<DB>, private logger: LoggingRepository) { }

  // Map to store people and their relationships
  // The key is the main person's name, and the value is a map of related people





  private people = new Map<string, Map<string, SidecarPerson[]>>();
  private DirectoryToPeople = new Map<string, string>();

  getPeople(): Map<string, Map<string, SidecarPerson[]>> {
    return this.people;
  }

  getDirectoryToPeople(): Map<string, string> {
    return this.DirectoryToPeople;
  }

  getPersonIdByDirectoryId(directoryId: string): string | undefined {
    return this.DirectoryToPeople.get(directoryId);
  }


  async addPerson(
    mainPersonName: string,
    mainPersonUserId: string,
    mainPersonId: string,
    relatedPersonName: string,
    relatedPersonUserId: string,
    relatedPersonId: string,
    relationType: string,  // Relation type key (e.g., "friend", "colleague")
    ownerId: string,
    description: string = '',
    assetPath: string = '',
    platform: string,
    directoryId: string
  ): Promise<void> {
    const mainPerson: SidecarPerson = {
      id: "",
      ownerId,
      hashId: mainPersonId,
      name: mainPersonName,
      userId: mainPersonUserId,
      description,
      relationType,
      filePath: assetPath,
      platform
    };

    const relatedPerson: SidecarPerson = {
      id: "",
      ownerId,
      hashId: relatedPersonId,
      name: relatedPersonName,
      userId: relatedPersonUserId,
      description,
      relationType,
      filePath: assetPath, // Ensuring filePath is included
      platform
    };

    // Ensure the main person's map exists
    if (!this.people.has(mainPersonUserId)) {
      this.people.set(mainPersonUserId, new Map());
      if (!this.DirectoryToPeople.has(directoryId)) {
         this.DirectoryToPeople.set(directoryId, mainPersonUserId);
      }
    }



    const relatedPeople = this.people.get(mainPersonUserId)!;

    // Ensure the relation type exists
    if (!relatedPeople.has(relationType)) {
      relatedPeople.set(relationType, []);
    }

    const personList = relatedPeople.get(relationType)!;

    // Ensure the main person is always stored under 'main'
    if (!relatedPeople.has('main')) {
      relatedPeople.set('main', []);
    }
    const mainList = relatedPeople.get('main')!;
    if (!mainList.some((p) => p.userId === mainPersonUserId)) {
      mainList.push(mainPerson);
    }
    else {
      if (description && mainList[0].description && !mainList[0].description.includes(description)) {
        mainList[0].description = mainList[0].description
          ? `${mainList[0].description}. ${description}`
          : description;
      }
    }




    if (relatedPersonId === '' && relationType !== 'social_media') {
      return;
    }

    // Check if the related person already exists
    const existingPerson = personList.find((p) => p.userId === relatedPersonUserId);

    if (existingPerson) {
      await this.updatePerson(existingPerson);

    } else {
      // Add the new related person
      personList.push(relatedPerson);
    }
  }


  private async updatePerson(person: SidecarPerson): Promise<SidecarPerson> {
    // Add persistence logic if needed (e.g., database update)
    //process.stdout.write(`Updated Person: ${JSON.stringify(person)} \n`);
    return person;
  }

  async getPeopleByName(userId: string): Promise<Map<string, SidecarPerson[]>> {

    const personMap = this.people.get(userId);
    if (!personMap) {
      throw new Error(`No person found for userId: ${userId}`);
    }

    const result = new Map<string, SidecarPerson[]>();
    for (const [relationType, people] of personMap.entries()) {
      result.set(relationType, people);
    }
    return result;

  }



  @GenerateSql({ params: [{ oldPersonId: DummyValue.UUID, newPersonId: DummyValue.UUID }] })
  async reassignFaces({ oldPersonId, faceIds, newPersonId }: UpdateFacesData): Promise<number> {
    const result = await this.db
      .updateTable('asset_faces')
      .set({ personId: newPersonId })
      .$if(!!oldPersonId, (qb) => qb.where('asset_faces.personId', '=', oldPersonId!))
      .$if(!!faceIds, (qb) => qb.where('asset_faces.id', 'in', faceIds!))
      .executeTakeFirst();

    return Number(result.numChangedRows ?? 0);
  }

  async unassignFaces({ sourceType }: UnassignFacesOptions): Promise<void> {
    await this.db
      .updateTable('asset_faces')
      .set({ personId: null })
      .where('asset_faces.sourceType', '=', sourceType)
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.db.deleteFrom('person').where('person.id', 'in', ids).execute();
  }

  async deleteFaces({ sourceType }: DeleteFacesOptions): Promise<void> {
    await this.db.deleteFrom('asset_faces').where('asset_faces.sourceType', '=', sourceType).execute();
  }

  getAllFaces(options: GetAllFacesOptions = {}) {
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .$if(options.personId === null, (qb) => qb.where('asset_faces.personId', 'is', null))
      .$if(!!options.personId, (qb) => qb.where('asset_faces.personId', '=', options.personId!))
      .$if(!!options.sourceType, (qb) => qb.where('asset_faces.sourceType', '=', options.sourceType!))
      .$if(!!options.assetId, (qb) => qb.where('asset_faces.assetId', '=', options.assetId!))
      .where('asset_faces.deletedAt', 'is', null)
      .stream();
  }

  getAll(options: GetAllPeopleOptions = {}) {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .$if(!!options.ownerId, (qb) => qb.where('person.ownerId', '=', options.ownerId!))
      .$if(options.thumbnailPath !== undefined, (qb) => qb.where('person.thumbnailPath', '=', options.thumbnailPath!))
      .$if(options.faceAssetId === null, (qb) => qb.where('person.faceAssetId', 'is', null))
      .$if(!!options.faceAssetId, (qb) => qb.where('person.faceAssetId', '=', options.faceAssetId!))
      .$if(options.isHidden !== undefined, (qb) => qb.where('person.isHidden', '=', options.isHidden!))
      .stream();
  }

  async getAllForUser(pagination: PaginationOptions, userId: string, options?: PersonSearchOptions) {
    const items = await this.db
      .selectFrom('person')
      .selectAll('person')
      .innerJoin('asset_faces', 'asset_faces.personId', 'person.id')
      .innerJoin('assets', (join) =>
        join
          .onRef('asset_faces.assetId', '=', 'assets.id')
          .on('assets.visibility', '=', sql.lit(AssetVisibility.TIMELINE))
          .on('assets.deletedAt', 'is', null),
      )
      .where('person.ownerId', '=', userId)
      .where('asset_faces.deletedAt', 'is', null)
      .orderBy('person.isHidden', 'asc')
      .orderBy('person.isFavorite', 'desc')
      .having((eb) =>
        eb.or([
          eb('person.name', '!=', ''),
          eb((innerEb) => innerEb.fn.count('asset_faces.assetId'), '>=', options?.minimumFaceCount || 1),
        ]),
      )
      .groupBy('person.id')
      .$if(!!options?.closestFaceAssetId, (qb) =>
        qb.orderBy((eb) =>
          eb(
            (eb) =>
              eb
                .selectFrom('face_search')
                .select('face_search.embedding')
                .whereRef('face_search.faceId', '=', 'person.faceAssetId'),
            '<=>',
            (eb) =>
              eb
                .selectFrom('face_search')
                .select('face_search.embedding')
                .where('face_search.faceId', '=', options!.closestFaceAssetId!),
          ),
        ),
      )
      .$if(!options?.closestFaceAssetId, (qb) =>
        qb
          .orderBy(sql`NULLIF(person.name, '') is null`, 'asc')
          .orderBy((eb) => eb.fn.count('asset_faces.assetId'), 'desc')
          .orderBy(sql`NULLIF(person.name, '')`, sql`asc nulls last`)
          .orderBy('person.createdAt'),
      )
      .$if(!options?.withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .offset(pagination.skip ?? 0)
      .limit(pagination.take + 1)
      .execute();

    return paginationHelper(items, pagination.take);
  }

  @GenerateSql()
  getAllWithoutFaces() {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .leftJoin('asset_faces', 'asset_faces.personId', 'person.id')
      .where('asset_faces.deletedAt', 'is', null)
      .having((eb) => eb.fn.count('asset_faces.assetId'), '=', 0)
      .groupBy('person.id')
      .execute();
  }


  @GenerateSql()
  getAllWithoutFacesAndNoSocialMedia() {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .leftJoin('asset_faces', 'asset_faces.personId', 'person.id')
      .leftJoin('social_media', 'social_media.personId', 'person.id')
      .where((eb) =>
        eb.or([
          eb('asset_faces.id', 'is', null),
          eb('asset_faces.deletedAt', 'is not', null), // cara eliminada = no contar
        ])
      )
      .where('social_media.id', 'is', null) // sin redes sociales
      .execute();
  }
  
  @GenerateSql({ params: [DummyValue.UUID] })
  getFaces(assetId: string) {
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .select(withPerson)
      .where('asset_faces.assetId', '=', assetId)
      .where('asset_faces.deletedAt', 'is', null)
      .orderBy('asset_faces.boundingBoxX1', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceById(id: string) {
    // TODO return null instead of find or fail
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .select(withPerson)
      .where('asset_faces.id', '=', id)
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceForFacialRecognitionJob(id: string) {
    return this.db
      .selectFrom('asset_faces')
      .select(['asset_faces.id', 'asset_faces.personId', 'asset_faces.sourceType'])
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('assets')
            .select(['assets.ownerId', 'assets.visibility', 'assets.fileCreatedAt'])
            .whereRef('assets.id', '=', 'asset_faces.assetId'),
        ).as('asset'),
      )
      .select(withFaceSearch)
      .where('asset_faces.id', '=', id)
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getDataForThumbnailGenerationJob(id: string) {
    return this.db
      .selectFrom('person')
      .innerJoin('asset_faces', 'asset_faces.id', 'person.faceAssetId')
      .innerJoin('assets', 'asset_faces.assetId', 'assets.id')
      .leftJoin('exif', 'exif.assetId', 'assets.id')
      .select([
        'person.ownerId',
        'asset_faces.boundingBoxX1 as x1',
        'asset_faces.boundingBoxY1 as y1',
        'asset_faces.boundingBoxX2 as x2',
        'asset_faces.boundingBoxY2 as y2',
        'asset_faces.imageWidth as oldWidth',
        'asset_faces.imageHeight as oldHeight',
        'assets.type',
        'assets.originalPath',
        'exif.orientation as exifOrientation',
      ])
      .select((eb) =>
        eb
          .selectFrom('asset_files')
          .select('asset_files.path')
          .whereRef('asset_files.assetId', '=', 'assets.id')
          .where('asset_files.type', '=', sql.lit(AssetFileType.PREVIEW))
          .as('previewPath'),
      )
      .where('person.id', '=', id)
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async reassignFace(assetFaceId: string, newPersonId: string): Promise<number> {
    const result = await this.db
      .updateTable('asset_faces')
      .set({ personId: newPersonId })
      .where('asset_faces.id', '=', assetFaceId)
      .executeTakeFirst();

    return Number(result.numChangedRows ?? 0);
  }

  getById(personId: string) {
    return this.db //
      .selectFrom('person')
      .selectAll('person')
      .where('person.id', '=', personId)
      .executeTakeFirst();
  }
  async getPersonResponseDto(personId: string): Promise<PersonResponseDto | undefined> {
    const rows = await this.getByIdWithSocialMediaAndRelationships(personId);
    if (!rows.length) return undefined;

    const first = rows[0];

    const socialMediaMap = new Map<string, SocialMediaResponseDto>();
    const relationshipsMap = new Map<string, PersonRelationshipDto>();

    for (const row of rows) {
      // Social media mapping
      if (row.sm_id && !socialMediaMap.has(row.sm_id)) {
        socialMediaMap.set(row.sm_id, {
          id: row.sm_id,
          platform: row.sm_platform,
          platformUserId: row.sm_platformUserId,
          platformUserIdHash: row.sm_platformUserIdHash,
          name: row.sm_name,
          description: row.sm_description,
          url: row.sm_url,
          followers: row.sm_followers,
          following: row.sm_following,
          posts: row.sm_posts,
          updatedAt: row.sm_updatedAt,
          lastDownloaded: row.sm_lastDownloaded,
          lastDownloadedNode: row.sm_lastDownloadedNode,
          thumbnailPath: row.sm_thumbnailPath,
          personId: row.sm_personId,
        });
      }

      // Relationship mapping
      const relKey = `${row.rel_personId}-${row.rel_relatedPersonId}-${row.rel_type}`;
      if (row.rel_personId && row.rp_id && !relationshipsMap.has(relKey)) {
        relationshipsMap.set(relKey, {
          personId: row.rel_personId,
          relatedPersonId: row.rel_relatedPersonId,
          type: row.rel_type,
          direction: row.rel_personId === personId ? 'asSource' : 'asTarget',
          relatedPerson: {
            id: row.rp_id,
            name: row.rp_name,
            birthDate: row.rp_birthDate,
            age: row.rp_age,
            thumbnailPath: row.rp_thumbnailPath,
          },
        });
      }
    }

    return {
      id: first.id,
      name: first.name,
      //2009-07-11T00:00:00.000Z get only 2009-07-11
      birthDate: first.birthDate ? first.birthDate.toISOString().split('T')[0] : null,
      thumbnailPath: first.thumbnailPath,
      isHidden: first.isHidden,
      updatedAt: first.updatedAt,
      isFavorite: first.isFavorite,
      color: first.color,
      description: first.description,
      age: first.age,
      country: first.country,
      city: first.city,
      socialMedia: Array.from(socialMediaMap.values()),
      relationships: Array.from(relationshipsMap.values()),
    };
  }

  async getByIdWithSocialMediaAndRelationships(personId: string): Promise<any[]> {
    return await this.db
      .selectFrom('person')
      .leftJoin('social_media', 'social_media.personId', 'person.id')
      .leftJoin('person_relationship', 'person_relationship.personId', 'person.id')
      .leftJoin('person as related', 'related.id', 'person_relationship.relatedPersonId')
      .select([
        // Person
        'person.id',
        'person.name',
        'person.birthDate',
        'person.thumbnailPath',
        'person.isHidden',
        'person.updatedAt',
        'person.isFavorite',
        'person.color',
        'person.description',
        'person.age',
        'person.country',
        'person.city',

        // Social media
        'social_media.id as sm_id',
        'social_media.platform as sm_platform',
        'social_media.platformUserId as sm_platformUserId',
        'social_media.platformUserIdHash as sm_platformUserIdHash',
        'social_media.name as sm_name',
        'social_media.description as sm_description',
        'social_media.url as sm_url',
        'social_media.followers as sm_followers',
        'social_media.following as sm_following',
        'social_media.posts as sm_posts',
        'social_media.updatedAt as sm_updatedAt',
        'social_media.lastDownloaded as sm_lastDownloaded',
        'social_media.lastDownloadedNode as sm_lastDownloadedNode',
        'social_media.thumbnailPath as sm_thumbnailPath',
        'social_media.personId as sm_personId',

        // Relationship
        'person_relationship.personId as rel_personId',
        'person_relationship.relatedPersonId as rel_relatedPersonId',
        'person_relationship.type as rel_type',

        // Related Person
        'related.id as rp_id',
        'related.name as rp_name',
        'related.birthDate as rp_birthDate',
        'related.age as rp_age',
        'related.thumbnailPath as rp_thumbnailPath',
      ])
      .where('person.id', '=', personId)
      .execute();
  }
  

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING, { withHidden: true }] })
  getByName(userId: string, personName: string, { withHidden }: PersonNameSearchOptions) {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .where((eb) =>
        eb.and([
          eb('person.ownerId', '=', userId),
          eb.or([
            eb(eb.fn('lower', ['person.name']), 'like', `${personName.toLowerCase()}%`),
            eb(eb.fn('lower', ['person.name']), 'like', `% ${personName.toLowerCase()}%`),
          ]),
        ]),
      )
      .limit(1000)
      .$if(!withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, { withHidden: true }] })
  getDistinctNames(userId: string, { withHidden }: PersonNameSearchOptions): Promise<PersonNameResponse[]> {
    return this.db
      .selectFrom('person')
      .select(['person.id', 'person.name'])
      .distinctOn((eb) => eb.fn('lower', ['person.name']))
      .where((eb) => eb.and([eb('person.ownerId', '=', userId), eb('person.name', '!=', '')]))
      .$if(!withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getStatistics(personId: string): Promise<PersonStatistics> {
    const result = await this.db
      .selectFrom('asset_faces')
      .leftJoin('assets', (join) =>
        join
          .onRef('assets.id', '=', 'asset_faces.assetId')
          .on('asset_faces.personId', '=', personId)
          .on('assets.visibility', '=', sql.lit(AssetVisibility.TIMELINE))
          .on('assets.deletedAt', 'is', null),
      )
      .select((eb) => eb.fn.count(eb.fn('distinct', ['assets.id'])).as('count'))
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirst();

    return {
      assets: result ? Number(result.count) : 0,
    };
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getNumberOfPeople(userId: string) {
    const zero = sql.lit(0);
    return this.db
      .selectFrom('person')
      .where((eb) =>
        eb.exists((eb) =>
          eb
            .selectFrom('asset_faces')
            .whereRef('asset_faces.personId', '=', 'person.id')
            .where('asset_faces.deletedAt', 'is', null)
            .where((eb) =>
              eb.exists((eb) =>
                eb
                  .selectFrom('assets')
                  .whereRef('assets.id', '=', 'asset_faces.assetId')
                  .where('assets.visibility', '=', sql.lit(AssetVisibility.TIMELINE))
                  .where('assets.deletedAt', 'is', null),
              ),
            ),
        ),
      )
      .where('person.ownerId', '=', userId)
      .select((eb) => eb.fn.coalesce(eb.fn.countAll<number>(), zero).as('total'))
      .select((eb) => eb.fn.coalesce(eb.fn.countAll<number>().filterWhere('isHidden', '=', true), zero).as('hidden'))
      .executeTakeFirstOrThrow();
  }

  create(person: Insertable<Person>) {
    return this.db.insertInto('person').values(person).returningAll().executeTakeFirstOrThrow();
  }

  async createAll(people: Insertable<Person>[]): Promise<string[]> {
    if (people.length === 0) {
      return [];
    }

    const results = await this.db.insertInto('person').values(people).returningAll().execute();
    return results.map(({ id }) => id);
  }

  @GenerateSql({ params: [[], [], [{ faceId: DummyValue.UUID, embedding: DummyValue.VECTOR }]] })
  async refreshFaces(
    facesToAdd: (Insertable<AssetFaces> & { assetId: string })[],
    faceIdsToRemove: string[],
    embeddingsToAdd?: Insertable<FaceSearch>[],
  ): Promise<void> {
    let query = this.db;
    if (facesToAdd.length > 0) {
      (query as any) = query.with('added', (db) => db.insertInto('asset_faces').values(facesToAdd));
    }

    if (faceIdsToRemove.length > 0) {
      (query as any) = query.with('removed', (db) =>
        db.deleteFrom('asset_faces').where('asset_faces.id', '=', (eb) => eb.fn.any(eb.val(faceIdsToRemove))),
      );
    }

    if (embeddingsToAdd?.length) {
      (query as any) = query.with('added_embeddings', (db) => db.insertInto('face_search').values(embeddingsToAdd));
    }

    await query.selectFrom(sql`(select 1)`.as('dummy')).execute();
  }

  async update(person: Updateable<Person> & { id: string }) {
    return this.db
      .updateTable('person')
      .set(person)
      .where('person.id', '=', person.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateAll(people: Insertable<Person>[]): Promise<void> {
    if (people.length === 0) {
      return;
    }

    await this.db
      .insertInto('person')
      .values(people)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet((eb) =>
          removeUndefinedKeys(
            {
              name: eb.ref('excluded.name'),
              birthDate: eb.ref('excluded.birthDate'),
              thumbnailPath: eb.ref('excluded.thumbnailPath'),
              faceAssetId: eb.ref('excluded.faceAssetId'),
              isHidden: eb.ref('excluded.isHidden'),
              isFavorite: eb.ref('excluded.isFavorite'),
              color: eb.ref('excluded.color'),
            },
            people[0],
          ),
        ),
      )
      .execute();
  }

  @GenerateSql({ params: [[{ assetId: DummyValue.UUID, personId: DummyValue.UUID }]] })
  @ChunkedArray()
  getFacesByIds(ids: AssetFaceId[]) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    const assetIds: string[] = [];
    const personIds: string[] = [];
    for (const { assetId, personId } of ids) {
      assetIds.push(assetId);
      personIds.push(personId);
    }

    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .select(withAsset)
      .select(withPerson)
      .where('asset_faces.assetId', 'in', assetIds)
      .where('asset_faces.personId', 'in', personIds)
      .where('asset_faces.deletedAt', 'is', null)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getRandomFace(personId: string) {
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .where('asset_faces.personId', '=', personId)
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql()
  async getLatestFaceDate(): Promise<string | undefined> {
    const result = (await this.db
      .selectFrom('asset_job_status')
      .select((eb) => sql`${eb.fn.max('asset_job_status.facesRecognizedAt')}::text`.as('latestDate'))
      .executeTakeFirst()) as { latestDate: string } | undefined;

    return result?.latestDate;
  }

  async createAssetFace(face: Insertable<AssetFaces>): Promise<void> {
    await this.db.insertInto('asset_faces').values(face).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAssetFace(id: string): Promise<void> {
    await this.db.deleteFrom('asset_faces').where('asset_faces.id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async softDeleteAssetFaces(id: string): Promise<void> {
    await this.db.updateTable('asset_faces').set({ deletedAt: new Date() }).where('asset_faces.id', '=', id).execute();
  }

  async vacuum({ reindexVectors }: { reindexVectors: boolean }): Promise<void> {
    await sql`VACUUM ANALYZE asset_faces, face_search, person`.execute(this.db);
    await sql`REINDEX TABLE asset_faces`.execute(this.db);
    await sql`REINDEX TABLE person`.execute(this.db);
    if (reindexVectors) {
      await sql`REINDEX TABLE face_search`.execute(this.db);
    }
  }

  async addOrUpdatePersonSidecar(
    personId: string | null,
    sidecarPath: string,
    lastProcessedAt: Date | null,
    updatedAt: Date | null,
    ownerId: string
  ): Promise<{ id: string | null; created: boolean; lastProcessedAt: Date | null; personId: string | null }> {
    try {
      const updateSet: Record<string, any> = {};
      if (lastProcessedAt !== null) {
        updateSet.lastProcessedAt = lastProcessedAt;
      }
      if (updatedAt !== null) {
        updateSet.updatedAt = updatedAt;
      }

      const insertResult = await this.db
        .insertInto('person_sidecar')
        .values({
          personId: String(personId),
          sidecarPath,
          lastProcessedAt,
          updatedAt: updatedAt ?? sql`DEFAULT`,
          ownerId
        })
        .onConflict((oc) =>
          oc
            .columns(['personId', 'sidecarPath', 'ownerId'])
            .doUpdateSet(updateSet)
        )
        .returning(['id', 'lastProcessedAt', 'personId'])
        .executeTakeFirst();

      return {
        id: insertResult?.id ?? null,
        created: insertResult?.id ? false : true,
        lastProcessedAt: insertResult?.lastProcessedAt ?? null,
        personId: insertResult?.personId ?? null,
      };
    } catch (error) {
      process.stdout.write(`Error inserting or updating sidecar for ${personId}, ${sidecarPath}: ${error}\n`);
      return { id: null, created: false, lastProcessedAt: null, personId: null };
    }
  }

  async getPersonSidecarById(id: string): Promise<PersonSidecar[]> {
    return this.db
      .selectFrom('person_sidecar')
      .selectAll('person_sidecar')
      .where('person_sidecar.id', '=', id)
      .execute() as Promise<PersonSidecar[]>;
  }

  async getPersonSidecarByPersonId(personId: string): Promise<PersonSidecar[]> {
    return this.db
      .selectFrom('person_sidecar')
      .selectAll('person_sidecar')
      .where('person_sidecar.personId', '=', personId)
      .execute() as Promise<PersonSidecar[]>;
  }

  async getAllPeopleSidecars(): Promise<PersonSidecar[]> {
    return this.db
      .selectFrom('person_sidecar')
      .selectAll('person_sidecar')
      .execute() as Promise<PersonSidecar[]>;
  }

  async reassignPersonSidecar(
    personId: string,
    newPersonId: string): Promise<void> {
    await this.db
      .updateTable('person_sidecar')
      .set({ personId: newPersonId })
      .where('person_sidecar.personId', '=', personId)
      .execute();
  }

}
