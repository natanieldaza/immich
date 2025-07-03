import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryResponseDto,
} from 'src/dtos/library.dto';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { LibraryService } from 'src/services/library.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Libraries')
@Controller('libraries')
export class LibraryController {
  constructor(private service: LibraryService) {}

  @Get()
  @Authenticated({ permission: Permission.LIBRARY_READ, admin: true })
  getAllLibraries(): Promise<LibraryResponseDto[]> {
    return this.service.getAll();
  }

  @Post()
  @Authenticated({ permission: Permission.LIBRARY_CREATE, admin: true })
  createLibrary(@Body() dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.LIBRARY_READ, admin: true })
  getLibrary(@Param() { id }: UUIDParamDto): Promise<LibraryResponseDto> {
    return this.service.get(id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  updateLibrary(@Param() { id }: UUIDParamDto, @Body() dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_DELETE, admin: true })
  deleteLibrary(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(id);
  }

  @Post(':id/validate')
  @HttpCode(200)
  @Authenticated({ admin: true })
  // TODO: change endpoint to validate current settings instead
  validate(@Param() { id }: UUIDParamDto, @Body() dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    return this.service.validate(id, dto);
  }

  @Get(':id/statistics')
  @Authenticated({ permission: Permission.LIBRARY_STATISTICS, admin: true })
  getLibraryStatistics(@Param() { id }: UUIDParamDto): Promise<LibraryStatsResponseDto> {
    return this.service.getStatistics(id);
  }

  @Post(':id/scan')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  scanLibrary(@Param() { id }: UUIDParamDto) {
    return this.service.queueScan(id);
  }

  @Post(':id/directories')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  @ApiResponse({ status: 204, description: 'Directories added successfully without processing' })
  @ApiParam({ name: 'id', description: 'Library ID' })
  @ApiBody({
    description: 'Directory paths to add',
    schema: {
      type: 'object',
      properties: {
        directories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of directory paths to add',
        },
      },
      required: ['directories'],
    },
  })
  addDirectoriesOnly(@Param() { id }: UUIDParamDto, @Body() { directories }: { directories: string[] }) {
    return this.service.addDirectoriesOnly(id, directories);
  }

  @Post(':id/process-added')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  @ApiResponse({ status: 204, description: 'Started processing all directories in added status' })
  @ApiParam({ name: 'id', description: 'Library ID' })
  @ApiBody({
    description: 'Processing options',
    schema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force reprocessing of assets',
          default: false,
        },
      },
    },
    required: false,
  })
  processAddedDirectories(@Param() { id }: UUIDParamDto, @Body() { force = false }: { force?: boolean } = {}) {
    return this.service.processAddedDirectories(id, force);
  }

  @Post('directories/process')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  @ApiResponse({ status: 204, description: 'Started processing specific directories' })
  @ApiBody({
    description: 'Directory IDs and processing options',
    schema: {
      type: 'object',
      properties: {
        directoryIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of directory IDs to process',
        },
        force: {
          type: 'boolean',
          description: 'Force reprocessing of assets',
          default: false,
        },
      },
      required: ['directoryIds'],
    },
  })
  processDirectoriesByIds(@Body() { directoryIds, force = false }: { directoryIds: string[]; force?: boolean }) {
    return this.service.processDirectoriesByIds(directoryIds, force);
  }

  @Get(':id/directory-status')
  @Authenticated({ permission: Permission.LIBRARY_READ, admin: true })
  @ApiResponse({
    status: 200,
    description: 'Directory status summary for the library',
    schema: {
      type: 'object',
      properties: {
        added: { type: 'number' },
        queued: { type: 'number' },
        processing: { type: 'number' },
        done: { type: 'number' },
        failed: { type: 'number' },
        skipped: { type: 'number' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Library ID' })
  getDirectoryStatusSummary(@Param() { id }: UUIDParamDto): Promise<Record<string, number>> {
    return this.service.getDirectoryStatusSummary(id);
  }

  @Post(':id/scan-full')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.LIBRARY_UPDATE, admin: true })
  @ApiResponse({ status: 204, description: 'Started full library scan with directory creation and processing' })
  @ApiParam({ name: 'id', description: 'Library ID' })
  @ApiBody({
    description: 'Scan options',
    schema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force reprocessing of existing assets',
          default: false,
        },
      },
    },
    required: false,
  })
  scanLibraryFull(@Param() { id }: UUIDParamDto, @Body() { force = false }: { force?: boolean } = {}) {
    return this.service.queueScan(id, force);
  }
}
