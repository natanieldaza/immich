import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { DirectoryRepository } from 'src/repositories/directory.repository';
import { DownloadRepository } from 'src/repositories/download.repository';
import { DuplicateRepository } from 'src/repositories/duplicate.repository';
import { EmailRepository } from 'src/repositories/email.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { GeodataPlacesRepository } from 'src/repositories/geodata-places.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { MoveRepository } from 'src/repositories/move.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { OAuthRepository } from 'src/repositories/oauth.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRelationshipRepository } from 'src/repositories/person-relationship.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { SitesUrlRepository } from 'src/repositories/sites-url.repository';
import { SocialMediaRepository } from 'src/repositories/social-media.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { TrashRepository } from 'src/repositories/trash.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { ViewRepository } from 'src/repositories/view-repository';
import { WebDataScrappingRepository } from 'src/repositories/webdata-scrapping.repository';

export const repositories = [
  AccessRepository,
  ActivityRepository,
  AlbumRepository,
  AlbumUserRepository,
  AuditRepository,
  ApiKeyRepository,
  AssetRepository,
  AssetJobRepository,
  ConfigRepository,
  CronRepository,
  CryptoRepository,
  DatabaseRepository,
  DirectoryRepository,
  DownloadRepository,
  DuplicateRepository,
  EmailRepository,
  EventRepository,
  JobRepository,
  LibraryRepository,
  LoggingRepository,
  GeodataPlacesRepository,
  MachineLearningRepository,
  MapRepository,
  MediaRepository,
  MemoryRepository,
  MetadataRepository,
  MoveRepository,
  NotificationRepository,
  OAuthRepository,
  PartnerRepository,
  PersonRepository,
  PersonRelationshipRepository,
  ProcessRepository,
  SearchRepository,
  SessionRepository,
  ServerInfoRepository,
  SharedLinkRepository,
  SitesUrlRepository,
  SocialMediaRepository,
  StackRepository,
  StorageRepository,
  SyncRepository,
  SystemMetadataRepository,
  TagRepository,
  TelemetryRepository,
  TrashRepository,
  UserRepository,
  ViewRepository,
  VersionHistoryRepository,
  WebDataScrappingRepository,
];
