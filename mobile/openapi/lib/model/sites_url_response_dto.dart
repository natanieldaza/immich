//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SitesUrlResponseDto {
  /// Returns a new [SitesUrlResponseDto] instance.
  SitesUrlResponseDto({
    required this.createdAt,
    this.description,
    this.failed = false,
    required this.id,
    this.lastDownloadedNode,
    this.posts = 0,
    this.preference = 0,
    this.runAt,
    required this.url,
    this.visitedAt,
  });

  DateTime? createdAt;

  String? description;

  bool? failed;

  String id;

  String? lastDownloadedNode;

  num posts;

  num preference;

  DateTime? runAt;

  String url;

  DateTime? visitedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SitesUrlResponseDto &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.failed == failed &&
    other.id == id &&
    other.lastDownloadedNode == lastDownloadedNode &&
    other.posts == posts &&
    other.preference == preference &&
    other.runAt == runAt &&
    other.url == url &&
    other.visitedAt == visitedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt == null ? 0 : createdAt!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (failed == null ? 0 : failed!.hashCode) +
    (id.hashCode) +
    (lastDownloadedNode == null ? 0 : lastDownloadedNode!.hashCode) +
    (posts.hashCode) +
    (preference.hashCode) +
    (runAt == null ? 0 : runAt!.hashCode) +
    (url.hashCode) +
    (visitedAt == null ? 0 : visitedAt!.hashCode);

  @override
  String toString() => 'SitesUrlResponseDto[createdAt=$createdAt, description=$description, failed=$failed, id=$id, lastDownloadedNode=$lastDownloadedNode, posts=$posts, preference=$preference, runAt=$runAt, url=$url, visitedAt=$visitedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.createdAt != null) {
      json[r'createdAt'] = this.createdAt!.toUtc().toIso8601String();
    } else {
    //  json[r'createdAt'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.failed != null) {
      json[r'failed'] = this.failed;
    } else {
    //  json[r'failed'] = null;
    }
      json[r'id'] = this.id;
    if (this.lastDownloadedNode != null) {
      json[r'lastDownloadedNode'] = this.lastDownloadedNode;
    } else {
    //  json[r'lastDownloadedNode'] = null;
    }
      json[r'posts'] = this.posts;
      json[r'preference'] = this.preference;
    if (this.runAt != null) {
      json[r'runAt'] = this.runAt!.toUtc().toIso8601String();
    } else {
    //  json[r'runAt'] = null;
    }
      json[r'url'] = this.url;
    if (this.visitedAt != null) {
      json[r'visitedAt'] = this.visitedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'visitedAt'] = null;
    }
    return json;
  }

  /// Returns a new [SitesUrlResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SitesUrlResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SitesUrlResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SitesUrlResponseDto(
        createdAt: mapDateTime(json, r'createdAt', r''),
        description: mapValueOfType<String>(json, r'description'),
        failed: mapValueOfType<bool>(json, r'failed') ?? false,
        id: mapValueOfType<String>(json, r'id')!,
        lastDownloadedNode: mapValueOfType<String>(json, r'lastDownloadedNode'),
        posts: num.parse('${json[r'posts']}'),
        preference: num.parse('${json[r'preference']}'),
        runAt: mapDateTime(json, r'runAt', r''),
        url: mapValueOfType<String>(json, r'url')!,
        visitedAt: mapDateTime(json, r'visitedAt', r''),
      );
    }
    return null;
  }

  static List<SitesUrlResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SitesUrlResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SitesUrlResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SitesUrlResponseDto> mapFromJson(dynamic json) {
    final map = <String, SitesUrlResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SitesUrlResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SitesUrlResponseDto-objects as value to a dart map
  static Map<String, List<SitesUrlResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SitesUrlResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SitesUrlResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'id',
    'url',
  };
}

