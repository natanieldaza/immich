//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SocialMediaResponseDto {
  /// Returns a new [SocialMediaResponseDto] instance.
  SocialMediaResponseDto({
    this.description,
    this.followers,
    this.following,
    required this.id,
    this.lastDownloaded,
    this.lastDownloadedNode,
    this.name,
    this.personId,
    required this.platform,
    required this.platformUserId,
    this.platformUserIdHash,
    this.posts,
    this.thumbnailPath,
    this.updatedAt,
    required this.url,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? followers;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? following;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? lastDownloaded;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? lastDownloadedNode;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? personId;

  String platform;

  String platformUserId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? platformUserIdHash;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? posts;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? thumbnailPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedAt;

  String url;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SocialMediaResponseDto &&
    other.description == description &&
    other.followers == followers &&
    other.following == following &&
    other.id == id &&
    other.lastDownloaded == lastDownloaded &&
    other.lastDownloadedNode == lastDownloadedNode &&
    other.name == name &&
    other.personId == personId &&
    other.platform == platform &&
    other.platformUserId == platformUserId &&
    other.platformUserIdHash == platformUserIdHash &&
    other.posts == posts &&
    other.thumbnailPath == thumbnailPath &&
    other.updatedAt == updatedAt &&
    other.url == url;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (followers == null ? 0 : followers!.hashCode) +
    (following == null ? 0 : following!.hashCode) +
    (id.hashCode) +
    (lastDownloaded == null ? 0 : lastDownloaded!.hashCode) +
    (lastDownloadedNode == null ? 0 : lastDownloadedNode!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (personId == null ? 0 : personId!.hashCode) +
    (platform.hashCode) +
    (platformUserId.hashCode) +
    (platformUserIdHash == null ? 0 : platformUserIdHash!.hashCode) +
    (posts == null ? 0 : posts!.hashCode) +
    (thumbnailPath == null ? 0 : thumbnailPath!.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode) +
    (url.hashCode);

  @override
  String toString() => 'SocialMediaResponseDto[description=$description, followers=$followers, following=$following, id=$id, lastDownloaded=$lastDownloaded, lastDownloadedNode=$lastDownloadedNode, name=$name, personId=$personId, platform=$platform, platformUserId=$platformUserId, platformUserIdHash=$platformUserIdHash, posts=$posts, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt, url=$url]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.followers != null) {
      json[r'followers'] = this.followers;
    } else {
    //  json[r'followers'] = null;
    }
    if (this.following != null) {
      json[r'following'] = this.following;
    } else {
    //  json[r'following'] = null;
    }
      json[r'id'] = this.id;
    if (this.lastDownloaded != null) {
      json[r'lastDownloaded'] = _dateFormatter.format(this.lastDownloaded!.toUtc());
    } else {
    //  json[r'lastDownloaded'] = null;
    }
    if (this.lastDownloadedNode != null) {
      json[r'lastDownloadedNode'] = _dateFormatter.format(this.lastDownloadedNode!.toUtc());
    } else {
    //  json[r'lastDownloadedNode'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.personId != null) {
      json[r'personId'] = this.personId;
    } else {
    //  json[r'personId'] = null;
    }
      json[r'platform'] = this.platform;
      json[r'platformUserId'] = this.platformUserId;
    if (this.platformUserIdHash != null) {
      json[r'platformUserIdHash'] = this.platformUserIdHash;
    } else {
    //  json[r'platformUserIdHash'] = null;
    }
    if (this.posts != null) {
      json[r'posts'] = this.posts;
    } else {
    //  json[r'posts'] = null;
    }
    if (this.thumbnailPath != null) {
      json[r'thumbnailPath'] = this.thumbnailPath;
    } else {
    //  json[r'thumbnailPath'] = null;
    }
    if (this.updatedAt != null) {
      json[r'updatedAt'] = _dateFormatter.format(this.updatedAt!.toUtc());
    } else {
    //  json[r'updatedAt'] = null;
    }
      json[r'url'] = this.url;
    return json;
  }

  /// Returns a new [SocialMediaResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SocialMediaResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SocialMediaResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SocialMediaResponseDto(
        description: mapValueOfType<String>(json, r'description'),
        followers: num.parse('${json[r'followers']}'),
        following: num.parse('${json[r'following']}'),
        id: mapValueOfType<String>(json, r'id')!,
        lastDownloaded: mapDateTime(json, r'lastDownloaded', r''),
        lastDownloadedNode: mapDateTime(json, r'lastDownloadedNode', r''),
        name: mapValueOfType<String>(json, r'name'),
        personId: mapValueOfType<String>(json, r'personId'),
        platform: mapValueOfType<String>(json, r'platform')!,
        platformUserId: mapValueOfType<String>(json, r'platformUserId')!,
        platformUserIdHash: mapValueOfType<String>(json, r'platformUserIdHash'),
        posts: num.parse('${json[r'posts']}'),
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath'),
        updatedAt: mapDateTime(json, r'updatedAt', r''),
        url: mapValueOfType<String>(json, r'url')!,
      );
    }
    return null;
  }

  static List<SocialMediaResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SocialMediaResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SocialMediaResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SocialMediaResponseDto> mapFromJson(dynamic json) {
    final map = <String, SocialMediaResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SocialMediaResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SocialMediaResponseDto-objects as value to a dart map
  static Map<String, List<SocialMediaResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SocialMediaResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SocialMediaResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'platform',
    'platformUserId',
    'url',
  };
}

