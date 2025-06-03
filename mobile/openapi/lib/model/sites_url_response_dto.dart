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
    required this.id,
    this.preference = 0,
    required this.url,
    this.visitedAt,
  });

  DateTime? createdAt;

  String? description;

  String id;

  num preference;

  String url;

  DateTime? visitedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SitesUrlResponseDto &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.id == id &&
    other.preference == preference &&
    other.url == url &&
    other.visitedAt == visitedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt == null ? 0 : createdAt!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (id.hashCode) +
    (preference.hashCode) +
    (url.hashCode) +
    (visitedAt == null ? 0 : visitedAt!.hashCode);

  @override
  String toString() => 'SitesUrlResponseDto[createdAt=$createdAt, description=$description, id=$id, preference=$preference, url=$url, visitedAt=$visitedAt]';

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
      json[r'id'] = this.id;
      json[r'preference'] = this.preference;
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
        id: mapValueOfType<String>(json, r'id')!,
        preference: num.parse('${json[r'preference']}'),
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

