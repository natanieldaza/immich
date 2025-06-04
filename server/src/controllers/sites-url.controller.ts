import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';

import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';

import { SitesUrlCreateDto, SitesUrlResponseDto, SitesUrlUpdateDto } from 'src/dtos/sites-url.dto';
import { SitesUrlService } from 'src/services/sites-url.service';


@ApiTags('Sites URL')
@Controller('sites-url')
export class SitesUrlController {
  constructor(
    private service: SitesUrlService,
    private logger: LoggingRepository,) { }

  // Create a new site URL
  @Post()
  @Authenticated({ permission: Permission.URL_CREATE })
  createSitesUrl(
    @Auth() auth: AuthDto,
    @Body() createSitesUrlDto: SitesUrlCreateDto,
  ): Promise<SitesUrlResponseDto> {
    return this.service.create(auth, createSitesUrlDto);
  }
  // Update an existing site URL
  @Put(':id')
  @Authenticated({ permission: Permission.URL_UPDATE })
  async updateSitesUrl(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Body() updateSitesUrlDto: SitesUrlUpdateDto,
  ): Promise<SitesUrlResponseDto> {
    // Ensure the ID in the DTO matches the URL parameter
    this.logger.log('updateSitesUrl', { id, updateSitesUrlDto });

    const updatedSitesUrl = await this.service.update(auth, id, updateSitesUrlDto);
    if (!updatedSitesUrl) {
      throw new NotFoundException('Site URL not found');
    }
    return updatedSitesUrl;
  }
  // Delete a site URL
  @Delete(':id')
  @Authenticated({ permission: Permission.URL_UPDATE })
  async deleteSitesUrl(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
  ): Promise<SitesUrlResponseDto> {
    const deletedSitesUrl = await this.service.delete(auth, id);
    if (!deletedSitesUrl) {
      throw new NotFoundException('Site URL not found');
    }
    return deletedSitesUrl;
  }

  // Get all site URLs
  @Get()
  @Authenticated({ permission: Permission.URL_READ })
  async getAllSitesUrl(@Auth() auth: AuthDto): Promise<SitesUrlResponseDto[]> {
    const sitesUrl = await this.service.getAll(auth);
    for (const site of sitesUrl) {
      this.logger.log(`Retrieved site URL: ${JSON.stringify(site)}`);
    }

    return sitesUrl;
  }
  @Get(':id')
  @Authenticated({ permission: Permission.URL_READ })
  async getSitesUrlById(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
  ): Promise<SitesUrlResponseDto> {
    return await this.service.getById(auth, id);
  }

  @Get('url')
  @Authenticated({ permission: Permission.URL_READ })
  async getSitesUrlByUrl(
    @Auth() auth: AuthDto,
    @Query('url') url: string,
  ): Promise<SitesUrlResponseDto> {
    const sitesUrl = await this.service.getByUrl(auth, url);
    if (!sitesUrl) {
      throw new NotFoundException('Site URL not found');
    }
    return sitesUrl;
  }

  @Put('download/:id')
  @Authenticated({ permission: Permission.URL_UPDATE })
  async downloadSitesUrl(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
  ): Promise<SitesUrlResponseDto> {
    const updatedSitesUrl = await this.service.dowload(auth, id);
    if (!updatedSitesUrl) {
      throw new NotFoundException('Site URL not found');
    }
    return updatedSitesUrl;
  }
}

