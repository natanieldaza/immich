import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import fs from 'fs';
import { Insertable, Updateable } from 'kysely';
import path from 'path';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { Person } from 'src/database';
import { AssetFaces, FaceSearch } from 'src/db';
import { Chunked, OnJob } from 'src/decorators';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { PersonRelationshipDto } from 'src/dtos/person-relationship.dto';
import {
  AssetFaceCreateDto,
  AssetFaceDeleteDto,
  AssetFaceResponseDto,
  AssetFaceUpdateDto,
  FaceDto,
  mapFaces,
  mapPersonDb,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonCreateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonStatisticsResponseDto,
  PersonUpdateDto
} from 'src/dtos/person.dto';
import {
  AssetVisibility,
  CacheControl,
  JobName,
  JobStatus,
  Permission,
  PersonPathType,
  QueueName,
  RelationshipType,
  SourceType,
  SystemMetadataKey,
  VectorIndex,
} from 'src/enum';
import { BoundingBox } from 'src/repositories/machine-learning.repository';
import { SidecarPerson, UpdateFacesData } from 'src/repositories/person.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { isFacialRecognitionEnabled } from 'src/utils/misc';

@Injectable()
export class PersonService extends BaseService {
  async getAll(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const { withHidden = false, closestAssetId, closestPersonId, page, size } = dto;
    let closestFaceAssetId = closestAssetId;
    const pagination = {
      take: size,
      skip: (page - 1) * size,
    };

    if (closestPersonId) {
      const person = await this.personRepository.getById(closestPersonId);
      if (!person?.faceAssetId) {
        throw new NotFoundException('Person not found');
      }
      closestFaceAssetId = person.faceAssetId;
    }
    const { machineLearning } = await this.getConfig({ withCache: false });
    const { items, hasNextPage } = await this.personRepository.getAllForUser(pagination, auth.user.id, {
      minimumFaceCount: machineLearning.facialRecognition.minFaces,
      withHidden,
      closestFaceAssetId,
    });
    const { total, hidden } = await this.personRepository.getNumberOfPeople(auth.user.id);
    this.logger.debug(`Found ${items.length} people`);
    this.logger.debug(`Total people: ${total}`);
    this.logger.debug(`Hidden people: ${hidden}`);
    return {
      people: items.map((person) => mapPersonDb(person)),
    
      hasNextPage,
      total,
      hidden,
    };
  }

