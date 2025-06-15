import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EndpointLifecycle } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkMoveDto,
  AssetBulkUpdateDto,
  AssetJobsDto,
  AssetStatsDto,
  AssetStatsResponseDto,
  DeviceIdDto,
  RandomAssetsDto,
  UpdateAssetDto,
} from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { RouteKey } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AssetService } from 'src/services/asset.service';
import { MetadataService } from 'src/services/metadata.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Assets')
@Controller(RouteKey.ASSET)
export class AssetController {
  
  constructor(private service: AssetService, private logger: LoggingRepository, private metadataService: MetadataService) {
  
  }

  @Get('random')
  @Authenticated()
  @EndpointLifecycle({ deprecatedAt: 'v1.116.0' })
  getRandom(@Auth() auth: AuthDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(auth, dto.count ?? 1);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Get('/device/:deviceId')
  @ApiOperation({
    summary: 'getAllUserAssetsByDeviceId',
    description: 'Get all asset of a device that are in the database, ID only.',
  })
  @Authenticated()
  getAllUserAssetsByDeviceId(@Auth() auth: AuthDto, @Param() { deviceId }: DeviceIdDto) {
    return this.service.getUserAssetsByDeviceId(auth, deviceId);
  }

  @Get('statistics')
  @Authenticated()
  getAssetStatistics(@Auth() auth: AuthDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post('jobs')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  runAssetJobs(@Auth() auth: AuthDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(auth, dto);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  updateAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  deleteAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  
  @Put('move')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  moveAssets(
    @Auth() auth: AuthDto,
    @Body() dto: AssetBulkMoveDto,
  ): Promise<void> {
    this.logger.debug('Moving assets', dto);
    return this.service.moveAll(auth, dto);
  }


  @Get(':id')
  @Authenticated({ sharedLink: true })
  async getAssetInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<AssetResponseDto> {
    const response = await this.service.get(auth, id) as AssetResponseDto;
    const extraData = await this.metadataService.getExtraData(id, response.people ?? []);
    
    if (extraData) {
      const {
        mainPerson,
        ownerPerson,
        relatedProfiles,
        coauthors,
        taggedPeople,
        url,
        locationName,
        locationURL,
      } = extraData;

      // Optionally, you can attach these to response if you want them in the output

      (response as any).mainPerson = mainPerson;
      (response as any).ownerPerson = ownerPerson;
      (response as any).taggedPeople = taggedPeople;
      (response as any).relatedProfiles = relatedProfiles;
      (response as any).coauthors = coauthors;
      (response as any).assetUrl = url;
      (response as any).locationName = locationName;
      (response as any).locationUrl = locationURL;



    }

    return response;
  }

  @Put(':id')
  @Authenticated()
  updateAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.service.update(auth, id, dto);
  }
}
