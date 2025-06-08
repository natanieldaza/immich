import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DirectoryStatus } from 'src/enum';
import { ValidateUUID } from 'src/validation';

export class DirectoryResponseDto {
  id!: string;
  ownerId!: string;
  libraryId?: string | null;
  status!: string;
  path!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date | null;
  isExternal?: boolean;
  isOffline?: boolean;
  isHidden?: boolean;
  albumId?: string | null;
}

export class CreateDirectoryDto {
  @ValidateUUID()
  ownerId!: string;
  
  @ValidateUUID()
  libraryId!: string;
  
  @IsString()
  status!: DirectoryStatus;

  
  @IsString() 
  path!: string;

  @IsString()
  @IsOptional()
  createdAt!: Date;
  @IsString()
  @IsOptional()
  updatedAt!: Date;
  @IsString()
  @IsOptional()
  deletedAt!: Date | null;
  
  @IsBoolean()
  isOffline!: boolean;
  @IsBoolean()
  isHidden!: boolean;

  @IsString()
  @IsOptional()
  albumId!: string | null;
}

export class UpdateDirectoryDto {
  @IsOptional()
  @ValidateUUID()
  ownerId!: string;
  
  @IsOptional()
  @ValidateUUID()
  libraryId!: string;
  
  @IsOptional()
  @IsString()
  status!: DirectoryStatus;

  @IsOptional()
  @IsString() 
  path!: string;
  
  @IsOptional()
  createdAt!: Date;
  @IsOptional()
  updatedAt!: Date;
  @IsOptional()
  deletedAt!: Date | null;
  @IsOptional()
  @IsBoolean()
  isExternal!: boolean;
  @IsOptional()
  @IsBoolean()
  isOffline!: boolean;
  @IsOptional()
  @IsBoolean()
  isHidden!: boolean;

  @IsOptional()
  @ValidateUUID()
  albumId!: string | null;
}

export interface CrawlOptionsDto {
  pathsToCrawl: string[];
  includeHidden?: boolean;
  exclusionPatterns?: string[];

}

// export interface WalkOptionsDto extends CrawlOptionsDto {
//   take: number;
//   typeFilter: 'all' | 'files' | 'directories';
//   deepth?: number;
//   /*skip?: number;
//   sort?: 'asc' | 'desc';
//   sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
//   sortByType?: 'string' | 'number' | 'date';
//   sortByOrder?: 'asc' | 'desc';
//   sortByOrderType?: 'string' | 'number' | 'date';
//   sortByOrderDirection?: 'asc' | 'desc';
//   sortByOrderDirectionType?: 'string' | 'number' | 'date';
//   sortByOrderDirectionOrder?: 'asc' | 'desc';
//   sortByOrderDirectionOrderType?: 'string' | 'number' | 'date';*/
// }

// export class ValidateLibraryDto {
//   @Optional()
//   @IsString({ each: true })
//   @IsNotEmpty({ each: true })
//   @ArrayUnique()
//   @ArrayMaxSize(128)
//   importPaths?: string[];

//   @Optional()
//   @IsNotEmpty({ each: true })
//   @IsString({ each: true })
//   @ArrayUnique()
//   @ArrayMaxSize(128)
//   exclusionPatterns?: string[];
// }

// export class ValidateLibraryResponseDto {
//   importPaths?: ValidateLibraryImportPathResponseDto[];
// }

// export class ValidateLibraryImportPathResponseDto {
//   importPath!: string;
//   isValid: boolean = false;
//   message?: string;
// }

// export class LibrarySearchDto {
//   @ValidateUUID({ optional: true })
//   userId?: string;
// }

// export class LibraryResponseDto {
//   id!: string;
//   ownerId!: string;
//   name!: string;

//   @ApiProperty({ type: 'integer' })
//   assetCount!: number;

//   importPaths!: string[];

//   exclusionPatterns!: string[];

//   createdAt!: Date;
//   updatedAt!: Date;
//   refreshedAt!: Date | null;
// }

// export class LibraryStatsResponseDto {
//   @ApiProperty({ type: 'integer' })
//   photos = 0;

//   @ApiProperty({ type: 'integer' })
//   videos = 0;

//   @ApiProperty({ type: 'integer' })
//   total = 0;

//   @ApiProperty({ type: 'integer', format: 'int64' })
//   usage = 0;
// }

// export function mapLibrary(entity: Library): LibraryResponseDto {
//   let assetCount = 0;
//   if (entity.assets) {
//     assetCount = entity.assets.length;
//   }
//   return {
//     id: entity.id,
//     ownerId: entity.ownerId,
//     name: entity.name,
//     createdAt: entity.createdAt,
//     updatedAt: entity.updatedAt,
//     refreshedAt: entity.refreshedAt,
//     assetCount,
//     importPaths: entity.importPaths,
//     exclusionPatterns: entity.exclusionPatterns,
//   };
// }
