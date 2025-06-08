import { BadRequestException, Injectable } from '@nestjs/common';
import { ColumnType, Insertable } from 'kysely';
import { R_OK } from 'node:constants';
import { Stats } from 'node:fs';
import path, { basename, isAbsolute, parse } from 'node:path';
import picomatch from 'picomatch';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { Assets } from 'src/db';
import { OnEvent, OnJob } from 'src/decorators';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  mapLibrary,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryImportPathResponseDto,
  ValidateLibraryResponseDto,
} from 'src/dtos/library.dto';
import { AlbumUserRole, AssetStatus, AssetType, DatabaseLock, DirectoryStatus, ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { AssetSyncResult } from 'src/repositories/library.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { mimeTypes } from 'src/utils/mime-types';
import { handlePromiseError } from 'src/utils/misc';

@Injectable()
export class LibraryService extends BaseService {
  private watchLibraries = false;
  private lock = false;
  private watchers: Record<string, () => Promise<void>> = {};

  @OnEvent({ name: 'config.init', workers: [ImmichWorker.MICROSERVICES] })
  async onConfigInit({
    newConfig: {
      library: { watch, scan },
    },
  }: ArgOf<'config.init'>) {
    // This ensures that library watching only occurs in one microservice
    this.lock = await this.databaseRepository.tryLock(DatabaseLock.Library);

    this.watchLibraries = this.lock && watch.enabled;

    if (this.lock) {
      this.cronRepository.create({
        name: 'libraryScan',
        expression: scan.cronExpression,
        onTick: () =>
          handlePromiseError(this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL }), this.logger),
        start: scan.enabled,
      });
    }

    if (this.watchLibraries) {
      await this.watchAll();
    }
  }

  @OnEvent({ name: 'config.update', server: true })
  async onConfigUpdate({ newConfig: { library } }: ArgOf<'config.update'>) {
    if (!this.lock) {
      return;
    }

    this.cronRepository.update({
      name: 'libraryScan',
      expression: library.scan.cronExpression,
      start: library.scan.enabled,
    });

    if (library.watch.enabled !== this.watchLibraries) {
      // Watch configuration changed, update accordingly
      this.watchLibraries = library.watch.enabled;
      await (this.watchLibraries ? this.watchAll() : this.unwatchAll());
    }
  }

  private async watch(id: string): Promise<boolean> {
    if (!this.watchLibraries) {
      return false;
    }

    const library = await this.findOrFail(id);
    if (library.importPaths.length === 0) {
      return false;
    }

    await this.unwatch(id);

    this.logger.log(`Starting to watch library ${library.id} with import path(s) ${library.importPaths}`);

    const matcher = picomatch(`**/*{${mimeTypes.getSupportedFileExtensions().join(',')}}`, {
      nocase: true,
      ignore: library.exclusionPatterns,
    });

    let _resolve: () => void;
    const ready$ = new Promise<void>((resolve) => (_resolve = resolve));

    const handler = async (event: string, path: string) => {
      if (matcher(path)) {
        this.logger.debug(`File ${event} event received for ${path} in library ${library.id}}`);
        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_FILES,
          data: { libraryId: library.id, paths: [path] },
        });
      } else {
        this.logger.verbose(`Ignoring file ${event} event for ${path} in library ${library.id}`);
      }
    };

    const deletionHandler = async (path: string) => {
      this.logger.debug(`File unlink event received for ${path} in library ${library.id}}`);
      await this.jobRepository.queue({
        name: JobName.LIBRARY_ASSET_REMOVAL,
        data: { libraryId: library.id, paths: [path] },
      });
    };

    this.watchers[id] = this.storageRepository.watch(
      library.importPaths,
      {
        usePolling: false,
        ignoreInitial: true,
      },
      {
        onReady: () => _resolve(),
        onAdd: (path) => {
          return handlePromiseError(handler('add', path), this.logger);
        },
        onChange: (path) => {
          return handlePromiseError(handler('change', path), this.logger);
        },
        onUnlink: (path) => {
          return handlePromiseError(deletionHandler(path), this.logger);
        },
        onError: (error) => {
          this.logger.error(`Library watcher for library ${library.id} encountered error: ${error}`);
        },
      },
    );

    // Wait for the watcher to initialize before returning
    await ready$;

    return true;
  }

  async unwatch(id: string) {
    if (this.watchers[id]) {
      await this.watchers[id]();
      delete this.watchers[id];
    }
  }

  @OnEvent({ name: 'app.shutdown' })
  async onShutdown() {
    await this.unwatchAll();
  }

  private async unwatchAll() {
    if (!this.lock) {
      return false;
    }

    for (const id in this.watchers) {
      await this.unwatch(id);
    }
  }

  async watchAll() {
    if (!this.lock) {
      return false;
    }

    const libraries = await this.libraryRepository.getAll(false);
    for (const library of libraries) {
      await this.watch(library.id);
    }
  }

  async getStatistics(id: string): Promise<LibraryStatsResponseDto> {
    const statistics = await this.libraryRepository.getStatistics(id);
    if (!statistics) {
      throw new BadRequestException(`Library ${id} not found`);
    }
    return statistics;
  }

  async get(id: string): Promise<LibraryResponseDto> {
    const library = await this.findOrFail(id);
    return mapLibrary(library);
  }

  async getAll(): Promise<LibraryResponseDto[]> {
    const libraries = await this.libraryRepository.getAll(false);
    return libraries.map((library) => mapLibrary(library));
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_CLEANUP, queue: QueueName.LIBRARY })
  async handleQueueCleanup(): Promise<JobStatus> {
    this.logger.log('Checking for any libraries pending deletion...');
    const pendingDeletions = await this.libraryRepository.getAllDeleted();
    if (pendingDeletions.length > 0) {
      const libraryString = pendingDeletions.length === 1 ? 'library' : 'libraries';
      this.logger.log(`Found ${pendingDeletions.length} ${libraryString} pending deletion, cleaning up...`);

      await this.jobRepository.queueAll(
        pendingDeletions.map((libraryToDelete) => ({ name: JobName.LIBRARY_DELETE, data: { id: libraryToDelete.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async create(dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    const library = await this.libraryRepository.create({
      ownerId: dto.ownerId,
      name: dto.name ?? 'New External Library',
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? ['**/@eaDir/**', '**/._*', '**/#recycle/**', '**/#snapshot/**'],
    });
    return mapLibrary(library);
  }



  @OnJob({ name: JobName.LIBRARY_SYNC_DIRECTORIES, queue: QueueName.LIBRARY })
  async handleSyncDirectories(job: JobOf<JobName.LIBRARY_SYNC_DIRECTORIES>): Promise<JobStatus> {

    const library = await this.libraryRepository.get(job.libraryId);
    // We need to check if the library still exists as it could have been deleted after the scan was queued
    if (!library) {
      this.logger.debug(`Library ${job.libraryId} not found, skipping file import`);
      return JobStatus.FAILED;
    } else if (library.deletedAt) {
      this.logger.debug(`Library ${job.libraryId} is deleted, won't import assets into it`);
      return JobStatus.FAILED;
    }

    const directoryImports = job.directories.map((directoryPath) => this.processDirectoryEntity(directoryPath, library.ownerId, job.libraryId));

    const directoryIds: string[] = [];

    for (let i = 0; i < directoryImports.length; i += 5000) {
      // Chunk the imports to avoid the postgres limit of max parameters at once
      const chunk = directoryImports.slice(i, i + 5000);
      await this.directoryRepository.createAll(chunk).then((directories) => directoryIds.push(...directories.map((directory) => directory.id)));
     
    }


    if (job.force) {
      const existingDirectories = await this.directoryRepository.getByPaths(job.directories, library.id);

      const newDirectoryIds = existingDirectories
        .map((directory) => directory.id)
        .filter((id) => !directoryIds.includes(String(id)));

      directoryIds.push(...newDirectoryIds.filter((id): id is ColumnType<string, string | undefined, string> => id !== undefined).map(String));
    }

    const progressMessage =
      job.progressCounter && job.totalDirectories
        ? `(${job.progressCounter} of ${job.totalDirectories})`
        : `(${job.progressCounter} done so far)`;

    this.logger.verbose(`Imported ${directoryIds.length} ${progressMessage} directory(ies) into library ${job.libraryId}`);
    await this.jobRepository.queueAll(
      directoryIds.map((directory) => ({
        name: JobName.LIBRARY_QUEUE_SYNC_FILES,
        data: {
          id: directory,
          force: job.force,
        },
      })),
    );
    await this.jobRepository.queueAll(
      directoryIds.map((directory) => ({
        name: JobName.LIBRARY_QUEUE_SYNC_ASSETS,
        data: {
          id: directory,
          force: job.force,
        },
      })),
    );

    return JobStatus.SUCCESS;
  }

  private async validateImportPath(importPath: string): Promise<ValidateLibraryImportPathResponseDto> {
    const validation = new ValidateLibraryImportPathResponseDto();
    validation.importPath = importPath;

    if (StorageCore.isImmichPath(importPath)) {
      validation.message = 'Cannot use media upload folder for external libraries';
      return validation;
    }

    if (!isAbsolute(importPath)) {
      validation.message = `Import path must be absolute, try ${path.resolve(importPath)}`;
      return validation;
    }

    try {
      const stat = await this.storageRepository.stat(importPath);
      if (!stat.isDirectory()) {
        validation.message = 'Not a directory';
        return validation;
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        validation.message = 'Path does not exist (ENOENT)';
        return validation;
      }
      validation.message = String(error);
      return validation;
    }

    const access = await this.storageRepository.checkFileExists(importPath, R_OK);

    if (!access) {
      validation.message = 'Lacking read permission for folder';
      return validation;
    }

    validation.isValid = true;
    return validation;
  }

  async validate(id: string, dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    const importPaths = await Promise.all(
      (dto.importPaths || []).map((importPath) => this.validateImportPath(importPath)),
    );
    return { importPaths };
  }

  async update(id: string, dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    await this.findOrFail(id);

    if (dto.importPaths) {
      const validation = await this.validate(id, { importPaths: dto.importPaths });
      if (validation.importPaths) {
        for (const path of validation.importPaths) {
          if (!path.isValid) {
            throw new BadRequestException(`Invalid import path: ${path.message}`);
          }
        }
      }
    }

    const library = await this.libraryRepository.update(id, dto);
    return mapLibrary(library);
  }

  async delete(id: string) {
    await this.findOrFail(id);

    if (this.watchLibraries) {
      await this.unwatch(id);
    }

    await this.libraryRepository.softDelete(id);
    await this.jobRepository.queue({ name: JobName.LIBRARY_DELETE, data: { id } });
  }

  @OnJob({ name: JobName.LIBRARY_DELETE, queue: QueueName.LIBRARY })
  async handleDeleteLibrary(job: JobOf<JobName.LIBRARY_DELETE>): Promise<JobStatus> {
    const libraryId = job.id;

    await this.assetRepository.updateByLibraryId(libraryId, { deletedAt: new Date() });

    let assetsFound = false;
    let chunk: string[] = [];

    const queueChunk = async () => {
      if (chunk.length > 0) {
        assetsFound = true;
        this.logger.debug(`Queueing deletion of ${chunk.length} asset(s) in library ${libraryId}`);
        await this.jobRepository.queueAll(
          chunk.map((id) => ({ name: JobName.ASSET_DELETION, data: { id, deleteOnDisk: false } })),
        );
        chunk = [];
      }
    };

    this.logger.debug(`Will delete all assets in library ${libraryId}`);
    const assets = this.libraryRepository.streamAssetIds(libraryId);
    for await (const asset of assets) {
      chunk.push(asset.id);

      if (chunk.length >= JOBS_LIBRARY_PAGINATION_SIZE) {
        await queueChunk();
      }
    }

    await queueChunk();

    if (!assetsFound) {
      this.logger.log(`Deleting library ${libraryId}`);
      await this.libraryRepository.delete(libraryId);
    }

    return JobStatus.SUCCESS;
  }

  private async processEntity(filePath: string, ownerId: string, libraryId: string, directoryId: string) {
    const assetPath = path.normalize(filePath);
    const stat = await this.storageRepository.stat(assetPath);
    return {
      ownerId,
      libraryId,
      directoryId,
      checksum: this.cryptoRepository.hashSha1(`path:${assetPath}`),
      originalPath: assetPath,

      fileCreatedAt: stat.mtime,
      fileModifiedAt: stat.mtime,
      localDateTime: stat.mtime,
      // TODO: device asset id is deprecated, remove it
      deviceAssetId: `${basename(assetPath)}`.replaceAll(/\s+/g, ''),
      deviceId: 'Library Import',
      type: mimeTypes.isVideo(assetPath) ? AssetType.VIDEO : AssetType.IMAGE,
      originalFileName: parse(assetPath).base,
      isExternal: true,
      livePhotoVideoId: null,
    };
  }

  private processDirectoryEntity(directoryPath: string, ownerId: string, libraryId: string) {
    const normalizedPath = path.normalize(directoryPath);

    return {
      ownerId,
      libraryId,
      path: normalizedPath,
      createdAt: new Date(),
      updatedAt: new Date(),
      isOffline: false,
      isHidden: false,
      deletedAt: null,
      status: 'added' as DirectoryStatus,
      albumId: null,
    };
  }

  async queuePostSyncJobs(assetIds: string[], directoryId: string) {
    this.logger.verbose(`Queuing sidecar discovery for ${assetIds.length} asset(s) for directory ${directoryId}`);
    //Set or increment the pending counter in Redis
    await this.jobRepository.setPendingSidecarCount(directoryId, assetIds.length);

    // We queue a sidecar discovery which, in turn, queues metadata extraction
    await this.jobRepository.queueAll(
      assetIds.map((assetId) => ({
        name: JobName.SIDECAR_DISCOVERY,
        data: { id: assetId, source: 'upload', directoryId },
      })),
    );
  }

  async queueScan(id: string, force = false) {
    await this.findOrFail(id);

    this.logger.log(`Starting to scan library ${id}`);

    await this.jobRepository.queue({
      name: JobName.LIBRARY_QUEUE_SYNC_DIRECTORIES,
      data: {
        id,
        force,
      },
    });

  }

  async queueScanAll() {
    this.logger.log(`Starting to scan all libraries`);
    //await this.jobRepository.restartWorkers();
    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, data: {} });
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, queue: QueueName.LIBRARY })
  async handleQueueScanAll(job: JobOf<JobName.LIBRARY_QUEUE_SCAN_ALL>): Promise<JobStatus> {
    this.logger.log(`Initiating scan of all external libraries...`);

    const force = job?.force || false;

    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_CLEANUP, data: {} });

    const libraries = await this.libraryRepository.getAll(true);


    await Promise.all(libraries.map((library) => this.queueScan(library.id, force)));
    this.logger.log(`Queued ${libraries.length} library(s) for scan`);

    return JobStatus.SUCCESS;
  }



  private checkExistingAsset(asset: {
    isOffline: boolean;
    libraryId: string | null;
    originalPath: string;
    status: AssetStatus;
    fileModifiedAt: Date;
  },
    stat: Stats | null,): AssetSyncResult {
    if (!stat) {
      // File not found on disk or permission error
      if (asset.isOffline) {
        this.logger.verbose(
          `Asset ${asset.originalPath} is still not accessible, keeping offline in library ${asset.libraryId}`,
        );
        return AssetSyncResult.DO_NOTHING;
      }

      this.logger.debug(
        `Asset ${asset.originalPath} is no longer on disk or is inaccessible because of permissions, marking offline in library ${asset.libraryId}`,
      );
      return AssetSyncResult.OFFLINE;
    }

    if (asset.isOffline && asset.status !== AssetStatus.DELETED) {
      // Only perform the expensive check if the asset is offline
      return AssetSyncResult.CHECK_OFFLINE;
    }

    if (stat.mtime.valueOf() !== asset.fileModifiedAt.valueOf()) {
      this.logger.verbose(`Asset ${asset.originalPath} needs metadata extraction in library ${asset.libraryId}`);

      return AssetSyncResult.UPDATE;
    }

    return AssetSyncResult.DO_NOTHING;
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SYNC_FILES, queue: QueueName.LIBRARY })
  async handleQueueSyncFiles(job: JobOf<JobName.LIBRARY_QUEUE_SYNC_FILES>): Promise<JobStatus> {
    const directory = await this.directoryRepository.get(job.id);

    if (!directory) {
      this.logger.debug(`Library ${job.id} not found, skipping refresh`);
      return JobStatus.SKIPPED;
    }

    const library = await this.libraryRepository.get(String(directory.libraryId));
    if (!library) {
      this.logger.debug(`Library ${directory.libraryId} not found, skipping refresh`);
      return JobStatus.SKIPPED;
    }

    this.logger.verbose(`Validating import paths for directory ${directory.id} directorypath ${directory.path}...`);

    const validImportPaths: string[] = [];


    const validation = await this.validateImportPath(directory.path);
    if (validation.isValid) {
      validImportPaths.push(path.normalize(directory.path));
    } else {
      this.logger.warn(`Skipping invalid import path: ${directory.path}. Reason: ${validation.message}`);
    }


    if (validImportPaths.length === 0) {
      this.logger.warn(`No valid import paths found for directory ${directory.id}`);

      return JobStatus.SKIPPED;
    }

    const filesOnDisk = this.storageRepository.walk({
      pathsToCrawl: validImportPaths,
      includeHidden: false,
      exclusionPatterns: library.exclusionPatterns,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
      typeFilter: 'files',
      deepth: 1,
    });

    let importCount = 0;
    let crawlCount = 0;

    this.logger.verbose(`Starting disk crawl of ${validImportPaths.length} import path(s) for directory ${directory.id}...`);

    for await (const pathBatch of filesOnDisk) {
      crawlCount += pathBatch.length;
      const paths = await this.assetRepository.filterNewExternalAssetPathsByDirectory(String(directory.id), pathBatch);

      if (job.force) {
        const existingAssets = await this.assetRepository.getbyLibraryIdAndDirectoryId(library.id, String(directory.id));
        const newAssetPaths = existingAssets
          .map((asset) => asset.originalPath)
          .filter((path) => !paths.includes(path));
        paths.push(...newAssetPaths);
      }

      if (paths.length > 0) {

        importCount += paths.length;

        this.logger.verbose(`Found ${paths.length} new file(s) in directory ${directory.id} and library ${library.id}`);
        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_FILES,
          data: {
            libraryId: library.id,
            directoryId: String(directory.id),
            paths,
            progressCounter: crawlCount,
            force: job.force,
          },
        });
      }



      this.logger.verbose(
        `Crawled ${crawlCount} file(s) so far: ${paths.length} of current batch of ${pathBatch.length} will be imported to directory ${directory.id}...`,
      );
    }

    this.logger.verbose(
      `Finished disk crawl, ${crawlCount} file(s) found on disk and queued ${importCount} file(s) for import into ${directory.id}`,
    );

    await this.libraryRepository.update(library.id, { refreshedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_SYNC_FILES, queue: QueueName.LIBRARY })
  async handleSyncFiles(job: JobOf<JobName.LIBRARY_SYNC_FILES>): Promise<JobStatus> {
    const directory = await this.directoryRepository.get(String(job.directoryId));

    if (!directory) {
      this.logger.debug(`Directory ${job.directoryId} not found, skipping file import`);
      return JobStatus.FAILED;
    }

    const library = await this.libraryRepository.get(job.libraryId);

    // We need to check if the library still exists as it could have been deleted after the scan was queued
    if (!library) {
      this.logger.warn(`Library ${directory.libraryId} not found, skipping file import`);
      return JobStatus.FAILED;
    } else if (library.deletedAt) {
      this.logger.warn(`Library ${directory.libraryId} is deleted, won't import assets into it`);
      return JobStatus.FAILED;
    }


    //let assetImports = job.paths.map((assetPath) => this.processEntity(assetPath, library.ownerId, library.id, directory.id));

    let assetImports: Insertable<Assets>[] = [];
    await Promise.all(
      job.paths.map((assetPath) =>
        this.processEntity(assetPath, library.ownerId, library.id, String(directory.id))
          .then((asset) => assetImports.push(asset))
          .catch((error: any) => this.logger.error(`Error processing ${path} for library ${job.libraryId}`, error)),
      ),
    );



    let existingAssets: Insertable<Assets>[] = [];
    const isSameChecksum = (a: Buffer, b: Buffer) => a.equals(b);

    if (job.force) {
      existingAssets = await this.assetRepository.getbyLibraryIdAndDirectoryId(library.id, String(directory.id));
      this.logger.verbose(`Found ${existingAssets.length} existing asset(s) in library ${library.id} and directory ${directory.id}`);

      assetImports = assetImports.filter((asset) =>
        !existingAssets.some((existingAsset) =>
          isSameChecksum(existingAsset.checksum, asset.checksum)
        )
      );

      this.logger.verbose(`Filtered out ${assetImports.length} new asset(s) for import`);
    }

    const assetIds: string[] = [];

    this.logger.verbose(`Processing batch of ${assetImports.length} file(s) in library ${library.id}`);
    for (let i = 0; i < assetImports.length; i += 4000) {
      // Chunk the imports to avoid the postgres limit of max parameters at once
      const chunk = assetImports.slice(i, i + 4000);
      this.logger.verbose(`Importing ${chunk.length} file(s) into library ${library.id}`);
      this.logger.verbose(`File(s) to import: ${chunk.map((asset) => asset.originalPath).join(', ')}`);
      await this.assetRepository.createAll(chunk).then((assets) => assetIds.push(...assets.map((asset) => asset.id)));
    }

    
      
    if(!directory.albumId) {
      const directoryName = path.parse(directory.path).base;
      const createAlbumDto = {
        ownerId: library.ownerId,
        albumName: directoryName,
        description: `Auto-generated album for ${directoryName}`
      };

      const albumUsersDto = [{
          userId: library.ownerId,
          role: AlbumUserRole.EDITOR,
        }];
        const album = await this.albumRepository.create(createAlbumDto, assetIds, albumUsersDto);
        this.logger.verbose(`Created album ${album.id} for directory ${directory.id}`);

        if (album.id) {
          await this.directoryRepository.update(String(directory.id), { albumId: album.id });
        }
    }


    if (job.force) {
      const newAssetIds = existingAssets
        .map((asset) => asset.id)
        .filter((id): id is string => id !== undefined && !assetIds.includes(id));
      assetIds.push(...newAssetIds);
    }

    const progressMessage =
      job.progressCounter && job.totalAssets
        ? `(${job.progressCounter} of ${job.totalAssets})`
        : `(${job.progressCounter} done so far)`;

    this.logger.verbose(`Imported ${assetIds.length} ${progressMessage} file(s) into library ${directory.libraryId}`);

    await this.queuePostSyncJobs(assetIds, String(directory.id));

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SYNC_DIRECTORIES, queue: QueueName.LIBRARY })
  async handleQueueSyncDirectories(job: JobOf<JobName.LIBRARY_QUEUE_SYNC_DIRECTORIES>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.id);
    if (!library) {
      this.logger.debug(`Library ${job.id} not found, skipping directory import`);
      return JobStatus.SKIPPED;
    }

    this.logger.verbose(`Validating import paths for library ${library.id}...`);

    const validImportPaths: string[] = [];

    for (const importPath of library.importPaths) {
      const validation = await this.validateImportPath(importPath);
      if (validation.isValid) {
        validImportPaths.push(path.normalize(importPath));
      } else {
        this.logger.warn(`Skipping invalid import path: ${importPath}. Reason: ${validation.message}`);
      }
    }

    if (validImportPaths.length === 0) {
      this.logger.warn(`No valid import paths found for library ${library.id}`);

      return JobStatus.SKIPPED;
    }

    const directoriesOnDisk = this.storageRepository.walk({
      pathsToCrawl: validImportPaths,
      includeHidden: false,
      exclusionPatterns: library.exclusionPatterns,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
      typeFilter: 'directories',
    });
    this.logger.debug(`Starting disk crawl of ${validImportPaths.length} import path(s) for library ${library.id}...`);

    let crawlCount = 0;
    let importCount = 0;



    for await (const pathBatch of directoriesOnDisk) {
      crawlCount += pathBatch.length;
      this.logger.debug(`Found ${pathBatch.length} directory(ies) in library ${library.id}}`);
      const directories = await this.directoryRepository.filterNewExternalDirectoryPaths(library.id, pathBatch);
      this.logger.debug(`Filtered out ${directories.length} new directory(ies) for import`);

      if (directories.length > 0) {
        importCount += directories.length;

        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_DIRECTORIES,
          data: {
            libraryId: library.id,
            directories,
            progressCounter: crawlCount,
            force: job.force,
          },
        });
      }
      this.logger.debug(
        `Crawled ${crawlCount} directory(ies) so far: ${directories.length} of current batch of ${pathBatch.length} will be imported to library ${library.id}...`,
      );
    }
    if (job.force) {

      const notProcessedDirectories = await this.directoryRepository.getByStatus([DirectoryStatus.ADDED, DirectoryStatus.FAILED, DirectoryStatus.SKIPPED]);
      if (notProcessedDirectories.length > 0) {
        this.logger.debug(`Found ${notProcessedDirectories.length} directory(ies) that were not processed`);
        const directories = notProcessedDirectories.map((directory) => directory.path);
        importCount += directories.length;
        this.logger.debug(`Re-queuing ${directories.length} directory(ies) for import into library ${library.id}`);
        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_DIRECTORIES,
          data: {
            libraryId: library.id,
            directories,
            progressCounter: crawlCount,
            force: job.force,
          },
        });
      }
    }
    this.logger.debug(
      `Finished disk crawl, ${crawlCount} directory(ies) found on disk and queued ${importCount} directory(ies) for import into ${library.id}`,
    );
    await this.libraryRepository.update(job.id, { refreshedAt: new Date() });
    return JobStatus.SUCCESS;
  }


  @OnJob({ name: JobName.LIBRARY_ASSET_REMOVAL, queue: QueueName.LIBRARY })
  async handleAssetRemoval(job: JobOf<JobName.LIBRARY_ASSET_REMOVAL>): Promise<JobStatus> {
    // This is only for handling file unlink events via the file watcher
    this.logger.verbose(`Deleting asset(s) ${job.paths} from library ${job.libraryId}`);
    for (const assetPath of job.paths) {
      const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, assetPath);
      if (asset) {
        await this.assetRepository.remove(asset);
      }
    }

    return JobStatus.SUCCESS;
  }


  @OnJob({ name: JobName.LIBRARY_QUEUE_SYNC_ASSETS, queue: QueueName.LIBRARY })
  async handleQueueSyncAssets(job: JobOf<JobName.LIBRARY_QUEUE_SYNC_ASSETS>): Promise<JobStatus> {
    const directory = await this.directoryRepository.get(job.id);
    if (!directory) {
      this.logger.debug(`Directory ${job.id} not found, skipping refresh`);
      return JobStatus.SKIPPED;
    }

    const library = await this.libraryRepository.get(String(directory.libraryId));
    // We need to check if the library still exists as it could have been deleted after the scan was queued
    if (!library) {
      return JobStatus.SKIPPED;
    }

    const assetCount = await this.assetRepository.getDirectoryAssetCount(String(directory.libraryId), String(directory.id));
    if (!assetCount) {
      this.logger.debug(`No assets found in library ${library.id} and directory ${directory.id}, skipping check`);
      return JobStatus.SUCCESS;
    }

    this.logger.verbose(
      `Checking ${assetCount} asset(s) against import paths and exclusion patterns in library ${library.id} and directory ${directory.id}...`,
    );

    const offlineResult = await this.assetRepository.detectOfflineExternalAssetsByDirectory(
      library.id,
      String(directory.id),
      library.importPaths,
      library.exclusionPatterns,
    );

    const affectedAssetCount = Number(offlineResult.numUpdatedRows);

    this.logger.verbose(
      `${affectedAssetCount} asset(s) out of ${assetCount} were offlined due to import paths and/or exclusion pattern(s) in library ${library.id} and directory ${directory.id}`,
    );

    if (affectedAssetCount === assetCount) {
      return JobStatus.SUCCESS;
    }

    let chunk: string[] = [];
    let count = 0;

    const queueChunk = async () => {
      if (chunk.length > 0) {
        count += chunk.length;

        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_ASSETS,
          data: {
            libraryId: library.id,
            importPaths: library.importPaths,
            exclusionPatterns: library.exclusionPatterns,
            assetIds: chunk.map((id) => id),
            progressCounter: count,
            totalAssets: assetCount,
            directoryId: String(directory.id),
          },
        });
        chunk = [];

        const completePercentage = ((100 * count) / assetCount).toFixed(1);

        this.logger.verbose(
          `Queued check of ${count} of ${assetCount} (${completePercentage} %) existing asset(s) so far in library ${library.id} and directory ${directory.id}`
        );
      }
    };

    this.logger.verbose(`Scanning library ${library.id} and directory ${directory.id} for assets missing from disk...`);
    const existingAssets = this.directoryRepository.streamAssetIds(library.id, String(directory.id));

    for await (const asset of existingAssets) {
      chunk.push(asset.id);
      if (chunk.length === JOBS_LIBRARY_PAGINATION_SIZE) {
        await queueChunk();
      }
    }

    await queueChunk();

    this.logger.verbose(`Finished queuing ${count} asset check(s) for library ${library.id} and directory ${directory.id}`);

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_SYNC_ASSETS, queue: QueueName.LIBRARY })
  async handleSyncAssets(job: JobOf<JobName.LIBRARY_SYNC_ASSETS>): Promise<JobStatus> {
    const assets = await this.assetJobRepository.getForSyncAssets(job.assetIds);

    const assetIdsToOffline: string[] = [];
    const trashedAssetIdsToOffline: string[] = [];
    const assetIdsToOnline: string[] = [];
    const trashedAssetIdsToOnline: string[] = [];
    const assetIdsToUpdate: string[] = [];

    this.logger.verbose(`Checking batch of ${assets.length} existing asset(s) in library ${job.libraryId}`);

    const stats = await Promise.all(
      assets.map((asset) => this.storageRepository.stat(asset.originalPath).catch(() => null)),
    );

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const stat = stats[i];
      const action = this.checkExistingAsset(asset, stat);
      switch (action) {
        case AssetSyncResult.OFFLINE: {
          if (asset.status === AssetStatus.TRASHED) {
            trashedAssetIdsToOffline.push(asset.id);
          } else {
            assetIdsToOffline.push(asset.id);
          }
          break;
        }
        case AssetSyncResult.UPDATE: {
          assetIdsToUpdate.push(asset.id);
          break;
        }
        case AssetSyncResult.CHECK_OFFLINE: {
          const isInImportPath = job.importPaths.find((path) => asset.originalPath.startsWith(path));

          if (!isInImportPath) {
            this.logger.verbose(
              `Offline asset ${asset.originalPath} is still not in any import path, keeping offline in library ${job.libraryId}`,
            );
            break;
          }

          const isExcluded = job.exclusionPatterns.some((pattern) => picomatch.isMatch(asset.originalPath, pattern));

          if (!isExcluded) {
            this.logger.debug(`Offline asset ${asset.originalPath} is now online in library ${job.libraryId}`);
            if (asset.status === AssetStatus.TRASHED) {
              trashedAssetIdsToOnline.push(asset.id);
            } else {
              assetIdsToOnline.push(asset.id);
            }
            break;
          }

          this.logger.verbose(
            `Offline asset ${asset.originalPath} is in an import path but still covered by exclusion pattern, keeping offline in library ${job.libraryId}`,
          );

          break;
        }
      }
    }

    const promises = [];
    if (assetIdsToOffline.length > 0) {
      promises.push(this.assetRepository.updateAll(assetIdsToOffline, { isOffline: true, deletedAt: new Date() }));
    }

    if (trashedAssetIdsToOffline.length > 0) {
      promises.push(this.assetRepository.updateAll(trashedAssetIdsToOffline, { isOffline: true }));
    }

    if (assetIdsToOnline.length > 0) {
      promises.push(this.assetRepository.updateAll(assetIdsToOnline, { isOffline: false, deletedAt: null }));
    }

    if (trashedAssetIdsToOnline.length > 0) {
      promises.push(this.assetRepository.updateAll(trashedAssetIdsToOnline, { isOffline: false }));
    }
    this.logger.verbose(`Updating ${assetIdsToOffline.length} asset(s) to offline, ${trashedAssetIdsToOffline.length} trashed asset(s) to offline, ${assetIdsToOnline.length} asset(s) to online, ${trashedAssetIdsToOnline.length} trashed asset(s) to online in library ${job.libraryId}`);
    if (assetIdsToUpdate.length > 0) {
      this.logger.verbose(`Sync Assets Updating ${assetIdsToUpdate.length} asset(s) in library ${job.libraryId} and directory ${job.directoryId}`);

      promises.push(this.queuePostSyncJobs(assetIdsToUpdate, String(job.directoryId)));
    }

    await Promise.all(promises);

    const remainingCount = assets.length - assetIdsToOffline.length - assetIdsToUpdate.length - assetIdsToOnline.length;
    const cumulativePercentage = ((100 * job.progressCounter) / job.totalAssets).toFixed(1);
    this.logger.verbose(
      `Checked existing asset(s): ${assetIdsToOffline.length + trashedAssetIdsToOffline.length} offlined, ${assetIdsToOnline.length + trashedAssetIdsToOnline.length} onlined, ${assetIdsToUpdate.length} updated, ${remainingCount} unchanged of current batch of ${assets.length} (Total progress: ${job.progressCounter} of ${job.totalAssets}, ${cumulativePercentage} %) in library ${job.libraryId}.`,
    );

    return JobStatus.SUCCESS;
  }

  private async findOrFail(id: string) {
    const library = await this.libraryRepository.get(id);
    if (!library) {
      throw new BadRequestException('Library not found');
    }
    return library;
  }
}