  async reassignFaces(auth: AuthDto, personId: string, dto: AssetFaceUpdateDto): Promise<PersonResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [personId] });
    const person = await this.findOrFail(personId);
    const result: PersonResponseDto[] = [];
    const changeFeaturePhoto: string[] = [];
    for (const data of dto.data) {
      const faces = await this.personRepository.getFacesByIds([{ personId: data.personId, assetId: data.assetId }]);

      for (const face of faces) {
        await this.requireAccess({ auth, permission: Permission.PERSON_CREATE, ids: [face.id] });
        if (person.faceAssetId === null) {
          changeFeaturePhoto.push(person.id);
        }
        if (face.person && face.person.faceAssetId === face.id) {
          changeFeaturePhoto.push(face.person.id);
        }

        await this.personRepository.reassignFace(face.id, personId);
      }

      result.push(mapPersonDb(person));
    }
    if (changeFeaturePhoto.length > 0) {
      // Remove duplicates
      await this.createNewFeaturePhoto([...new Set(changeFeaturePhoto)]);
    }
    return result;
  }

  async reassignFacesById(auth: AuthDto, personId: string, dto: FaceDto): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [personId] });
    await this.requireAccess({ auth, permission: Permission.PERSON_CREATE, ids: [dto.id] });
    const face = await this.personRepository.getFaceById(dto.id);
    const person = await this.findOrFail(personId);

    await this.personRepository.reassignFace(face.id, personId);
    if (person.faceAssetId === null) {
      await this.createNewFeaturePhoto([person.id]);
    }
    if (face.person && face.person.faceAssetId === face.id) {
      await this.createNewFeaturePhoto([face.person.id]);
    }

    return await this.findOrFail(personId).then(mapPersonDb);
  }

  async getFacesById(auth: AuthDto, dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.ASSET_READ, ids: [dto.id] });
    const faces = await this.personRepository.getFaces(dto.id);
    return faces.map((asset) => mapFaces(asset, auth));
  }

  async createNewFeaturePhoto(changeFeaturePhoto: string[]) {
    this.logger.verbose(
      `Changing feature photos for ${changeFeaturePhoto.length} ${changeFeaturePhoto.length > 1 ? 'people' : 'person'}`,
    );

    const jobs: JobItem[] = [];
    for (const personId of changeFeaturePhoto) {
      const assetFace = await this.personRepository.getRandomFace(personId);

      if (assetFace) {
        await this.personRepository.update({ id: personId, faceAssetId: assetFace.id });
        jobs.push({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: personId } });
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  async getById(auth: AuthDto, id: string): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [id] });
    //return this.findOrFail(id).then(mapPerson);

    const person = await this.personRepository.getPersonResponseDto(id);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return person;
  }

  async getStatistics(auth: AuthDto, id: string): Promise<PersonStatisticsResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [id] });
    return this.personRepository.getStatistics(id);
  }

  async getThumbnail(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [id] });
    const person = await this.personRepository.getById(id);
    this.logger.debug(`Getting thumbnail for person ${id}`);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return new ImmichFileResponse({
      path: person.thumbnailPath,
      contentType: mimeTypes.lookup(person.thumbnailPath),
      cacheControl: CacheControl.PRIVATE_WITHOUT_CACHE,
    });
  }

  async create(auth: AuthDto, dto: PersonCreateDto): Promise<PersonResponseDto> {
    const person = await this.personRepository.create({
      ownerId: auth.user.id,
      name: dto.name,
      birthDate: dto.birthDate,
      age: dto.age,
      isHidden: dto.isHidden,
      isFavorite: dto.isFavorite,
      color: dto.color,
    });

    return mapPersonDb(person);
  }

  async update(auth: AuthDto, id: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [id] });
    this.logger.verbose(`Updating person ${id} with ${JSON.stringify(dto)}`);
    const { name, birthDate, age, isHidden, featureFaceAssetId: assetId, isFavorite, color, description, country, city, height } = dto;
        // TODO: set by faceId directly
    let faceId: string | undefined = undefined;
    if (assetId) {
      await this.requireAccess({ auth, permission: Permission.ASSET_READ, ids: [assetId] });
      const [face] = await this.personRepository.getFacesByIds([{ personId: id, assetId }]);
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face');
      }

      faceId = face.id;
    }

    const person = await this.personRepository.update({
      id,
      faceAssetId: faceId,
      name,
      birthDate,
      age,
      isHidden,
      isFavorite,
      color,
      description,
      country,
      city,
      height,
    });

    if (assetId) {
      await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id } });
    }

    return mapPersonDb(person);
  }

  async updateAll(auth: AuthDto, dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    const results: BulkIdResponseDto[] = [];
    for (const person of dto.people) {
      try {
        await this.update(auth, person.id, {
          isHidden: person.isHidden,
          name: person.name,
          birthDate: person.birthDate,
          featureFaceAssetId: person.featureFaceAssetId,
          isFavorite: person.isFavorite,
        });
        results.push({ id: person.id, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to update ${person.id} : ${error}`, error?.stack);
        results.push({ id: person.id, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }
  //  async createRelationship(personId: string, relatedPersonId: string, type: RelationshipType)

  async createRelationship(
    auth: AuthDto,
    personId: string,
    relatedPersonId: string,
    type: RelationshipType,
  ): Promise<PersonResponseDto> {
    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [personId, relatedPersonId] });
    await this.personRelationshipRepository.createRelationship(personId, relatedPersonId, type);
    const person = await this.findOrFail(personId);
    return mapPersonDb(person);
  }

  async getAllRelationships(auth: AuthDto, id: string): Promise<PersonRelationshipDto[]> {
    await this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [id] });
    const relationships = await this.personRelationshipRepository.getAllRelationships(id);
    return relationships.map((relationship) => ({
      ...relationship,
      relatedPerson: {
        ...relationship.relatedPerson,
        id: relationship.relatedPersonId,
        name: String(relationship.relatedPerson?.name),
        thumbnailPath: String(relationship.relatedPerson?.thumbnailPath),
        birthDate: String(relationship.relatedPerson?.birthDate),
        age: Number(relationship.relatedPerson?.age),
      },
    }));
  }

  @Chunked()
  private async delete(people: { id: string; thumbnailPath: string }[]) {
    await Promise.all(people.map((person) => this.storageRepository.unlink(person.thumbnailPath)));
    await this.personRepository.delete(people.map((person) => person.id));
    this.logger.debug(`Deleted ${people.length} people`);
  }

  @OnJob({ name: JobName.QUEUE_PERSON_SIDECAR_WRITE, queue: QueueName.PERSON_SIDECAR })
  async handleQueuePersonSidecarWrite(job: JobOf<JobName.QUEUE_PERSON_SIDECAR_WRITE>): Promise<JobStatus> {
    const { force } = job;
    const directoryToPeople = this.personRepository.getDirectoryToPeople();
    this.logger.log(`Preparing to queue ${directoryToPeople.size} person sidecar write jobs...`);

    if (directoryToPeople.size === 0) {
      this.logger.warn("No person sidecars found. Skipping job.");
      return JobStatus.SKIPPED;
    }

    for (const [key, personId] of directoryToPeople) {
      this.logger.verbose(`Processing sidecar for person ${key}`);


      try {
        await this.jobRepository.queue({
          name: JobName.PERSON_SIDECAR_WRITE,
          data: { directoryId: key },
        });
        this.logger.verbose(`Queued job for person ${key} with ID ${personId}`);
      } catch (error) {
        this.logger.error(`Failed to queue job for person ${key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.logger.verbose(`Finished queuing person sidecar write jobs.`);
    return JobStatus.SUCCESS;
  }


  @OnJob({ name: JobName.QUEUE_PERSON_DATA_SCRAPPING, queue: QueueName.PERSON_DATA_SCRAPPING })
  async handleQueuePersonDataScraping(job: JobOf<JobName.QUEUE_PERSON_DATA_SCRAPPING>): Promise<JobStatus> {
    try {
      const { force } = job;

      const peopleSidecars = await this.personRepository.getAllPeopleSidecars();


      this.logger.log(`Preparing to queue ${peopleSidecars.length} person data scraping jobs...`);

      if (peopleSidecars.length === 0) {
        this.logger.warn("No person sidecars found. Skipping job.");
        return JobStatus.SKIPPED;
      }

      for (const sidecar of peopleSidecars) {
        const { id, personId, sidecarPath, updatedAt, lastProcessedAt } = sidecar;

        if (!personId) {
          this.logger.warn("Encountered a person without a valid ID. Skipping.");
          continue;
        }

        if (!sidecarPath) {
          this.logger.warn(`Missing sidecar path for person ${personId}. Skipping.`);
          continue;
        }

        if (!id) {
          this.logger.warn(`Missing sidecar ID for person ${personId}. Skipping.`);
          continue;
        }

        if (
          lastProcessedAt &&
          updatedAt &&
          updatedAt <= lastProcessedAt &&
          !force
        ) {
          this.logger.verbose(`Skipping person ${personId} — already processed.`);
          continue;
        }

        try {
          await this.jobRepository.queue({
            name: JobName.PERSON_DATA_SCRAPPING,
            data: { personId: id },
          });
          this.logger.verbose(`Queued job for person ${id}, ${personId} and sidecar ${sidecarPath}`);
        } catch (error) {
          this.logger.error(`Failed to queue job for person ${personId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      this.logger.log(`Finished queuing person data scraping jobs.`);
      return JobStatus.SUCCESS;
    } catch (error) {
      this.logger.error(`Error processing person data scraping jobs: ${(error as Error).message}`);
      return JobStatus.FAILED;
    }
  }

  @OnJob({ name: JobName.PERSON_DATA_SCRAPPING, queue: QueueName.PERSON_DATA_SCRAPPING })
  async handlePersonDataScraping(job: JobOf<JobName.PERSON_DATA_SCRAPPING>): Promise<JobStatus> {
    try {
      const { personId } = job;

      if (!personId) {
        this.logger.warn("No person ID provided. Skipping job.");
        return JobStatus.SKIPPED;
      }

      await this.processSidecar(personId, false);

      return JobStatus.SUCCESS;
    } catch (error) {
      this.logger.error(`Error processing person data scraping job: ${(error as Error).message}`);
      return JobStatus.FAILED;
    }
  }
  @OnJob({ name: JobName.PERSON_CLEANUP, queue: QueueName.BACKGROUND_TASK })
  async handlePersonCleanup(): Promise<JobStatus> {
    const people = await this.personRepository.getAllWithoutFacesAndNoSocialMedia();
    await this.delete(people);
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.QUEUE_FACE_DETECTION, queue: QueueName.FACE_DETECTION })
  async handleQueueDetectFaces({ force }: JobOf<JobName.QUEUE_FACE_DETECTION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    if (force) {
      await this.personRepository.deleteFaces({ sourceType: SourceType.MACHINE_LEARNING });
      await this.handlePersonCleanup();
      await this.personRepository.vacuum({ reindexVectors: true });
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForDetectFacesJob(force);
    for await (const asset of assets) {
      jobs.push({ name: JobName.FACE_DETECTION, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);

    if (force === undefined) {
      await this.jobRepository.queue({ name: JobName.PERSON_CLEANUP });
    }

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.FACE_DETECTION, queue: QueueName.FACE_DETECTION })
  async handleDetectFaces({ id }: JobOf<JobName.FACE_DETECTION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const asset = await this.assetJobRepository.getForDetectFacesJob(id);
    const previewFile = asset?.files[0];
    if (!asset || asset.files.length !== 1 || !previewFile) {
      return JobStatus.FAILED;
    }

    if (asset.visibility === AssetVisibility.HIDDEN) {
      return JobStatus.SKIPPED;
    }

    const { imageHeight, imageWidth, faces } = await this.machineLearningRepository.detectFaces(
      machineLearning.urls,
      previewFile.path,
      machineLearning.facialRecognition,
    );
    this.logger.verbose(`${faces.length} faces detected in ${previewFile.path}`);

    const facesToAdd: (Insertable<AssetFaces> & { id: string })[] = [];
    const embeddings: FaceSearch[] = [];
    const mlFaceIds = new Set<string>();

    for (const face of asset.faces) {
      if (face.sourceType === SourceType.MACHINE_LEARNING) {
        mlFaceIds.add(face.id);
      }
    }

    const heightScale = imageHeight / (asset.faces[0]?.imageHeight || 1);
    const widthScale = imageWidth / (asset.faces[0]?.imageWidth || 1);
    for (const { boundingBox, embedding } of faces) {
      const scaledBox = {
        x1: boundingBox.x1 * widthScale,
        y1: boundingBox.y1 * heightScale,
        x2: boundingBox.x2 * widthScale,
        y2: boundingBox.y2 * heightScale,
      };
      const match = asset.faces.find((face) => this.iou(face, scaledBox) > 0.5);

      if (match && !mlFaceIds.delete(match.id)) {
        embeddings.push({ faceId: match.id, embedding });
      } else if (!match) {
        const faceId = this.cryptoRepository.randomUUID();
        facesToAdd.push({
          id: faceId,
          assetId: asset.id,
          imageHeight,
          imageWidth,
          boundingBoxX1: boundingBox.x1,
          boundingBoxY1: boundingBox.y1,
          boundingBoxX2: boundingBox.x2,
          boundingBoxY2: boundingBox.y2,
        });
        embeddings.push({ faceId, embedding });
      }
    }
    const faceIdsToRemove = [...mlFaceIds];

    if (facesToAdd.length > 0 || faceIdsToRemove.length > 0 || embeddings.length > 0) {
      await this.personRepository.refreshFaces(facesToAdd, faceIdsToRemove, embeddings);
    }

    if (faceIdsToRemove.length > 0) {
      this.logger.log(`Removed ${faceIdsToRemove.length} faces below detection threshold in asset ${id}`);
    }

    if (facesToAdd.length > 0) {
      this.logger.log(`Detected ${facesToAdd.length} new faces in asset ${id}`);
      const jobs = facesToAdd.map((face) => ({ name: JobName.FACIAL_RECOGNITION, data: { id: face.id } }) as const);
      await this.jobRepository.queueAll([{ name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } }, ...jobs]);
    } else if (embeddings.length > 0) {
      this.logger.log(`Added ${embeddings.length} face embeddings for asset ${id}`);
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, facesRecognizedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  private iou(
    face: { boundingBoxX1: number; boundingBoxY1: number; boundingBoxX2: number; boundingBoxY2: number },
    newBox: BoundingBox,
  ): number {
    const x1 = Math.max(face.boundingBoxX1, newBox.x1);
    const y1 = Math.max(face.boundingBoxY1, newBox.y1);
    const x2 = Math.min(face.boundingBoxX2, newBox.x2);
    const y2 = Math.min(face.boundingBoxY2, newBox.y2);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = (face.boundingBoxX2 - face.boundingBoxX1) * (face.boundingBoxY2 - face.boundingBoxY1);
    const area2 = (newBox.x2 - newBox.x1) * (newBox.y2 - newBox.y1);
    const union = area1 + area2 - intersection;

    return intersection / union;
  }

  @OnJob({ name: JobName.QUEUE_FACIAL_RECOGNITION, queue: QueueName.FACIAL_RECOGNITION })
  async handleQueueRecognizeFaces({ force, nightly }: JobOf<JobName.QUEUE_FACIAL_RECOGNITION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    await this.jobRepository.waitForQueueCompletion(QueueName.THUMBNAIL_GENERATION, QueueName.FACE_DETECTION);

    if (nightly) {
      const [state, latestFaceDate] = await Promise.all([
        this.systemMetadataRepository.get(SystemMetadataKey.FACIAL_RECOGNITION_STATE),
        this.personRepository.getLatestFaceDate(),
      ]);

      if (state?.lastRun && latestFaceDate && state.lastRun > latestFaceDate) {
        this.logger.debug('Skipping facial recognition nightly since no face has been added since the last run');
        return JobStatus.SKIPPED;
      }
    }

    const { waiting } = await this.jobRepository.getJobCounts(QueueName.FACIAL_RECOGNITION);

    if (force) {
      await this.personRepository.unassignFaces({ sourceType: SourceType.MACHINE_LEARNING });
      await this.handlePersonCleanup();
      await this.personRepository.vacuum({ reindexVectors: false });
    } else if (waiting) {
      this.logger.debug(
        `Skipping facial recognition queueing because ${waiting} job${waiting > 1 ? 's are' : ' is'} already queued`,
      );
      return JobStatus.SKIPPED;
    }

    await this.databaseRepository.prewarm(VectorIndex.FACE);

    const lastRun = new Date().toISOString();
    const facePagination = this.personRepository.getAllFaces(
      force ? undefined : { personId: null, sourceType: SourceType.MACHINE_LEARNING },
    );

    let jobs: { name: JobName.FACIAL_RECOGNITION; data: { id: string; deferred: false } }[] = [];
    for await (const face of facePagination) {
      jobs.push({ name: JobName.FACIAL_RECOGNITION, data: { id: face.id, deferred: false } });

      if (jobs.length === JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);

    await this.systemMetadataRepository.set(SystemMetadataKey.FACIAL_RECOGNITION_STATE, { lastRun });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.FACIAL_RECOGNITION, queue: QueueName.FACIAL_RECOGNITION })
  async handleRecognizeFaces({ id, deferred }: JobOf<JobName.FACIAL_RECOGNITION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const face = await this.personRepository.getFaceForFacialRecognitionJob(id);
    if (!face || !face.asset) {
      this.logger.warn(`Face ${id} not found`);
      return JobStatus.FAILED;
    }

    if (face.sourceType !== SourceType.MACHINE_LEARNING) {
      this.logger.warn(`Skipping face ${id} due to source ${face.sourceType}`);
      return JobStatus.SKIPPED;
    }

    if (!face.faceSearch?.embedding) {
      this.logger.warn(`Face ${id} does not have an embedding`);
      return JobStatus.FAILED;
    }

    if (face.personId) {
      this.logger.debug(`Face ${id} already has a person assigned`);
      return JobStatus.SKIPPED;
    }

    const matches = await this.searchRepository.searchFaces({
      userIds: [face.asset.ownerId],
      embedding: face.faceSearch.embedding,
      maxDistance: machineLearning.facialRecognition.maxDistance,
      numResults: machineLearning.facialRecognition.minFaces,
      minBirthDate: face.asset.fileCreatedAt ?? undefined,
    });

    // `matches` also includes the face itself
    if (machineLearning.facialRecognition.minFaces > 1 && matches.length <= 1) {
      this.logger.debug(`Face ${id} only matched the face itself, skipping`);
      return JobStatus.SKIPPED;
    }

    this.logger.debug(`Face ${id} has ${matches.length} matches`);

    const isCore =
      matches.length >= machineLearning.facialRecognition.minFaces &&
      face.asset.visibility === AssetVisibility.TIMELINE;
    if (!isCore && !deferred) {
      this.logger.debug(`Deferring non-core face ${id} for later processing`);
      await this.jobRepository.queue({ name: JobName.FACIAL_RECOGNITION, data: { id, deferred: true } });
      return JobStatus.SKIPPED;
    }

    let personId = matches.find((match) => match.personId)?.personId;
    if (!personId) {
      const matchWithPerson = await this.searchRepository.searchFaces({
        userIds: [face.asset.ownerId],
        embedding: face.faceSearch.embedding,
        maxDistance: machineLearning.facialRecognition.maxDistance,
        numResults: 1,
        hasPerson: true,
        minBirthDate: face.asset.fileCreatedAt ?? undefined,
      });

      if (matchWithPerson.length > 0) {
        personId = matchWithPerson[0].personId;
      }
    }

    if (isCore && !personId) {
      this.logger.log(`Creating new person for face ${id}`);
      const newPerson = await this.personRepository.create({ ownerId: face.asset.ownerId, faceAssetId: face.id });
      await this.jobRepository.queue({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: newPerson.id } });
      personId = newPerson.id;
    }

    if (personId) {
      this.logger.debug(`Assigning face ${id} to person ${personId}`);
      await this.personRepository.reassignFaces({ faceIds: [id], newPersonId: personId });
    }

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.MIGRATE_PERSON, queue: QueueName.MIGRATION })
  async handlePersonMigration({ id }: JobOf<JobName.MIGRATE_PERSON>): Promise<JobStatus> {
    const person = await this.personRepository.getById(id);
    if (!person) {
      return JobStatus.FAILED;
    }

    await this.storageCore.movePersonFile(person, PersonPathType.FACE);

    return JobStatus.SUCCESS;
  }

  async mergePerson(auth: AuthDto, id: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    if (mergeIds.includes(id)) {
      throw new BadRequestException('Cannot merge a person into themselves');
    }

    await this.requireAccess({ auth, permission: Permission.PERSON_UPDATE, ids: [id] });
    let primaryPerson = await this.findOrFail(id);
    const primaryName = primaryPerson.name || primaryPerson.id;

    const results: BulkIdResponseDto[] = [];

    const allowedIds = await this.checkAccess({
      auth,
      permission: Permission.PERSON_MERGE,
      ids: mergeIds,
    });

    for (const mergeId of mergeIds) {
      const hasAccess = allowedIds.has(mergeId);
      if (!hasAccess) {
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      try {
        const mergePerson = await this.personRepository.getById(mergeId);
        if (!mergePerson) {
          results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NOT_FOUND });
          continue;
        }

        const update: Updateable<Person> & { id: string } = { id: primaryPerson.id };
        if (!primaryPerson.name && mergePerson.name) {
          update.name = mergePerson.name;
        }

        if (!primaryPerson.birthDate && mergePerson.birthDate) {
          update.birthDate = mergePerson.birthDate;
        }
        if (!primaryPerson.age) {
          update.age = mergePerson.age;
        }

        if (!primaryPerson.description || primaryPerson.description.trim() === "") {
          update.description = mergePerson.description?.trim();
        }
        else if (!mergePerson.description) {
          if (!primaryPerson.description.includes(mergePerson.description ?? '')) {
            update.description = primaryPerson.description + ' ' + mergePerson.description;
          }
          else {
            update.description = primaryPerson.description;
          }
        }

        if (!primaryPerson.thumbnailPath || primaryPerson.thumbnailPath.trim() === "") {
          update.thumbnailPath = mergePerson.thumbnailPath;
          mergePerson.thumbnailPath = '';
        }
        if (!primaryPerson.country || primaryPerson.country.trim() === "") {
          update.country = mergePerson.country?.trim();
        }
        if (!primaryPerson.city || primaryPerson.city.trim() === "") {
          update.city = mergePerson.city?.trim();
        }
        if (!primaryPerson.height || primaryPerson.height === 0) {
          update.height = mergePerson.height;
        }


        if (Object.keys(update).length > 0) {
          primaryPerson = await this.personRepository.update(update);
        }

        const mergeName = mergePerson.name || mergePerson.id;
        const mergeData: UpdateFacesData = { oldPersonId: mergeId, newPersonId: id };
        this.logger.log(`Merging ${mergeName} into ${primaryName}`);

        await this.personRepository.reassignFaces(mergeData);
        //reassignRelationships
        await this.personRelationshipRepository.reassignRelationships(primaryPerson.id, mergePerson.id);
        //reassingSocialMedia
        await this.socialMediaRepository.reassignSocialMedia(primaryPerson.id, mergePerson.id);
        //reassignPersonSidecar
        await this.personRepository.reassignPersonSidecar(primaryPerson.id, mergePerson.id);
        await this.delete([mergePerson]);

        this.logger.log(`Merged ${mergeName} into ${primaryName}`);
        results.push({ id: mergeId, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to merge ${mergeId} into ${id}: ${error}`, error?.stack);
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
  }

  private async findOrFail(id: string) {
    const person = await this.personRepository.getById(id);
    if (!person) {
      throw new BadRequestException('Person not found');
    }
    return person;
  }

  // TODO return a asset face response
  async createFace(auth: AuthDto, dto: AssetFaceCreateDto): Promise<void> {
    await Promise.all([
      this.requireAccess({ auth, permission: Permission.ASSET_READ, ids: [dto.assetId] }),
      this.requireAccess({ auth, permission: Permission.PERSON_READ, ids: [dto.personId] }),
    ]);

    await this.personRepository.createAssetFace({
      personId: dto.personId,
      assetId: dto.assetId,
      imageHeight: dto.imageHeight,
      imageWidth: dto.imageWidth,
      boundingBoxX1: dto.x,
      boundingBoxX2: dto.x + dto.width,
      boundingBoxY1: dto.y,
      boundingBoxY2: dto.y + dto.height,
      sourceType: SourceType.MANUAL,
    });
  }

  async deleteFace(auth: AuthDto, id: string, dto: AssetFaceDeleteDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.FACE_DELETE, ids: [id] });

    return dto.force ? this.personRepository.deleteAssetFace(id) : this.personRepository.softDeleteAssetFaces(id);
  }

  @OnJob({ name: JobName.PERSON_SIDECAR_WRITE, queue: QueueName.PERSON_SIDECAR })
  async handleSidecarWrite(job: JobOf<JobName.PERSON_SIDECAR_WRITE>): Promise<JobStatus> {
    const { directoryId } = job;
    this.logger.verbose(`Processing PERSON_SIDECAR_WRITE job for personId: ${directoryId}`);

    if (!directoryId) {
      this.logger.error(`No directoryId provided for PERSON_SIDECAR_WRITE job.`);
      return JobStatus.FAILED;
    }

    try {
      //fetch personId by directoryId

      const personId = this.personRepository.getPersonIdByDirectoryId(directoryId);

      // Fetch people data
      if (!personId) {
        this.logger.error(`No personId found for directoryId: ${directoryId}`);
        return JobStatus.FAILED;
      }

      job.personId = personId;

      const peopleMap = await this.personRepository.getPeopleByName(personId);

      if (!peopleMap || peopleMap.size === 0) {
        this.logger.error(`No people data found for personId: ${personId}`);
        return JobStatus.FAILED;
      }

      // Extract file path from the "main" key
      const mainPerson = peopleMap.get('main')?.[0];
      const filePath = mainPerson?.filePath ?? '';

      if (!filePath) {
        this.logger.error(`File path missing for personId: ${personId}. Aborting job.`);
        return JobStatus.FAILED;
      }

      if (!mainPerson) {
        this.logger.error(`Main person not found in people map for personId: ${personId}`);
        return JobStatus.FAILED;
      }

      // Check if the main person has a valid userId and hashId

      const existingSocialMedia = await this.socialMediaRepository.findByUserIdOrHash(mainPerson.userId, mainPerson.hashId);
      let mainPersonId = '';

      if (!existingSocialMedia) {
        this.logger.error(`Main person social media not found for userId=${mainPerson.userId}, hashId=${mainPerson.hashId}`);
        return JobStatus.FAILED;
      }
      let ownerId = '';
      if (existingSocialMedia.personId) {
        this.logger.warn(`Main person social media already has a personId ${existingSocialMedia.personId}`);
        mainPersonId = existingSocialMedia.personId;
        ownerId = existingSocialMedia.ownerId;
      }
      if (!mainPersonId) {

        const personEntity = await this.getPerson(
          mainPersonId,
          mainPerson.name ?? '',
          mainPerson.ownerId,
          mainPerson.description ?? '',
        );
        this.logger.verbose(`Person entity: ${JSON.stringify(personEntity)}`);
        if (!personEntity) {
          this.logger.error(`Main person entity not found for personId: ${mainPersonId}`);
          return JobStatus.FAILED;
        }

        mainPersonId = String(personEntity.id);
        ownerId = String(personEntity.ownerId);
      }
      this.logger.verbose(`Main personId: ${mainPersonId}`);

      // Ensure the directory exists
      const directoryPath = path.dirname(filePath);
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      const finalFilePath = path.join(directoryPath, 'PersonData.json');

      // Read existing data if file exists
      let existingData: Map<string, SidecarPerson[]> = new Map();

      if (fs.existsSync(finalFilePath)) {
        try {
          const parsedData = JSON.parse(fs.readFileSync(finalFilePath, 'utf8'));
          existingData = new Map(Object.entries(parsedData));
        } catch (error) {
          this.logger.error(`Failed to read or parse existing PersonData.json at ${finalFilePath}:`, error);
          return JobStatus.FAILED;
        }
      }

      
      this.logger.verbose(`OwnerId: ${ownerId}`);
      for (const [key, personList] of peopleMap.entries()) {
        let category = key;
        if (!['main', 'owner', 'social_media'].includes(category)) {
          category = 'related';
        }

        const existingList = existingData.get(category) ?? [];

        for (const newPerson of personList) {
          const existingPerson = existingList.find(p => p.userId === newPerson.userId);

          if (!existingPerson) {
            if (category === 'main') {
              newPerson.id = mainPersonId;
              this.logger.verbose(`Main personId: ${mainPersonId} with ownerId: ${ownerId} changed from ${newPerson.ownerId}`);
              newPerson.ownerId = ownerId;
            }
            existingList.push(newPerson);
          } else {
            existingPerson.ownerId = ownerId;
            if (newPerson.relationType && !existingPerson.relationType?.includes(newPerson.relationType)) {
              existingPerson.relationType = existingPerson.relationType
                ? `${existingPerson.relationType}, ${newPerson.relationType}`
                : newPerson.relationType;
            }
          }
          
        }

        existingData.set(category, existingList);
      }
      // Write the merged data to the file
      const jsonData = Object.fromEntries(existingData);
      fs.writeFileSync(finalFilePath, JSON.stringify(jsonData, null, 2));

      this.logger.verbose(`PersonData.json updated successfully for personId: ${personId} at ${finalFilePath} (mainPersonId: ${mainPersonId})`);

      // Update the database entry with the last modified date
      const lastModified = new Date(fs.statSync(finalFilePath).mtime);

      const sidecarModified = await this.personRepository.addOrUpdatePersonSidecar(
        mainPersonId,
        finalFilePath,
        null,
        lastModified,
        ownerId,
      );
      job.personId = mainPersonId
      this.logger.verbose(`Sidecar update result: ${JSON.stringify(sidecarModified)}`);
    } catch (error) {
      this.logger.error(`Error processing PERSON_SIDECAR_WRITE job for personId ${job.personId}:`, error);
      return JobStatus.FAILED;
    }

    return JobStatus.SUCCESS;
  }


  private async updateSidecar(sidecar: Map<string, SidecarPerson[]>, filePath: string): Promise<boolean> {
    try {
      // Read and parse the existing file, which is a grouped object
      const existingDataRaw = fs.readFileSync(filePath, 'utf8');
      const existingData: Record<string, SidecarPerson[]> = JSON.parse(existingDataRaw);

      // Merge updates from the new sidecar Map
      for (const [group, people] of sidecar.entries()) {
        if (!existingData[group]) {
          existingData[group] = [];
        }

        for (const newPerson of people) {
          const existingPerson = existingData[group].find(p => p.userId === newPerson.userId);

          if (!existingPerson) {
            existingData[group].push(newPerson);
          } else {
            if (!existingPerson.id && newPerson.id) {
              existingPerson.id = newPerson.id;
            }
            if (!existingPerson.name && newPerson.name) {
              existingPerson.name = newPerson.name;
            }
            if (!existingPerson.description && newPerson.description) {
              existingPerson.description = newPerson.description;
            }
          }
        }
      }

      // Write back grouped data
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
      this.logger.verbose(`Sidecar file updated successfully at ${filePath}`);


      return true;
    } catch (error) {
      this.logger.error(`Error updating sidecar file at ${filePath}:`, error);
      return false;
    }
  }

  private async getPerson(id: string, name: string, ownerId: string, description: string): Promise<PersonResponseDto> {


    const person = id ? await this.personRepository.getById(id) : null;
    if (!person) {
      const newperson = {
      name,
      ownerId,
      description,
      isFavorite: false,
      isHidden: false,
      age: null,
      birthDate: null,
      color: null,
      faceAssetId: null,
      thumbnailPath: '',
      }
      return mapPersonDb(await this.personRepository.create(newperson));
    }
    else {
      return mapPersonDb(person)
    }
  }


  private async processSidecar(id: string, force: boolean): Promise<JobStatus> {
    this.logger.verbose(`Processing sidecar for person ${id}`);
    const sidecar = await this.personRepository.getPersonSidecarByPersonId(id);

    this.logger.verbose(`Sidecar data: ${JSON.stringify(sidecar)}`);
    if (!sidecar || sidecar.length === 0) {
      this.logger.error(`Sidecar not found for person ${id}`);
      return JobStatus.FAILED;
    }

    const filePath = sidecar[0].sidecarPath;
    if (!filePath) {
      this.logger.error(`File path missing for sidecar ${id}. Aborting job.`);
      return JobStatus.FAILED;
    }

    if (!force && sidecar[0].lastProcessedAt && sidecar[0].lastProcessedAt > sidecar[0].updatedAt) {
      this.logger.verbose(`Sidecar ${id} has already been processed and is up to date. Skipping.`);
      return JobStatus.SKIPPED;
    }

    let sidecarData: Map<string, SidecarPerson[]> = new Map();

    this.logger.verbose(`Processing sidecar file: ${filePath}`);

    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      sidecarData = new Map(Object.entries(parsed));
    } catch (error) {
      this.logger.error(`Failed to read or parse sidecar file ${filePath}:`, error);
      return JobStatus.FAILED;
    }

    if (!sidecarData || sidecarData.size === 0) {
      this.logger.error(`No data found in sidecar file ${filePath}`);
      return JobStatus.FAILED;
    }

    this.logger.verbose(`Processing sidecar data for ${sidecarData.size} groups`);

    let mainPersonId: string;
    const relations = new Map<string, RelationshipType>();

    const mainPerson = sidecarData.get('main')?.[0];
    if (!mainPerson) {
      this.logger.error(`Main person not found in sidecar data`);
      return JobStatus.FAILED;
    }

    const existingSocialMedia = await this.socialMediaRepository.findByUserIdOrHash(mainPerson.userId, mainPerson.hashId);

    if (existingSocialMedia === undefined || existingSocialMedia === null) {
      this.logger.error(`Main person social media not found for userId=${mainPerson.userId}, hashId=${mainPerson.hashId}`);
      return JobStatus.FAILED;
    } else {
      if (existingSocialMedia.personId) {
        this.logger.warn(`Main person social media already has a personId ${existingSocialMedia.personId}`);
      }
    }

    mainPersonId = existingSocialMedia.personId ?? '';
    const personEntity = await this.getPerson(mainPersonId ?? '', mainPerson.name ?? '', sidecar[0].ownerId, mainPerson.description ?? '');

    if (!personEntity) {
      this.logger.error(`Main person entity not found`);
      return JobStatus.FAILED;
    }

    existingSocialMedia.personId = String(personEntity.id);
    await this.socialMediaRepository.update(existingSocialMedia);

    

    mainPersonId =String( personEntity.id);
    mainPerson.id = mainPersonId;
    sidecarData.set('main', [mainPerson]);

    const ownerPerson = sidecarData.get('owner')?.[0];
    if (ownerPerson) {
      const existingOwnerSocialMedia = await this.socialMediaRepository.findByUserIdOrHash(ownerPerson.userId, ownerPerson.hashId);
      if (existingOwnerSocialMedia) {
        const ownerPersonEntity = await this.getPerson(ownerPerson.id ?? existingOwnerSocialMedia.personId, ownerPerson.name ?? '', sidecar[0].ownerId, ownerPerson.description ?? '');
        if (!ownerPersonEntity) {
          this.logger.error(`Owner person entity not found`);
          return JobStatus.FAILED;
        }
        existingOwnerSocialMedia.personId = String(ownerPersonEntity.id);
        await this.socialMediaRepository.update(existingOwnerSocialMedia);
        ownerPerson.id = String(ownerPersonEntity.id);
        sidecarData.set('owner', [ownerPerson]);
        relations.set(String(ownerPersonEntity.id), RelationshipType.FRIEND);
      }
    }

    const relatedPeople: SidecarPerson[] = [];
    const isEmpty = (val?: string | null) => val === null || val === undefined || val === '';

    for (const person of sidecarData.get('related') ?? []) {
      const existingSocialMedia = await this.socialMediaRepository.findByUserIdOrHash(person.userId, person.hashId);
      if (!existingSocialMedia) continue;

      const personEntityName = isEmpty(person.name)
        ? [person.platform, person.hashId, person.userId].filter(Boolean).join('_').toLowerCase()
        : person.name;

      const relatedPersonEntity = await this.getPerson(
        existingSocialMedia.personId ?? '',
        personEntityName ?? '',
        sidecar[0].ownerId,
        person.description ?? '',
      );

      existingSocialMedia.personId = String(relatedPersonEntity.id);
      await this.socialMediaRepository.update(existingSocialMedia);

      person.id = String(relatedPersonEntity.id);
      relatedPeople.push(person);

      let relationType = RelationshipType.ACQUAINTANCE;
      if (
        person.relationType?.includes('tagged') ||
        person.relationType?.includes('coauthor') ||
        person.relationType?.includes('mentions') ||
        person.relationType?.includes('owner')
      ) {
        relationType = RelationshipType.FRIEND;
      }
      relations.set(String(relatedPersonEntity.id), relationType);
    }

    if (relatedPeople.length > 0) {
      sidecarData.set('related', relatedPeople);
    }

    const socialMediaList = sidecarData.get('social_media') ?? [];

    const updatedSocialMediaList: SidecarPerson[] = [];

    for (const socialMedia of socialMediaList) {
      let existingSocialMedia = await this.socialMediaRepository.findByUserIdOrHash(socialMedia.userId, socialMedia.hashId);
      if (!existingSocialMedia)
        existingSocialMedia = await this.socialMediaRepository.findbyName(socialMedia.name ?? '');

      if (!existingSocialMedia) continue;

      existingSocialMedia.personId = mainPersonId;
      await this.socialMediaRepository.update(existingSocialMedia);

      socialMedia.id = mainPersonId;
      updatedSocialMediaList.push(socialMedia);
    }

    if (updatedSocialMediaList.length > 0) {
      sidecarData.set('social_media', updatedSocialMediaList);
    }

    for (const [relatedPersonId, relationType] of relations) {
      if (mainPersonId === relatedPersonId) continue;
      await this.personRelationshipRepository.createRelationship(mainPersonId, relatedPersonId, relationType);
    }
    this.logger.verbose(`Sidecar data processed successfully for personId: ${id}`);
    await this.updateSidecar(sidecarData, filePath);
    await this.personRepository.addOrUpdatePersonSidecar(
      mainPersonId,
      filePath,
      new Date(),
      null,
      mainPerson.ownerId,
    );

    return JobStatus.SUCCESS;
  }






  @OnJob({ name: JobName.PERSON_SIDECAR_SYNC, queue: QueueName.PERSON_SIDECAR })
  async handleSidecarSync({ personId }: JobOf<JobName.PERSON_SIDECAR_SYNC>): Promise<JobStatus> {
    return this.processSidecar(String(personId), false);

  }

  @OnJob({ name: JobName.PERSON_SIDECAR_DISCOVERY, queue: QueueName.PERSON_SIDECAR })
  async handleSidecarDiscovery({ personId }: JobOf<JobName.PERSON_SIDECAR_DISCOVERY>): Promise<JobStatus> {
    return this.processSidecar(String(personId), true);
  }




}
