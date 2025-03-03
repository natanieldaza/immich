import { BadRequestException, Injectable } from '@nestjs/common';
import { R_OK } from 'node:constants';
import path, { basename, isAbsolute, parse } from 'node:path';
import picomatch from 'picomatch';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
// import {
//   CreateLibraryDto,
//   LibraryResponseDto,
//   LibraryStatsResponseDto,
//   mapLibrary,
//   UpdateLibraryDto,
//   ValidateLibraryDto,
//   ValidateLibraryImportPathResponseDto,
//   ValidateLibraryResponseDto,
// } from 'src/dtos/library.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { LibraryEntity } from 'src/entities/library.entity';
import { AssetType, DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { mimeTypes } from 'src/utils/mime-types';
import { handlePromiseError } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class SocialMediaService extends BaseService {
  
}