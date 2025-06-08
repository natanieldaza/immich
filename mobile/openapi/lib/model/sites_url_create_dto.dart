//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SitesUrlCreateDto {
  /// Returns a new [SitesUrlCreateDto] instance.
  SitesUrlCreateDto({
    required this.createdAt,
    this.description,
    this.posts = 0,
    this.preference = 0,
    required this.url,
    this.visitedAt,
  });

  DateTime? createdAt;

  String? description;

  num posts;

  num preference;

  String url;

  DateTime? visitedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SitesUrlCreateDto &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.posts == posts &&
    other.preference == preference &&
    other.url == url &&
    other.visitedAt == visitedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt == null ? 0 : createdAt!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (posts.hashCode) +
    (preference.hashCode) +
    (url.hashCode) +
    (visitedAt == null ? 0 : visitedAt!.hashCode);

  @override
  String toString() => 'SitesUrlCreateDto[createdAt=$createdAt, description=$description, posts=$posts, preference=$preference, url=$url, visitedAt=$visitedAt]';

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
      json[r'posts'] = this.posts;
      json[r'preference'] = this.preference;
      json[r'url'] = this.url;
    if (this.visitedAt != null) {
      json[r'visitedAt'] = this.visitedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'visitedAt'] = null;
    }
    return json;
  }

  /// Returns a new [SitesUrlCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SitesUrlCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "SitesUrlCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SitesUrlCreateDto(
        createdAt: mapDateTime(json, r'createdAt', r''),
        description: mapValueOfType<String>(json, r'description'),
        posts: num.parse('${json[r'posts']}'),
        preference: num.parse('${json[r'preference']}'),
        url: mapValueOfType<String>(json, r'url')!,
        visitedAt: mapDateTime(json, r'visitedAt', r''),
      );
    }
    return null;
  }

  static List<SitesUrlCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SitesUrlCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SitesUrlCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SitesUrlCreateDto> mapFromJson(dynamic json) {
    final map = <String, SitesUrlCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SitesUrlCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SitesUrlCreateDto-objects as value to a dart map
  static Map<String, List<SitesUrlCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SitesUrlCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SitesUrlCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'url',
  };
}

