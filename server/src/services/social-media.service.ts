import { BadRequestException, Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateSocialMediaDto, SocialMediaResponseDto, UpdateSocialMediaDto } from 'src/dtos/social-media.dto';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

@Injectable()
export class SocialMediaService extends BaseService {

  async create(auth: AuthDto, dto: CreateSocialMediaDto): Promise<SocialMediaResponseDto> {
    const socialMedia = await this.socialMediaRepository.create({
      id: '',
      name: String(dto.name),
      platformUserId: dto.platformUserId,
      platformUserIdHash: String(dto.platformUserIdHash),
      description: String(dto.description),
      followers: dto.followers ?? 0,
      following: dto.following ?? 0,
      posts: dto.posts ?? 0,
      url: dto.url,
      thumbnailPath: String(dto.thumbnailPath),
      platform: dto.platform,
      ownerId: auth.user.id
    });

    return {
      id: socialMedia.id ?? '',
      name: socialMedia.name ?? '',
      platformUserId: socialMedia.platformUserId ?? '',
      platformUserIdHash: socialMedia.platformUserIdHash?? '',
      description: socialMedia.description?? '',
      followers: socialMedia.followers,
      following: socialMedia.following,
      posts: socialMedia.posts,
      url: socialMedia.url,
      thumbnailPath: socialMedia.thumbnailPath ?? '',
      platform: socialMedia.platform,
    };
  }
  async update(auth: AuthDto, updateSocialMediaDto: UpdateSocialMediaDto): Promise<SocialMediaResponseDto> {
    
     const socialMedia = await this.socialMediaRepository.update({
      id: updateSocialMediaDto.id,
      name: String(updateSocialMediaDto.name),
      platformUserId: updateSocialMediaDto.platformUserId,
      platformUserIdHash: String(updateSocialMediaDto.platformUserIdHash),
      description: String(updateSocialMediaDto.description),
      followers: updateSocialMediaDto.followers ?? 0,
      following: updateSocialMediaDto.following ?? 0,
      posts: updateSocialMediaDto.posts ?? 0,
      url: updateSocialMediaDto.url,
      thumbnailPath: String(updateSocialMediaDto.thumbnailPath),
      platform: updateSocialMediaDto.platform,
      personId: updateSocialMediaDto.personId,
    });

    if (!socialMedia) {
      throw new BadRequestException('Failed to update social media account');
    }

    return {
      id: socialMedia.id ?? '',
      name: socialMedia.name ?? '',
      platformUserId: socialMedia.platformUserId ?? '',
      platformUserIdHash: socialMedia.platformUserIdHash?? '',
      description: socialMedia.description?? '',
      followers: socialMedia.followers,
      following: socialMedia.following,
      posts: socialMedia.posts,
      url: socialMedia.url,
      thumbnailPath: socialMedia.thumbnailPath ?? '',
      platform: socialMedia.platform,
    };
  }

  async getAll(auth: AuthDto): Promise<SocialMediaResponseDto[]> {
    const socialMedia = await this.socialMediaRepository.GetAll();
    if (!socialMedia) {
      throw new BadRequestException('No social media accounts found');
    }
    return socialMedia.map((media) => ({
      id: media.id ?? '',
      name: media.name ?? '',
      platformUserId: media.platformUserId ?? '',
      platformUserIdHash: media.platformUserIdHash ?? '',
      description: media.description ?? '',
      followers: media.followers,
      following: media.following,
      posts: media.posts,
      url: media.url,
      thumbnailPath: media.thumbnailPath ?? '',
      platform: media.platform,
    }));
  }
  async getById(auth: AuthDto, id: string): Promise<SocialMediaResponseDto> {
    const socialMedia = await this.socialMediaRepository.findById(id);
    if (!socialMedia) {
      throw new BadRequestException('Social media account not found');
    }
    return {
      id: socialMedia.id ?? '',
      name: socialMedia.name ?? '',
      platformUserId: socialMedia.platformUserId ?? '',
      platformUserIdHash: socialMedia.platformUserIdHash ?? '',
      description: socialMedia.description ?? '',
      followers: socialMedia.followers,
      following: socialMedia.following,
      posts: socialMedia.posts,
      url: socialMedia.url,
      thumbnailPath: socialMedia.thumbnailPath ?? '',
      platform: socialMedia.platform,
    };
  }
  async getAllByPersonId(auth: AuthDto, personId: string): Promise<SocialMediaResponseDto[]> {
    this.logger.debug(`Fetching social media accounts for person ID: ${personId}`);
    const socialMedia = await this.socialMediaRepository.GetAllSocialMediabyPersonId(personId);
    if (!socialMedia) {
      throw new BadRequestException('No social media accounts found for this person');
    }
    return socialMedia.map((media) => ({
      id: media.id ?? '',
      name: media.name ?? '',
      platformUserId: media.platformUserId ?? '',
      platformUserIdHash: media.platformUserIdHash ?? '',
      description: media.description ?? '',
      followers: media.followers,
      following: media.following,
      posts: media.posts,
      url: media.url,
      thumbnailPath: media.thumbnailPath ?? '',
      platform: media.platform,
    }));
  }

  @OnJob({ name: JobName.QUEUE_SOCIAL_MEDIA_DATA_SCRAPPING, queue: QueueName.SOCIAL_MEDIA_DATA_SCRAPPING })
  async handleQueueSocialMediaDataScraping(job: JobOf<JobName.QUEUE_SOCIAL_MEDIA_DATA_SCRAPPING>): Promise<JobStatus> {
    try {
      // const socialMediaHub = [];


      // if (socialMediaHub.size === 0) {
      //   this.logger.warn('No social media data available for scraping. Skipping job.');
      //   return JobStatus.SKIPPED;
      // }

      // for (const [key, socialMedia] of socialMediaHub) {
      //   this.logger.debug(`Processing social media profile: ${key}`);

      //   // Verify missing data
      //   const missingFields = [];
      //   if (!socialMedia.name) missingFields.push('name');
      //   if (!socialMedia.platformUserId) missingFields.push('platformUserId');
      //   if (!socialMedia.platformUserIdHash) missingFields.push('platformUserIdHash');
      //   if (!socialMedia.description) missingFields.push('description');
      //   if (socialMedia.followers === 0) missingFields.push('0');
      //   if (socialMedia.following === 0) missingFields.push('0');
      //   if (socialMedia.posts === 0) missingFields.push('0');

      //   if (missingFields.length > 0) {
      //     const socialMediaId = socialMedia.platformUserId;
      //     const hashId = socialMedia.platformUserIdHash;
      //     const platform = socialMedia.platform;
      //     await this.jobRepository.queue({
      //       name: JobName.SOCIAL_MEDIA_DATA_SCRAPPING_WEB,
      //       data: { socialMediaId, hashId, platform }
      //     });
      //   }
      // }

      return JobStatus.SUCCESS;
    } catch (error) {
      this.logger.error('Error during social media data scraping job', error);
      return JobStatus.FAILED;
    }
  }

  @OnJob({ name: JobName.SOCIAL_MEDIA_DATA_SCRAPPING, queue: QueueName.SOCIAL_MEDIA_DATA_SCRAPPING })
  async handleSocialMediaDataScraping(job: JobOf<JobName.SOCIAL_MEDIA_DATA_SCRAPPING>): Promise<JobStatus> {

    const { force } = job;
    this.logger.debug(`Force: ${force}`);



    // Fetch social media data
    return JobStatus.SUCCESS;
  }
}
