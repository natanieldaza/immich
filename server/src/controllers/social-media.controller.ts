import { Body, Controller, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';

import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SocialMediaService } from 'src/services/social-media.service';

import { CreateSocialMediaDto, SocialMediaResponseDto, UpdateSocialMediaDto } from 'src/dtos/social-media.dto';




@ApiTags('Social Media')
@Controller('social-media')
export class SocialMediaController {
  constructor(
    private service: SocialMediaService,
    private logger: LoggingRepository,) {}

  // Create a new social media account
  
  @Post()
  @Authenticated({ permission: Permission.PERSON_CREATE })
  createSocialMedia(
    @Auth() auth: AuthDto,
    @Body() createSocialMediaDto: CreateSocialMediaDto,
  ): Promise<SocialMediaResponseDto> {
    return this.service.create(auth, createSocialMediaDto);
  }

  // Update an existing social media account
  @Put(':id')
  @Authenticated({ permission: Permission.PERSON_CREATE })
  async updateSocialMedia(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Body() updateSocialMediaDto: UpdateSocialMediaDto,
  ): Promise<SocialMediaResponseDto> {
    // Ensure the ID in the DTO matches the URL parameter
    if (id !== updateSocialMediaDto.id) {
      throw new NotFoundException('Social media account not found');
    }

    const updatedSocialMedia = await this.service.update(auth,updateSocialMediaDto);
    if (!updatedSocialMedia) {
      throw new NotFoundException('Social media account not found');
    }
    return updatedSocialMedia;
  }

  // Get all social media accounts
  @Get()
  @Authenticated({ permission: Permission.PERSON_READ })
  async getAllSocialMedia(@Auth() auth: AuthDto): Promise<SocialMediaResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.PERSON_READ })
  async getSocialMediaById(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
  ): Promise<SocialMediaResponseDto> {
    const socialMedia = await this.service.getById(auth, id);
    if (!socialMedia) {
      throw new NotFoundException('Social media account not found');
    }
    return socialMedia;
  }
  // Get social media by person ID
  @Get('person/:personId')
  @Authenticated({ permission: Permission.PERSON_READ })
  async getSocialMediaByPersonId(
    @Auth() auth: AuthDto,
    @Param('personId') personId: string,
  ): Promise<SocialMediaResponseDto[]> {
    this.logger.debug(`Fetching social media accounts for person ID: ${personId}`);
    const socialMedia = await this.service.getAllByPersonId(auth, personId);
    if (!socialMedia) {
      throw new NotFoundException('Social media account not found');
    }
    return socialMedia;
  }
}