import { Get, Injectable } from '@nestjs/common';
import { ContainerDirectoryItem, ExifDateTime, Maybe, Tags } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import { Insertable } from 'kysely';
import _, { mergeWith } from 'lodash';
import { Duration } from 'luxon';
import { constants } from 'node:fs/promises';
import path from 'node:path';
import { json } from 'node:stream/consumers';
import { promises as fs } from 'fs';
import { SystemConfig } from 'src/config';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { Exif } from 'src/db';
import { OnEvent, OnJob } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SocialMediaEntity } from 'src/entities/social-media.entity';
import {
  AssetType,
  DatabaseLock,
  ExifOrientation,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  SourceType,
} from 'src/enum';
import { WithoutProperty } from 'src/repositories/asset.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { ReverseGeocodeResult } from 'src/repositories/map.repository';
import { ImmichTags } from 'src/repositories/metadata.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { isFaceImportEnabled } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';
import { upsertTags } from 'src/utils/tag';
import { console } from 'node:inspector';

/** look for a date from these tags (in order) */
const EXIF_DATE_TAGS: Array<keyof Tags> = [
  'SubSecDateTimeOriginal',
  'DateTimeOriginal',
  'SubSecCreateDate',
  'CreationDate',
  'CreateDate',
  'SubSecMediaCreateDate',
  'MediaCreateDate',
  'DateTimeCreated',
];

const validate = <T>(value: T): NonNullable<T> | null => {
  // handle lists of numbers
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (typeof value === 'string') {
    // string means a failure to parse a number, throw out result
    return null;
  }

  if (typeof value === 'number' && (Number.isNaN(value) || !Number.isFinite(value))) {
    return null;
  }

  return value ?? null;
};

const validateRange = (value: number | undefined, min: number, max: number): NonNullable<number> | null => {
  // reutilizes the validate function
  const val = validate(value);

  // check if the value is within the range
  if (val == null || val < min || val > max) {
    return null;
  }

  return val;
};

interface JsonData {
  [key: string]: any; // Allows accessing any property dynamically
}

@Injectable()
export class MetadataService extends BaseService {
  @OnEvent({ name: 'app.bootstrap', workers: [ImmichWorker.MICROSERVICES] })
  async onBootstrap() {
    this.logger.log('Bootstrapping metadata service');
    await this.init();
  }

  @OnEvent({ name: 'app.shutdown' })
  async onShutdown() {
    await this.metadataRepository.teardown();
  }

  @OnEvent({ name: 'config.init', workers: [ImmichWorker.MICROSERVICES] })
  onConfigInit({ newConfig }: ArgOf<'config.init'>) {
    this.metadataRepository.setMaxConcurrency(newConfig.job.metadataExtraction.concurrency);
  }

  @OnEvent({ name: 'config.update', workers: [ImmichWorker.MICROSERVICES], server: true })
  onConfigUpdate({ newConfig }: ArgOf<'config.update'>) {
    this.metadataRepository.setMaxConcurrency(newConfig.job.metadataExtraction.concurrency);
  }

  private async init() {
    this.logger.log('Initializing metadata service');

    try {
      await this.jobRepository.pause(QueueName.METADATA_EXTRACTION);
      await this.databaseRepository.withLock(DatabaseLock.GeodataImport, () => this.mapRepository.init());
      await this.jobRepository.resume(QueueName.METADATA_EXTRACTION);

      this.logger.log(`Initialized local reverse geocoder`);
    } catch (error: Error | any) {
      this.logger.error(`Unable to initialize reverse geocoding: ${error}`, error?.stack);
    }
  }

  private async linkLivePhotos(asset: AssetEntity, exifInfo: Insertable<Exif>): Promise<void> {
    if (!exifInfo.livePhotoCID) {
      return;
    }

    const otherType = asset.type === AssetType.VIDEO ? AssetType.IMAGE : AssetType.VIDEO;
    const match = await this.assetRepository.findLivePhotoMatch({
      livePhotoCID: exifInfo.livePhotoCID,
      ownerId: asset.ownerId,
      libraryId: asset.libraryId,
      otherAssetId: asset.id,
      type: otherType,
    });

    if (!match) {
      return;
    }

    const [photoAsset, motionAsset] = asset.type === AssetType.IMAGE ? [asset, match] : [match, asset];
    await Promise.all([
      this.assetRepository.update({ id: photoAsset.id, livePhotoVideoId: motionAsset.id }),
      this.assetRepository.update({ id: motionAsset.id, isVisible: false }),
      this.albumRepository.removeAsset(motionAsset.id),
    ]);

    await this.eventRepository.emit('asset.hide', { assetId: motionAsset.id, userId: motionAsset.ownerId });
  }

