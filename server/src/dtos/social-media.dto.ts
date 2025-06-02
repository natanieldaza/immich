
import { ApiProperty } from '@nestjs/swagger';

import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';


export class CreateSocialMediaDto {
  

  @IsNotEmpty()
  @IsString()
  platform!: string;  // e.g., 'Facebook', 'Instagram', 'Twitter'

  @IsNotEmpty()
  @IsString()
  platformUserId!: string;  // e.g., Instagram username, Twitter handle, etc.

  @IsOptional()
  @IsString()
  platformUserIdHash?: string;  // Ensure uniqueness

  @IsOptional()
  @IsString()
  thumbnailPath?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsInt()
  followers?: number;

  @IsOptional()
  @IsInt()
  following?: number;

  @IsOptional()
  @IsInt()
  posts?: number;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;

  @IsOptional()
  @IsDate()
  lastDownloaded?: Date;

  @IsOptional()
  @IsString()
  lastDownloadedNode?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;  // Person ID to associate with the social media account

  @IsUUID()
  OwnerId!: string;  // Owner ID to associate with the social media account
}

export class UpdateSocialMediaDto extends CreateSocialMediaDto {
  @IsNotEmpty()
  @IsUUID()
  id!: string;  // The ID of the social media account to update
}

export class SocialMediaResponseDto {
  id!: string;
  platform!: string;  // e.g., 'Facebook', 'Instagram', 'Twitter'
  platformUserId!: string;  // e.g., Instagram username, Twitter handle, etc.
  platformUserIdHash?: string;  // Ensure uniqueness
  name?: string;
  description?: string;
  @IsUrl()
  url!: string;
  followers?: number;
  following?: number;
  posts?: number;
  @ApiProperty({ format: 'date' })
  updatedAt?: Date;
  @ApiProperty({ format: 'date' })
  lastDownloaded?: Date;
  @ApiProperty({ format: 'date' })
  lastDownloadedNode?: string;
  thumbnailPath?: string;
  personId?: string;  // Person ID to associate with the social media account
}

export function mapSocialMediaToResponseDto(socialMedia: any): SocialMediaResponseDto {
  return {
    id: socialMedia.id,
    platform: socialMedia.platform,
    platformUserId: socialMedia.platformUserId,
    platformUserIdHash: socialMedia.platformUserIdHash,
    name: socialMedia.name,
    description: socialMedia.description,
    url: socialMedia.url,
    followers: socialMedia.followers,
    following: socialMedia.following,
    posts: socialMedia.posts,
    updatedAt: socialMedia.updatedAt,
    lastDownloaded: socialMedia.lastDownloaded,
    lastDownloadedNode: socialMedia.lastDownloadedNode,
    thumbnailPath: socialMedia.thumbnailPath,
    personId: socialMedia.personId,
  };
}