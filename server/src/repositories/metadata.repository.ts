import { Injectable } from '@nestjs/common';
import { BinaryField, DefaultReadTaskOptions, ExifTool, Tags } from 'exiftool-vendored';
import geotz from 'geo-tz';
import { LoggingRepository } from 'src/repositories/logging.repository';

interface ExifDuration {
  Value: number;
  Scale?: number;
}

type StringOrNumber = string | number;

type TagsWithWrongTypes =
  | 'FocalLength'
  | 'Duration'
  | 'Description'
  | 'ImageDescription'
  | 'RegionInfo'
  | 'TagsList'
  | 'Keywords'
  | 'HierarchicalSubject'
  | 'ISO'
  | 'TaggedUserName'
  | 'TaggedFullName';

export interface ImmichTags extends Omit<Tags, TagsWithWrongTypes> {
  ContentIdentifier?: string;
  MotionPhoto?: number;
  MotionPhotoVersion?: number;
  MotionPhotoPresentationTimestampUs?: number;
  MediaGroupUUID?: string;
  ImagePixelDepth?: string;
  FocalLength?: number;
  Duration?: number | string | ExifDuration;
  EmbeddedVideoType?: string;
  EmbeddedVideoFile?: BinaryField;
  MotionPhotoVideo?: BinaryField;
  TagsList?: StringOrNumber[];
  HierarchicalSubject?: StringOrNumber[];
  Keywords?: StringOrNumber | StringOrNumber[];
  ISO?: number | number[];
  TaggedUserName?: StringOrNumber | StringOrNumber[];
  TaggedFullName?: StringOrNumber;
  LocationUrl?: string;
  LocationId?: StringOrNumber;
  // Type is wrong, can also be number.
  Description?: StringOrNumber;
  ImageDescription?: StringOrNumber;
  UserFullName?: StringOrNumber;
  UserName?: StringOrNumber;
  UserId?: StringOrNumber;
  Biography?: StringOrNumber;
  HighLightTitle?: StringOrNumber;
  ShortCode?: StringOrNumber;
  ExternalUrl?: string;
  Fbid?: StringOrNumber;
  SubCategorie?: string[];
  SocialMediaOwnerId?: StringOrNumber;
  // Type is wrong, can also be number.
  // Extended properties for image regions, such as faces
  RegionInfo?: {
    AppliedToDimensions: {
      W: number;
      H: number;
      Unit: string;
    };
    RegionList: {
      Area: {
        // (X,Y) // center of the rectangle
        X: number;
        Y: number;
        W: number;
        H: number;
        Unit: string;
      };
      Rotation?: number;
      Type?: string;
      Name?: string;
    }[];

    
  };
  // tagged people
  TaggedPeople?: {
    id?: string | number;
    TaggedUserName: string;
    FullName: string;
  }[];
  Coauthors?: {
    id?: string | number;
    TaggedUserName: string;
    FullName: string;
  }[];
  RelatedProfiles?: {
    id: string;
    full_name: string;
    is_private: boolean;
    is_verified: boolean;
    profile_pic_url?: string;
    username: string;
  }[];
  BiographyWithEntities?: {
    raw_text: string;
    mentions: string[]; // List of mentioned usernames
    hashtags: string[]; // List of hashtags
  };
  BioLinks?: {
    title: string;
    lynx_url: string;
    url?: string;  // Optional because it's missing in some entries
    link_type: string;
  }[];
  FbProfileBioLink?: {
    url: string;
    name: string;
  };
}

@Injectable()
export class MetadataRepository {
  private exiftool = new ExifTool({
    defaultVideosToUTC: true,
    backfillTimezones: true,
    inferTimezoneFromDatestamps: true,
    inferTimezoneFromTimeStamp: true,
    useMWG: true,
    numericTags: [...DefaultReadTaskOptions.numericTags, 'FocalLength'],
    /* eslint unicorn/no-array-callback-reference: off, unicorn/no-array-method-this-argument: off */
    geoTz: (lat, lon) => geotz.find(lat, lon)[0],
    // Enable exiftool LFS to parse metadata for files larger than 2GB.
    readArgs: ['-api', 'largefilesupport=1'],
    writeArgs: ['-api', 'largefilesupport=1', '-overwrite_original'],
  });

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MetadataRepository.name);
  }

  setMaxConcurrency(concurrency: number) {
    this.exiftool.batchCluster.setMaxProcs(concurrency);
  }

  async teardown() {
    await this.exiftool.end();
  }

  readTags(path: string): Promise<ImmichTags> {
    return this.exiftool.read(path).catch((error) => {
      this.logger.warn(`Error reading exif data (${path}): ${error}`, error?.stack);
      return {};
    }) as Promise<ImmichTags>;
  }

  extractBinaryTag(path: string, tagName: string): Promise<Buffer> {
    return this.exiftool.extractBinaryTagToBuffer(tagName, path);
  }

  async writeTags(path: string, tags: Partial<Tags>): Promise<void> {
    try {
      await this.exiftool.write(path, tags);
    } catch (error) {
      this.logger.warn(`Error writing exif data (${path}): ${error}`);
    }
  }
}