  @OnJob({ name: JobName.QUEUE_METADATA_EXTRACTION, queue: QueueName.METADATA_EXTRACTION })
  async handleQueueMetadataExtraction(job: JobOf<JobName.QUEUE_METADATA_EXTRACTION>): Promise<JobStatus> {
    const { force } = job;
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.EXIF);
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }
  
  private async ExifFromJsonTag(jsonData: JsonData): Promise<ImmichTags> {
    
    console.log('JSON --------------------------------------------');
    if(jsonData?.user?.bio_links)
    {
      console.log('JSON BIOLINKS : ',jsonData?.user?.bio_links);
    }


    const imichtags: ImmichTags = {
        DateTimeOriginal: jsonData?.date || undefined,
        ShortCode: jsonData?.shortcode || undefined,
        ImageWidth: jsonData?.width || undefined,
        ImageHeight: jsonData?.height || undefined,
        
        TaggedPeople: Array.isArray(jsonData?.tagged_users)
      ? jsonData.tagged_users.map(user => ({
          id: user.id,
          TaggedUserName: user.username,
          FullName: user.full_name,
        }))
      : undefined,
       

        DateTimeCreated: jsonData?.post_date || undefined,
        
        Description: jsonData?.description || undefined,
        
        TagsList: jsonData?.tags ? jsonData.tags.map((tag: string) => tag.replace(/^#/, "")) : undefined,
        
        LocationId: jsonData?.location_id || undefined,
        LocationName: jsonData?.location_slug || undefined,
        LocationUrl: jsonData?.location_url || undefined,
        
        // "sidecar_media_id": "string",
        // "sidecar_shortcode": "string",
        
        
        OwnerID: jsonData?.username || undefined,
        OwnerName: jsonData?.fullname || undefined,
        SocialMediaOwnerId: jsonData?.owner_id || undefined,
        
        TaggedUserName: jsonData?.tagged_username || undefined,
        
        TaggedFullName: jsonData?.tagged_full_name || undefined,
        
        FileName: jsonData?.filename || undefined,
        FileTypeExtension: jsonData?.extension || undefined,
        
        Coauthors: Array.isArray(jsonData?.coauthors)
      ? jsonData.coauthors.map(author => ({
          id: author.id,
          TaggedUserName: author.username,
          FullName: author.full_name,
        }))
      : undefined,
        
         
        HighLightTitle: jsonData?.highlight_title || undefined,
        Biography: jsonData?.biography || undefined,
        
        BioLinks: jsonData?.user?.bio_links
        ?.filter((link: { title?: string; lynx_url?: string; url?: string; link_type?: string }) => link?.lynx_url && link?.link_type) // Ensure valid entries
        ?.map((link: { title?: string; lynx_url: string; url?: string; link_type: string }) => ({
            title: link.title || "",  // Default empty string if missing
            lynx_url: link.lynx_url,
            url: link.url || undefined,  // Set `undefined` if missing
            link_type: link.link_type
        })) || undefined,
       
        FbProfileBioLink: jsonData?.user?.fb_profile_biolink || undefined,
        
        SelfData: jsonData?.user?.biography_with_entities?.raw_text || undefined,
        
        BiographyWithEntities: jsonData?.user?.biography_with_entities
        ? {
            raw_text: jsonData.user.biography_with_entities.raw_text,
            mentions: jsonData.user.biography_with_entities.entities
              ?.map((entity: { user?: { username: string } }) => entity?.user?.username)
              .filter((username: string | undefined) => username !== undefined) || [],
            hashtags: jsonData.user.biography_with_entities.entities
              ?.map((entity: { hashtag?: { name: string } }) => entity?.hashtag?.name)
              .filter((name: string | undefined) => name !== undefined) || [],

          }
        : undefined,


        
        
        ExternalUrl : jsonData?.user?.external_url || undefined,

        
        Fbid : jsonData?.user?.fbid || undefined,

        UserFullName: jsonData?.user?.full_name || undefined,
        UserId : jsonData?.user?.id || undefined,
        // "user.group_metadata": "unknown",
        // "user.id": "string",
        
        // "user.business_contact_method": "string",
        // "user.business_email": "unknown",
        // "user.business_phone_number": "unknown",
        
        UserName : jsonData?.user?.username || undefined,
        // "user.connected_fb_page": "unknown",
        
        // "user.has_onboarded_to_text_post_app": "int",
        // "user.show_text_post_app_badge": [
        //     "unknown",
        //     "int"
        // ],
        

      // Extract related profiles
      RelatedProfiles: jsonData?.user?.edge_related_profiles?.edges
        ?.filter((edge: { node?: any }) => edge.node) // Filter out any invalid entries
        .map((edge: { 
            node: { 
              id: string; 
              full_name: string; 
              is_private: boolean; 
              is_verified: boolean; 
              profile_pic_url?: string; 
              username: string; 
            } 
          }) => ({
          id: edge.node.id,
          full_name: edge.node.full_name,
          is_private: edge.node.is_private,
          is_verified: edge.node.is_verified,
          profile_pic_url: edge.node.profile_pic_url || undefined,
          username: edge.node.username
        })) || undefined,

      
        // "user.category": "string",
        Category: jsonData?.category || undefined,
        SubCategorie: jsonData?.subcategory || undefined,
    };
    console.log('JSON --------------------------------------------');
    console.log('JSON imichtags : ',imichtags);
    // Wrap the result in a Promise and return
    return Promise.resolve(imichtags);
  }


  private async processSocialMedia(tags: ImmichTags, asset: AssetEntity): Promise<void> {
    process.stdout.write("----------------------------social media---------------------------------\n");
    const socialMedia = new Map<string, SocialMediaEntity>();

    // Process the main social media
    const social_main_media = await this.processProfile(tags.OwnerName ?? '', String(tags.OwnerID) ?? '', String(tags.SocialMediaOwnerId) ?? '', tags.Category ?? '', asset.ownerId, '');
    socialMedia.set(social_main_media.platformUserId, social_main_media);

    // Process the second social media
    const social_second_Media = await this.processProfile(String(tags.UserFullName ?? ''), String(tags.UserName ?? ''), String(tags.UserId ?? ''), tags.Category ?? '', asset.ownerId, String(tags.SelfData ?? ''));

    if (socialMedia.has(social_second_Media.platformUserId)) {
        // Update the existing social media entry in the map
        this.updateSocialMedia(social_second_Media, socialMedia.get(social_second_Media.platformUserId)!);
    } else {
        // Add a new social media entry to the map
        socialMedia.set(social_second_Media.platformUserId, social_second_Media);
    }

    process.stdout.write("----------------------------related profiles---------------------------------\n");
    if (tags.RelatedProfiles) {
        await Promise.all(tags.RelatedProfiles.map(async profile => {
            const profileSocialMedia = await this.processProfile(profile.full_name ?? '', profile.username ?? '', profile.id ?? '', 'instagram', asset.ownerId, '', '');
            if (socialMedia.has(profileSocialMedia.platformUserId)) {
                this.updateSocialMedia(profileSocialMedia, socialMedia.get(profileSocialMedia.platformUserId)!);
            } else {
                socialMedia.set(profileSocialMedia.platformUserId, profileSocialMedia);
            }
        }));
    }

    process.stdout.write("----------------------------coauthors---------------------------------\n");
    if (tags.Coauthors) {
        await Promise.all(tags.Coauthors.map(async author => {
            const authorSocialMedia =  await this.processProfile(author.FullName ?? '', author.TaggedUserName ?? '', String(author.id) ?? '', 'instagram', asset.ownerId);
            if (socialMedia.has(authorSocialMedia.platformUserId)) {
                this.updateSocialMedia(authorSocialMedia, socialMedia.get(authorSocialMedia.platformUserId)!);
            } else {
                socialMedia.set(authorSocialMedia.platformUserId, authorSocialMedia);
            }
        }));
    }

    process.stdout.write("----------------------------tagged people---------------------------------\n");
    if (tags.TaggedPeople) {
        await Promise.all(tags.TaggedPeople.map(async tagged => {
            const taggedSocialMedia = await this.processProfile(tagged.FullName ?? '', tagged.TaggedUserName ?? '', String(tagged.id) ?? '', 'instagram', asset.ownerId);
            if (socialMedia.has(taggedSocialMedia.platformUserId)) {
                this.updateSocialMedia(taggedSocialMedia, socialMedia.get(taggedSocialMedia.platformUserId)!);
            } else {
                socialMedia.set(taggedSocialMedia.platformUserId, taggedSocialMedia);
            }
        }));
    }

    process.stdout.write("----------------------------biography with entities---------------------------------\n");
    if (tags.BiographyWithEntities?.mentions) {
        await Promise.all(tags.BiographyWithEntities.mentions.map(async mention => {
            const mentionSocialMedia = await this.processProfile(mention ?? '', mention ?? '', '', 'instagram', asset.ownerId);
            if (socialMedia.has(mentionSocialMedia.platformUserId)) {
                this.updateSocialMedia(mentionSocialMedia, socialMedia.get(mentionSocialMedia.platformUserId)!);
            } else {
                socialMedia.set(mentionSocialMedia.platformUserId, mentionSocialMedia);
            }
        }));
    }

    process.stdout.write("----------------------------bio links---------------------------------\n");
    if (tags.BioLinks) {
        await Promise.all(tags.BioLinks.map(async link => {
            const platform = link.title.trim() || this.getPlatformFromUrl(String(link.url));
            const linkSocialMedia = await this.processProfile(link.title ?? '', this.getUserIdFromUrl(String(link.url)) ?? '', '', platform ?? '', asset.ownerId, '', '', link.url ?? '');
            if (socialMedia.has(linkSocialMedia.platformUserId)) {
                this.updateSocialMedia(linkSocialMedia, socialMedia.get(linkSocialMedia.platformUserId)!);
            } else {
                socialMedia.set(linkSocialMedia.platformUserId, linkSocialMedia);
            }
        }));
    }

    process.stdout.write("----------------------------fb profile bio link---------------------------------\n");
    
    if (tags.FbProfileBioLink) {
        const fbProfileBioLink = await this.processProfile(tags.FbProfileBioLink.name ?? '', '', '', 'facebook', asset.ownerId, '', '', tags.FbProfileBioLink.url ?? '');
        if (socialMedia.has(fbProfileBioLink.platformUserId)) {
            this.updateSocialMedia(fbProfileBioLink, socialMedia.get(fbProfileBioLink.platformUserId)!);
        } else {
            socialMedia.set(fbProfileBioLink.platformUserId, fbProfileBioLink);
        }
    }
}


private async processProfile(
    name: string, userId: string, userIdHash: string, platform: string, ownerId: string,
    description: string = '', thumbnailPath: string = '', url: string = ''
): Promise<SocialMediaEntity> {
    const person = await this.personRepository.getByName(ownerId, name, { withHidden: false });
    const personEntity = person?.at(0);
    
    const socialMedia = new SocialMediaEntity();
    socialMedia.name = name;
    if (personEntity) {
      socialMedia.person = personEntity;
    }
    socialMedia.thumbnailPath = thumbnailPath || '';
    socialMedia.platform = platform;
    
    if(!userId){
        userId = url;
    }

    socialMedia.platformUserId = userId;
    socialMedia.platformUserIdHash = userIdHash;
    socialMedia.description = description;

    if (!platform) {
        socialMedia.platform = this.getPlatformFromUrl(url);
    }

    if (platform === 'instagram' && !url) {
        socialMedia.url = `https://www.instagram.com/${userId}`;
    } else {
        socialMedia.url = url;
    }

    socialMedia.followers = 0;
    socialMedia.following = 0;
    socialMedia.posts = 0;
    socialMedia.lastUpdated = new Date();
    socialMedia.lastDownloaded = new Date();
    socialMedia.lastDownloadedNode = '';

    process.stdout.write(`Social Media: ${JSON.stringify(socialMedia)}\n`);
    
    return socialMedia;
}

private updateSocialMedia(socialMedia: SocialMediaEntity, existing: SocialMediaEntity): void {
  if (existing.platform === socialMedia.platform) {
      // Update existing fields if they are empty, undefined or have default values
      if (!existing.name && socialMedia.name) existing.name = socialMedia.name;
      if (!existing.thumbnailPath && socialMedia.thumbnailPath) existing.thumbnailPath = socialMedia.thumbnailPath;
      if (!existing.platformUserId && socialMedia.platformUserId) existing.platformUserId = socialMedia.platformUserId;
      if (!existing.platformUserIdHash && socialMedia.platformUserIdHash) existing.platformUserIdHash = socialMedia.platformUserIdHash;
      if (!existing.description && socialMedia.description) existing.description = socialMedia.description;
      if (!existing.url && socialMedia.url) existing.url = socialMedia.url;
      if (existing.followers === undefined && socialMedia.followers !== undefined) existing.followers = socialMedia.followers;
      if (existing.following === undefined && socialMedia.following !== undefined) existing.following = socialMedia.following;
      if (existing.posts === undefined && socialMedia.posts !== undefined) existing.posts = socialMedia.posts;
      if (!existing.lastUpdated && socialMedia.lastUpdated) existing.lastUpdated = socialMedia.lastUpdated;
      if (!existing.lastDownloaded && socialMedia.lastDownloaded) existing.lastDownloaded = socialMedia.lastDownloaded;
      if (!existing.lastDownloadedNode && socialMedia.lastDownloadedNode) existing.lastDownloadedNode = socialMedia.lastDownloadedNode;
  }
}


  private getUserIdFromUrl(url : string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }
  private getPlatformFromUrl(url: string): string {
    try {
        const hostname = new URL(url).hostname; // Extracts domain (e.g., 'youtube.com')
        const parts = hostname.replace("www.", "").split('.'); // Remove 'www.' and split
        
        return parts.length > 2 ? parts[1] : parts[0]; // Handles both 'xxx.tttt.com' and 'youtube.com'
    } catch (error) {
        console.error("Invalid URL:", url);
        return "unknown"; // Handle invalid URLs
    }
}


  private async updatePerson(person: PersonEntity, existing: PersonEntity): Promise<PersonEntity> {
    if (existing.description !== person.description) {
        existing.description = (existing.description ?? '') + person.description;
    }
    existing.updatedAt = new Date();
    process.stdout.write(`Updated Person: ${JSON.stringify(existing)} \n`);
    return existing;
  }

  private createPersonEntity(name: string, ownerId: string, owner: any, description: string = ''): PersonEntity {
      const person = new PersonEntity();
      person.name = String(name ?? '').trim();
      person.ownerId = ownerId;
      person.owner = owner;
      person.thumbnailPath = '';
      person.isHidden = false;
      person.faceAssetId = null;
      person.height = null;
      person.age = null;
      person.birthDate = null;
      person.createdAt = new Date();
      person.updatedAt = new Date();
      person.description = description;
      person.faces = [];
      process.stdout.write(`Created Person: ${JSON.stringify(person)} \n`);
      return person;
}

  private async processPerson(tags: ImmichTags, asset: AssetEntity): Promise<void> {
    process.stdout.write("---------------------------- Processing People ---------------------------------\n");
      
      const people = new Map<string, PersonEntity>();
      
      // Process Main User & Owner
      if (tags.UserName !== tags.OwnerID) {
          const ownerName = tags.OwnerName || tags.OwnerID;
          process.stdout.write(`Owner Name : ${ownerName}` + "\n");
          process.stdout.write('Owner ID : ' + tags.OwnerID+"\n");
          people.set(tags.OwnerID ?? '', this.createPersonEntity(ownerName ?? '', asset.ownerId, asset.owner));
      }
      
      const userName = tags.UserFullName || tags.UserName;
      process.stdout.write('Main User : ' + String(userName)+"\n");
      process.stdout.write('Main User Name : ' + tags.UserName+"\n");
      const mainUser = this.createPersonEntity(String(userName ?? ''), asset.ownerId, asset.owner, tags.SelfData);
      people.set(String(tags.UserName ?? ''), mainUser);
      
      // Process Lists: RelatedProfiles, Coauthors, TaggedPeople, Biography Mentions
      const listsToProcess = [
          { list: tags.RelatedProfiles, key: "full_name", fallbackKey: "username" },
          { list: tags.Coauthors, key: "FullName",fallbackKey: "TaggedUserName" },
          { list: tags.TaggedPeople, key: "FullName",fallbackKey: "TaggedUserName" },
          { list: tags.BiographyWithEntities?.mentions, key: "" ,fallbackKey: "" },
      ];
      
      for (const { list, key, fallbackKey } of listsToProcess) {
          if (list) {
              list.forEach(async (entry) => {
                  const name = key && fallbackKey ? (entry as any)?.[key] || (entry as any)?.[fallbackKey] || '' : entry;
                  if (!name) return;
                  
                  process.stdout.write('Name : ' + name+"\n");
                  process.stdout.write('Key : ' + (entry as any)?.[key]+"\n");
                  process.stdout.write('Fallback Key : ' + (entry as any)?.[fallbackKey]+"\n");

                  const person = this.createPersonEntity(name, asset.ownerId, asset.owner);
                  
                  if (people.has((entry as any)?.[fallbackKey])) {
                      this.updatePerson(person, people.get((entry as any)?.[fallbackKey])!);
                  } else {
                      people.set((entry as any)?.[fallbackKey], person);
                  }
              });
          }
      }
  }


  @OnJob({ name: JobName.METADATA_EXTRACTION, queue: QueueName.METADATA_EXTRACTION })
  async handleMetadataExtraction(data: JobOf<JobName.METADATA_EXTRACTION>): Promise<JobStatus> {
    const { metadata, reverseGeocoding } = await this.getConfig({ withCache: true });
    const [asset] = await this.assetRepository.getByIds([data.id], { faces: { person: false } });
    if (!asset) {
      return JobStatus.FAILED;
    }
       
    const stats = await this.storageRepository.stat(asset.originalPath);

    const exifTagsData = await this.getExifTags(asset);

    //read json sidecar tags
    const sidecarJsonTags = await this.getExifJsonTags(asset);
  
    
    //compare the contents of the two tags and use the one with more data and merge them
    const customMerge = (objValue: any, srcValue: any) => {
      if (Array.isArray(objValue) && Array.isArray(srcValue)) {
        return Array.from(new Set([...objValue, ...srcValue])); // Merge & remove duplicates
      }
      return objValue !== undefined ? objValue : srcValue; // Exif wins for other values
    };
    
    const exifTags = mergeWith({}, exifTagsData, sidecarJsonTags, customMerge);
    
    
    console.log('Exif Tags --------------------------------------------');
    
    
    console.log('Exif Tags', exifTags);

    

    if (!asset.fileCreatedAt) {
      asset.fileCreatedAt = stats.mtime;
    }

    if (!asset.fileModifiedAt) {
      asset.fileModifiedAt = stats.mtime;
    }

    const { dateTimeOriginal, localDateTime, timeZone, modifyDate } = this.getDates(asset, exifTags);
    const { latitude, longitude, country, state, city } = await this.getGeo(exifTags, reverseGeocoding);

    const { width, height } = this.getImageDimensions(exifTags);

    const exifData: Insertable<Exif> = {
      assetId: asset.id,

      // dates
      dateTimeOriginal,
      modifyDate,
      timeZone,

      // gps
      latitude,
      longitude,
      country,
      state,
      city,

      // image/file
      fileSizeInByte: stats.size,
      exifImageHeight: validate(height),
      exifImageWidth: validate(width),
      orientation: validate(exifTags.Orientation)?.toString() ?? null,
      projectionType: exifTags.ProjectionType ? String(exifTags.ProjectionType).toUpperCase() : null,
      bitsPerSample: this.getBitsPerSample(exifTags),
      colorspace: exifTags.ColorSpace ?? null,

      // camera
      make: exifTags.Make ?? null,
      model: exifTags.Model ?? null,
      fps: validate(Number.parseFloat(exifTags.VideoFrameRate!)),
      iso: validate(exifTags.ISO) as number,
      exposureTime: exifTags.ExposureTime ?? null,
      lensModel: exifTags.LensModel ?? null,
      fNumber: validate(exifTags.FNumber),
      focalLength: validate(exifTags.FocalLength),

      // comments
      description: String(exifTags.ImageDescription || exifTags.Description || '').trim(),
      profileDescription: exifTags.ProfileDescription || null,
      rating: validateRange(exifTags.Rating, -1, 5),

      // grouping
      livePhotoCID: (exifTags.ContentIdentifier || exifTags.MediaGroupUUID) ?? null,
      autoStackId: this.getAutoStackId(exifTags),
    };

    this.processPerson(exifTags, asset);
    this.processSocialMedia(exifTags, asset);

    await this.applyTagList(asset, exifTags);
    await this.applyMotionPhotos(asset, exifTags);

    await this.assetRepository.upsertExif(exifData);

    await this.assetRepository.update({
      id: asset.id,
      duration: exifTags.Duration?.toString() ?? null,
      localDateTime,
      fileCreatedAt: exifData.dateTimeOriginal ?? undefined,
      fileModifiedAt: stats.mtime,
    });

    if (exifData.livePhotoCID) {
      await this.linkLivePhotos(asset, exifData);
    }

    if (isFaceImportEnabled(metadata)) {
      await this.applyTaggedFaces(asset, exifTags);
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.QUEUE_SIDECAR, queue: QueueName.SIDECAR })
  async handleQueueSidecar(job: JobOf<JobName.QUEUE_SIDECAR>): Promise<JobStatus> {
    const { force } = job;
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.SIDECAR);
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({
          name: force ? JobName.SIDECAR_SYNC : JobName.SIDECAR_DISCOVERY,
          data: { id: asset.id },
        })),
      );
    }

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SIDECAR_SYNC, queue: QueueName.SIDECAR })
  handleSidecarSync({ id }: JobOf<JobName.SIDECAR_SYNC>): Promise<JobStatus> {
    return this.processSidecar(id, true);
  }

  @OnJob({ name: JobName.SIDECAR_DISCOVERY, queue: QueueName.SIDECAR })
  handleSidecarDiscovery({ id }: JobOf<JobName.SIDECAR_DISCOVERY>): Promise<JobStatus> {
    return this.processSidecar(id, false);
  }

  @OnEvent({ name: 'asset.tag' })
  async handleTagAsset({ assetId }: ArgOf<'asset.tag'>) {
    await this.jobRepository.queue({ name: JobName.SIDECAR_WRITE, data: { id: assetId, tags: true } });
  }

  @OnEvent({ name: 'asset.untag' })
  async handleUntagAsset({ assetId }: ArgOf<'asset.untag'>) {
    await this.jobRepository.queue({ name: JobName.SIDECAR_WRITE, data: { id: assetId, tags: true } });
  }

  @OnJob({ name: JobName.SIDECAR_WRITE, queue: QueueName.SIDECAR })
  async handleSidecarWrite(job: JobOf<JobName.SIDECAR_WRITE>): Promise<JobStatus> {
    const { id, description, dateTimeOriginal, latitude, longitude, rating, tags } = job;
    const [asset] = await this.assetRepository.getByIds([id], { tags: true });
    if (!asset) {
      return JobStatus.FAILED;
    }

    const tagsList = (asset.tags || []).map((tag) => tag.value);

    const sidecarPath = asset.sidecarPath || `${asset.originalPath}.xmp`;
    const exif = _.omitBy(
      <Tags>{
        Description: description,
        ImageDescription: description,
        DateTimeOriginal: dateTimeOriginal,
        GPSLatitude: latitude,
        GPSLongitude: longitude,
        Rating: rating,
        TagsList: tags ? tagsList : undefined,
      },
      _.isUndefined,
    );

    if (Object.keys(exif).length === 0) {
      return JobStatus.SKIPPED;
    }

    await this.metadataRepository.writeTags(sidecarPath, exif);

    if (!asset.sidecarPath) {
      await this.assetRepository.update({ id, sidecarPath });
    }

    return JobStatus.SUCCESS;
  }

  private getImageDimensions(exifTags: ImmichTags): { width?: number; height?: number } {
    /*
     * The "true" values for width and height are a bit hidden, depending on the camera model and file format.
     * For RAW images in the CR2 or RAF format, the "ImageSize" value seems to be correct,
     * but ImageWidth and ImageHeight are not correct (they contain the dimensions of the preview image).
     */
    let [width, height] = exifTags.ImageSize?.split('x').map((dim) => Number.parseInt(dim) || undefined) || [];
    if (!width || !height) {
      [width, height] = [exifTags.ImageWidth, exifTags.ImageHeight];
    }
    return { width, height };
  }

  
  // Function to read and parse a JSON file
  private async readJsonFile<T = unknown>(path: string): Promise<T | null> {
    try {
      const data = await fs.readFile(path, 'utf-8');

      if (!data.trim()) {
        console.warn(`Warning: JSON file at "${path}" is empty.`);
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(
        `Error reading JSON file at "${path}": ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  private async getExifJsonTags(asset: AssetEntity): Promise<ImmichTags> {

    // Read the JSON file
    const jsonFile = asset.originalPath + '.json';
    console.log('jsonFile : ',jsonFile);
    const jsonData = await this.readJsonFile<JsonData>(jsonFile);
    if (!jsonData) {
      return {};
    }
    else
    {
      console.log('jsonData : ',jsonData);
    }

    return this.ExifFromJsonTag(jsonData);
  }



  
  
  private async getExifTags(asset: AssetEntity): Promise<ImmichTags> {
    const mediaTags = await this.metadataRepository.readTags(asset.originalPath);
    const sidecarTags = asset.sidecarPath ? await this.metadataRepository.readTags(asset.sidecarPath) : {};
    const videoTags = asset.type === AssetType.VIDEO ? await this.getVideoTags(asset.originalPath) : {};


    // prefer dates from sidecar tags
    const sidecarDate = firstDateTime(sidecarTags as Tags, EXIF_DATE_TAGS);
    if (sidecarDate) {
      for (const tag of EXIF_DATE_TAGS) {
        delete mediaTags[tag];
      }
    }

    // prefer duration from video tags
    delete mediaTags.Duration;
    delete sidecarTags.Duration;

    return { ...mediaTags, ...videoTags, ...sidecarTags };
  }

  private async applyTagList(asset: AssetEntity, exifTags: ImmichTags) {
    const tags: string[] = [];
    if (exifTags.TagsList) {
      tags.push(...exifTags.TagsList.map(String));
    } else if (exifTags.HierarchicalSubject) {
      tags.push(
        ...exifTags.HierarchicalSubject.map((tag) =>
          String(tag)
            // convert | to /
            .replaceAll('/', '<PLACEHOLDER>')
            .replaceAll('|', '/')
            .replaceAll('<PLACEHOLDER>', '|'),
        ),
      );
    } else if (exifTags.Keywords) {
      let keywords = exifTags.Keywords;
      if (!Array.isArray(keywords)) {
        keywords = [keywords];
      }
      tags.push(...keywords.map(String));
    }

    const results = await upsertTags(this.tagRepository, { userId: asset.ownerId, tags });
    await this.tagRepository.upsertAssetTags({ assetId: asset.id, tagIds: results.map((tag) => tag.id) });

    //TODO generate albums from paths
    
  }

  private async applyMotionPhotos(asset: AssetEntity, tags: ImmichTags) {
    if (asset.type !== AssetType.IMAGE) {
      return;
    }

    const isMotionPhoto = tags.MotionPhoto;
    const isMicroVideo = tags.MicroVideo;
    const videoOffset = tags.MicroVideoOffset;
    const hasMotionPhotoVideo = tags.MotionPhotoVideo;
    const hasEmbeddedVideoFile = tags.EmbeddedVideoType === 'MotionPhoto_Data' && tags.EmbeddedVideoFile;
    const directory = Array.isArray(tags.ContainerDirectory)
      ? (tags.ContainerDirectory as ContainerDirectoryItem[])
      : null;

    let length = 0;
    let padding = 0;

    if (isMotionPhoto && directory) {
      for (const entry of directory) {
        if (entry?.Item?.Semantic == 'MotionPhoto') {
          length = entry.Item.Length ?? 0;
          padding = entry.Item.Padding ?? 0;
          break;
        }
      }
    }

    if (isMicroVideo && typeof videoOffset === 'number') {
      length = videoOffset;
    }

    if (!length && !hasEmbeddedVideoFile && !hasMotionPhotoVideo) {
      return;
    }

    this.logger.debug(`Starting motion photo video extraction for asset ${asset.id}: ${asset.originalPath}`);

    try {
      const stat = await this.storageRepository.stat(asset.originalPath);
      const position = stat.size - length - padding;
      let video: Buffer;
      // Samsung MotionPhoto video extraction
      //     HEIC-encoded
      if (hasMotionPhotoVideo) {
        video = await this.metadataRepository.extractBinaryTag(asset.originalPath, 'MotionPhotoVideo');
      }
      //     JPEG-encoded; HEIC also contains these tags, so this conditional must come second
      else if (hasEmbeddedVideoFile) {
        video = await this.metadataRepository.extractBinaryTag(asset.originalPath, 'EmbeddedVideoFile');
      }
      // Default video extraction
      else {
        video = await this.storageRepository.readFile(asset.originalPath, {
          buffer: Buffer.alloc(length),
          position,
          length,
        });
      }
      const checksum = this.cryptoRepository.hashSha1(video);

      let motionAsset = await this.assetRepository.getByChecksum({
        ownerId: asset.ownerId,
        libraryId: asset.libraryId ?? undefined,
        checksum,
      });
      if (motionAsset) {
        this.logger.debug(
          `Motion photo video with checksum ${checksum.toString(
            'base64',
          )} already exists in the repository for asset ${asset.id}: ${asset.originalPath}`,
        );

        // Hide the motion photo video asset if it's not already hidden to prepare for linking
        if (motionAsset.isVisible) {
          await this.assetRepository.update({ id: motionAsset.id, isVisible: false });
          this.logger.log(`Hid unlinked motion photo video asset (${motionAsset.id})`);
        }
      } else {
        const motionAssetId = this.cryptoRepository.randomUUID();
        const dates = this.getDates(asset, tags);
        motionAsset = await this.assetRepository.create({
          id: motionAssetId,
          libraryId: asset.libraryId,
          type: AssetType.VIDEO,
          fileCreatedAt: dates.dateTimeOriginal,
          fileModifiedAt: dates.modifyDate,
          localDateTime: dates.localDateTime,
          checksum,
          ownerId: asset.ownerId,
          originalPath: StorageCore.getAndroidMotionPath(asset, motionAssetId),
          originalFileName: `${path.parse(asset.originalFileName).name}.mp4`,
          isVisible: false,
          deviceAssetId: 'NONE',
          deviceId: 'NONE',
        });

        if (!asset.isExternal) {
          await this.userRepository.updateUsage(asset.ownerId, video.byteLength);
        }
      }

      if (asset.livePhotoVideoId !== motionAsset.id) {
        await this.assetRepository.update({ id: asset.id, livePhotoVideoId: motionAsset.id });

        // If the asset already had an associated livePhotoVideo, delete it, because
        // its checksum doesn't match the checksum of the motionAsset we just extracted
        // (if it did, getByChecksum() would've returned a motionAsset with the same ID as livePhotoVideoId)
        // note asset.livePhotoVideoId is not motionAsset.id yet
        if (asset.livePhotoVideoId) {
          await this.jobRepository.queue({
            name: JobName.ASSET_DELETION,
            data: { id: asset.livePhotoVideoId, deleteOnDisk: true },
          });
          this.logger.log(`Removed old motion photo video asset (${asset.livePhotoVideoId})`);
        }
      }

      // write extracted motion video to disk, especially if the encoded-video folder has been deleted
      const existsOnDisk = await this.storageRepository.checkFileExists(motionAsset.originalPath);
      if (!existsOnDisk) {
        this.storageCore.ensureFolders(motionAsset.originalPath);
        await this.storageRepository.createFile(motionAsset.originalPath, video);
        this.logger.log(`Wrote motion photo video to ${motionAsset.originalPath}`);
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: motionAsset.id } });
      }

      this.logger.debug(`Finished motion photo video extraction for asset ${asset.id}: ${asset.originalPath}`);
    } catch (error: Error | any) {
      this.logger.error(
        `Failed to extract motion video for ${asset.id}: ${asset.originalPath}: ${error}`,
        error?.stack,
      );
    }
  }

  private async applyTaggedFaces(asset: AssetEntity, tags: ImmichTags) {
    if (!tags.RegionInfo?.AppliedToDimensions || tags.RegionInfo.RegionList.length === 0) {
      return;
    }

    const facesToAdd: (Partial<AssetFaceEntity> & { assetId: string })[] = [];
    const existingNames = await this.personRepository.getDistinctNames(asset.ownerId, { withHidden: true });
    const existingNameMap = new Map(existingNames.map(({ id, name }) => [name.toLowerCase(), id]));
    const missing: (Partial<PersonEntity> & { ownerId: string })[] = [];
    const missingWithFaceAsset: { id: string; ownerId: string; faceAssetId: string }[] = [];
    for (const region of tags.RegionInfo.RegionList) {
      if (!region.Name) {
        continue;
      }

      const imageWidth = tags.RegionInfo.AppliedToDimensions.W;
      const imageHeight = tags.RegionInfo.AppliedToDimensions.H;
      const loweredName = region.Name.toLowerCase();
      const personId = existingNameMap.get(loweredName) || this.cryptoRepository.randomUUID();

      const face = {
        id: this.cryptoRepository.randomUUID(),
        personId,
        assetId: asset.id,
        imageWidth,
        imageHeight,
        boundingBoxX1: Math.floor((region.Area.X - region.Area.W / 2) * imageWidth),
        boundingBoxY1: Math.floor((region.Area.Y - region.Area.H / 2) * imageHeight),
        boundingBoxX2: Math.floor((region.Area.X + region.Area.W / 2) * imageWidth),
        boundingBoxY2: Math.floor((region.Area.Y + region.Area.H / 2) * imageHeight),
        sourceType: SourceType.EXIF,
      };

      facesToAdd.push(face);
      if (!existingNameMap.has(loweredName)) {
        missing.push({ id: personId, ownerId: asset.ownerId, name: region.Name });
        missingWithFaceAsset.push({ id: personId, ownerId: asset.ownerId, faceAssetId: face.id });
      }
    }

    if (missing.length > 0) {
      this.logger.debug(`Creating missing persons: ${missing.map((p) => `${p.name}/${p.id}`)}`);
      const newPersonIds = await this.personRepository.createAll(missing);
      const jobs = newPersonIds.map((id) => ({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id } }) as const);
      await this.jobRepository.queueAll(jobs);
    }

    const facesToRemove = asset.faces.filter((face) => face.sourceType === SourceType.EXIF).map((face) => face.id);
    if (facesToRemove.length > 0) {
      this.logger.debug(`Removing ${facesToRemove.length} faces for asset ${asset.id}: ${asset.originalPath}`);
    }

    if (facesToAdd.length > 0) {
      this.logger.debug(
        `Creating ${facesToAdd.length} faces from metadata for asset ${asset.id}: ${asset.originalPath}`,
      );
    }

    if (facesToRemove.length > 0 || facesToAdd.length > 0) {
      await this.personRepository.refreshFaces(facesToAdd, facesToRemove);
    }

    if (missingWithFaceAsset.length > 0) {
      await this.personRepository.updateAll(missingWithFaceAsset);
    }
  }

  private getDates(asset: AssetEntity, exifTags: ImmichTags) {
    const dateTime = firstDateTime(exifTags as Maybe<Tags>, EXIF_DATE_TAGS);
    this.logger.verbose(`Date and time is ${dateTime} for asset ${asset.id}: ${asset.originalPath}`);

    // timezone
    let timeZone = exifTags.tz ?? null;
    if (timeZone == null && dateTime?.rawValue?.endsWith('+00:00')) {
      // exiftool-vendored returns "no timezone" information even though "+00:00" might be set explicitly
      // https://github.com/photostructure/exiftool-vendored.js/issues/203
      timeZone = 'UTC+0';
    }

    if (timeZone) {
      this.logger.verbose(
        `Found timezone ${timeZone} via ${exifTags.tzSource} for asset ${asset.id}: ${asset.originalPath}`,
      );
    } else {
      this.logger.debug(`No timezone information found for asset ${asset.id}: ${asset.originalPath}`);
    }

    let dateTimeOriginal = dateTime?.toDate();
    let localDateTime = dateTime?.toDateTime().setZone('UTC', { keepLocalTime: true }).toJSDate();
    if (!localDateTime || !dateTimeOriginal) {
      this.logger.debug(
        `No exif date time found, falling back on earliest of file creation and modification for assset ${asset.id}: ${asset.originalPath}`,
      );
      const earliestDate = this.earliestDate(asset.fileModifiedAt, asset.fileCreatedAt);
      dateTimeOriginal = earliestDate;
      localDateTime = earliestDate;
    }

    this.logger.verbose(
      `Found local date time ${localDateTime.toISOString()} for asset ${asset.id}: ${asset.originalPath}`,
    );

    let modifyDate = asset.fileModifiedAt;
    try {
      modifyDate = (exifTags.ModifyDate as ExifDateTime)?.toDate() ?? modifyDate;
    } catch {}

    return {
      dateTimeOriginal,
      timeZone,
      localDateTime,
      modifyDate,
    };
  }

  private earliestDate(a: Date, b: Date) {
    return new Date(Math.min(a.valueOf(), b.valueOf()));
  }

  private async getGeo(tags: ImmichTags, reverseGeocoding: SystemConfig['reverseGeocoding']) {
    let latitude = validate(tags.GPSLatitude);
    let longitude = validate(tags.GPSLongitude);

    // TODO take ref into account

    if (latitude === 0 && longitude === 0) {
      this.logger.debug('Latitude and longitude of 0, setting to null');
      latitude = null;
      longitude = null;
    }

    let result: ReverseGeocodeResult = { country: null, state: null, city: null };
    if (reverseGeocoding.enabled && longitude && latitude) {
      result = await this.mapRepository.reverseGeocode({ latitude, longitude });
    }

    return { ...result, latitude, longitude };
  }

  private getAutoStackId(tags: ImmichTags | null): string | null {
    if (!tags) {
      return null;
    }
    return tags.BurstID ?? tags.BurstUUID ?? tags.CameraBurstID ?? tags.MediaUniqueID ?? null;
  }

  private getBitsPerSample(tags: ImmichTags): number | null {
    const bitDepthTags = [
      tags.BitsPerSample,
      tags.ComponentBitDepth,
      tags.ImagePixelDepth,
      tags.BitDepth,
      tags.ColorBitDepth,
      // `numericTags` doesn't parse values like '12 12 12'
    ].map((tag) => (typeof tag === 'string' ? Number.parseInt(tag) : tag));

    let bitsPerSample = bitDepthTags.find((tag) => typeof tag === 'number' && !Number.isNaN(tag)) ?? null;
    if (bitsPerSample && bitsPerSample >= 24 && bitsPerSample % 3 === 0) {
      bitsPerSample /= 3; // converts per-pixel bit depth to per-channel
    }

    return bitsPerSample;
  }

  private async getVideoTags(originalPath: string) {
    const { videoStreams, format } = await this.mediaRepository.probe(originalPath);

    const tags: Pick<ImmichTags, 'Duration' | 'Orientation'> = {};

    if (videoStreams[0]) {
      switch (videoStreams[0].rotation) {
        case -90: {
          tags.Orientation = ExifOrientation.Rotate90CW;
          break;
        }
        case 0: {
          tags.Orientation = ExifOrientation.Horizontal;
          break;
        }
        case 90: {
          tags.Orientation = ExifOrientation.Rotate270CW;
          break;
        }
        case 180: {
          tags.Orientation = ExifOrientation.Rotate180;
          break;
        }
      }
    }

    if (format.duration) {
      tags.Duration = Duration.fromObject({ seconds: format.duration }).toFormat('hh:mm:ss.SSS');
    }

    return tags;
  }

  private async processSidecar(id: string, isSync: boolean): Promise<JobStatus> {
    const [asset] = await this.assetRepository.getByIds([id]);

    if (!asset) {
      return JobStatus.FAILED;
    }

    if (isSync && !asset.sidecarPath) {
      return JobStatus.FAILED;
    }

    if (!isSync && (!asset.isVisible || asset.sidecarPath) && !asset.isExternal) {
      return JobStatus.FAILED;
    }

    // XMP sidecars can come in two filename formats. For a photo named photo.ext, the filenames are photo.ext.xmp and photo.xmp
    const assetPath = path.parse(asset.originalPath);
    const assetPathWithoutExt = path.join(assetPath.dir, assetPath.name);
    const sidecarPathWithoutExt = `${assetPathWithoutExt}.xmp`;
    const sidecarPathWithExt = `${asset.originalPath}.xmp`;

    const [sidecarPathWithExtExists, sidecarPathWithoutExtExists] = await Promise.all([
      this.storageRepository.checkFileExists(sidecarPathWithExt, constants.R_OK),
      this.storageRepository.checkFileExists(sidecarPathWithoutExt, constants.R_OK),
    ]);

    let sidecarPath = null;
    if (sidecarPathWithExtExists) {
      sidecarPath = sidecarPathWithExt;
    } else if (sidecarPathWithoutExtExists) {
      sidecarPath = sidecarPathWithoutExt;
    }

    if (asset.isExternal) {
      if (sidecarPath !== asset.sidecarPath) {
        await this.assetRepository.update({ id: asset.id, sidecarPath });
      }
      return JobStatus.SUCCESS;
    }

    if (sidecarPath) {
      this.logger.debug(`Detected sidecar at '${sidecarPath}' for asset ${asset.id}: ${asset.originalPath}`);
      await this.assetRepository.update({ id: asset.id, sidecarPath });
      return JobStatus.SUCCESS;
    }

    if (!isSync) {
      return JobStatus.FAILED;
    }

    this.logger.debug(`No sidecar found for asset ${asset.id}: ${asset.originalPath}`);
    await this.assetRepository.update({ id: asset.id, sidecarPath: null });

    return JobStatus.SUCCESS;
  }
}
