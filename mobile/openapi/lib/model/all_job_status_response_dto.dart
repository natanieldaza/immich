//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AllJobStatusResponseDto {
  /// Returns a new [AllJobStatusResponseDto] instance.
  AllJobStatusResponseDto({
    required this.backgroundTask,
    required this.backupDatabase,
    required this.duplicateDetection,
    required this.faceDetection,
    required this.facialRecognition,
    required this.galleryDownloaderPriorityQueue,
    required this.galleryDownloaderQueue,
    required this.library_,
    required this.locationDataScrappingWeb,
    required this.metadataExtraction,
    required this.migration,
    required this.notifications,
    required this.personDataScrapping,
    required this.personSidecar,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.socialMediaDataScrapping,
    required this.socialMediaDataScrappingWeb,
    required this.storageTemplateMigration,
    required this.thumbnailGeneration,
    required this.videoConversion,
  });

  JobStatusDto backgroundTask;

  JobStatusDto backupDatabase;

  JobStatusDto duplicateDetection;

  JobStatusDto faceDetection;

  JobStatusDto facialRecognition;

  JobStatusDto galleryDownloaderPriorityQueue;

  JobStatusDto galleryDownloaderQueue;

  JobStatusDto library_;

  JobStatusDto locationDataScrappingWeb;

  JobStatusDto metadataExtraction;

  JobStatusDto migration;

  JobStatusDto notifications;

  JobStatusDto personDataScrapping;

  JobStatusDto personSidecar;

  JobStatusDto search;

  JobStatusDto sidecar;

  JobStatusDto smartSearch;

  JobStatusDto socialMediaDataScrapping;

  JobStatusDto socialMediaDataScrappingWeb;

  JobStatusDto storageTemplateMigration;

  JobStatusDto thumbnailGeneration;

  JobStatusDto videoConversion;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AllJobStatusResponseDto &&
    other.backgroundTask == backgroundTask &&
    other.backupDatabase == backupDatabase &&
    other.duplicateDetection == duplicateDetection &&
    other.faceDetection == faceDetection &&
    other.facialRecognition == facialRecognition &&
    other.galleryDownloaderPriorityQueue == galleryDownloaderPriorityQueue &&
    other.galleryDownloaderQueue == galleryDownloaderQueue &&
    other.library_ == library_ &&
    other.locationDataScrappingWeb == locationDataScrappingWeb &&
    other.metadataExtraction == metadataExtraction &&
    other.migration == migration &&
    other.notifications == notifications &&
    other.personDataScrapping == personDataScrapping &&
    other.personSidecar == personSidecar &&
    other.search == search &&
    other.sidecar == sidecar &&
    other.smartSearch == smartSearch &&
    other.socialMediaDataScrapping == socialMediaDataScrapping &&
    other.socialMediaDataScrappingWeb == socialMediaDataScrappingWeb &&
    other.storageTemplateMigration == storageTemplateMigration &&
    other.thumbnailGeneration == thumbnailGeneration &&
    other.videoConversion == videoConversion;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backgroundTask.hashCode) +
    (backupDatabase.hashCode) +
    (duplicateDetection.hashCode) +
    (faceDetection.hashCode) +
    (facialRecognition.hashCode) +
    (galleryDownloaderPriorityQueue.hashCode) +
    (galleryDownloaderQueue.hashCode) +
    (library_.hashCode) +
    (locationDataScrappingWeb.hashCode) +
    (metadataExtraction.hashCode) +
    (migration.hashCode) +
    (notifications.hashCode) +
    (personDataScrapping.hashCode) +
    (personSidecar.hashCode) +
    (search.hashCode) +
    (sidecar.hashCode) +
    (smartSearch.hashCode) +
    (socialMediaDataScrapping.hashCode) +
    (socialMediaDataScrappingWeb.hashCode) +
    (storageTemplateMigration.hashCode) +
    (thumbnailGeneration.hashCode) +
    (videoConversion.hashCode);

  @override
  String toString() => 'AllJobStatusResponseDto[backgroundTask=$backgroundTask, backupDatabase=$backupDatabase, duplicateDetection=$duplicateDetection, faceDetection=$faceDetection, facialRecognition=$facialRecognition, galleryDownloaderPriorityQueue=$galleryDownloaderPriorityQueue, galleryDownloaderQueue=$galleryDownloaderQueue, library_=$library_, locationDataScrappingWeb=$locationDataScrappingWeb, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, personDataScrapping=$personDataScrapping, personSidecar=$personSidecar, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, socialMediaDataScrapping=$socialMediaDataScrapping, socialMediaDataScrappingWeb=$socialMediaDataScrappingWeb, storageTemplateMigration=$storageTemplateMigration, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backgroundTask'] = this.backgroundTask;
      json[r'backupDatabase'] = this.backupDatabase;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'faceDetection'] = this.faceDetection;
      json[r'facialRecognition'] = this.facialRecognition;
      json[r'galleryDownloaderPriorityQueue'] = this.galleryDownloaderPriorityQueue;
      json[r'galleryDownloaderQueue'] = this.galleryDownloaderQueue;
      json[r'library'] = this.library_;
      json[r'locationDataScrappingWeb'] = this.locationDataScrappingWeb;
      json[r'metadataExtraction'] = this.metadataExtraction;
      json[r'migration'] = this.migration;
      json[r'notifications'] = this.notifications;
      json[r'personDataScrapping'] = this.personDataScrapping;
      json[r'personSidecar'] = this.personSidecar;
      json[r'search'] = this.search;
      json[r'sidecar'] = this.sidecar;
      json[r'smartSearch'] = this.smartSearch;
      json[r'socialMediaDataScrapping'] = this.socialMediaDataScrapping;
      json[r'socialMediaDataScrappingWeb'] = this.socialMediaDataScrappingWeb;
      json[r'storageTemplateMigration'] = this.storageTemplateMigration;
      json[r'thumbnailGeneration'] = this.thumbnailGeneration;
      json[r'videoConversion'] = this.videoConversion;
    return json;
  }

  /// Returns a new [AllJobStatusResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AllJobStatusResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AllJobStatusResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AllJobStatusResponseDto(
        backgroundTask: JobStatusDto.fromJson(json[r'backgroundTask'])!,
        backupDatabase: JobStatusDto.fromJson(json[r'backupDatabase'])!,
        duplicateDetection: JobStatusDto.fromJson(json[r'duplicateDetection'])!,
        faceDetection: JobStatusDto.fromJson(json[r'faceDetection'])!,
        facialRecognition: JobStatusDto.fromJson(json[r'facialRecognition'])!,
        galleryDownloaderPriorityQueue: JobStatusDto.fromJson(json[r'galleryDownloaderPriorityQueue'])!,
        galleryDownloaderQueue: JobStatusDto.fromJson(json[r'galleryDownloaderQueue'])!,
        library_: JobStatusDto.fromJson(json[r'library'])!,
        locationDataScrappingWeb: JobStatusDto.fromJson(json[r'locationDataScrappingWeb'])!,
        metadataExtraction: JobStatusDto.fromJson(json[r'metadataExtraction'])!,
        migration: JobStatusDto.fromJson(json[r'migration'])!,
        notifications: JobStatusDto.fromJson(json[r'notifications'])!,
        personDataScrapping: JobStatusDto.fromJson(json[r'personDataScrapping'])!,
        personSidecar: JobStatusDto.fromJson(json[r'personSidecar'])!,
        search: JobStatusDto.fromJson(json[r'search'])!,
        sidecar: JobStatusDto.fromJson(json[r'sidecar'])!,
        smartSearch: JobStatusDto.fromJson(json[r'smartSearch'])!,
        socialMediaDataScrapping: JobStatusDto.fromJson(json[r'socialMediaDataScrapping'])!,
        socialMediaDataScrappingWeb: JobStatusDto.fromJson(json[r'socialMediaDataScrappingWeb'])!,
        storageTemplateMigration: JobStatusDto.fromJson(json[r'storageTemplateMigration'])!,
        thumbnailGeneration: JobStatusDto.fromJson(json[r'thumbnailGeneration'])!,
        videoConversion: JobStatusDto.fromJson(json[r'videoConversion'])!,
      );
    }
    return null;
  }

  static List<AllJobStatusResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AllJobStatusResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AllJobStatusResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AllJobStatusResponseDto> mapFromJson(dynamic json) {
    final map = <String, AllJobStatusResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AllJobStatusResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AllJobStatusResponseDto-objects as value to a dart map
  static Map<String, List<AllJobStatusResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AllJobStatusResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AllJobStatusResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backgroundTask',
    'backupDatabase',
    'duplicateDetection',
    'faceDetection',
    'facialRecognition',
    'galleryDownloaderPriorityQueue',
    'galleryDownloaderQueue',
    'library',
    'locationDataScrappingWeb',
    'metadataExtraction',
    'migration',
    'notifications',
    'personDataScrapping',
    'personSidecar',
    'search',
    'sidecar',
    'smartSearch',
    'socialMediaDataScrapping',
    'socialMediaDataScrappingWeb',
    'storageTemplateMigration',
    'thumbnailGeneration',
    'videoConversion',
  };
}

