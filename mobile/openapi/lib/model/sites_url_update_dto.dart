//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SitesUrlUpdateDto {
  /// Returns a new [SitesUrlUpdateDto] instance.
  SitesUrlUpdateDto({
    this.description,
    this.preference = 0,
    this.url,
    this.visitedAt,
  });

  String? description;

  num preference;

  String? url;

  DateTime? visitedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SitesUrlUpdateDto &&
    other.description == description &&
    other.preference == preference &&
    other.url == url &&
    other.visitedAt == visitedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (preference.hashCode) +
    (url == null ? 0 : url!.hashCode) +
    (visitedAt == null ? 0 : visitedAt!.hashCode);

  @override
  String toString() => 'SitesUrlUpdateDto[description=$description, preference=$preference, url=$url, visitedAt=$visitedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'preference'] = this.preference;
    if (this.url != null) {
      json[r'url'] = this.url;
    } else {
    //  json[r'url'] = null;
    }
    if (this.visitedAt != null) {
      json[r'visitedAt'] = this.visitedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'visitedAt'] = null;
    }
    return json;
  }

  /// Returns a new [SitesUrlUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SitesUrlUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "SitesUrlUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SitesUrlUpdateDto(
        description: mapValueOfType<String>(json, r'description'),
        preference: num.parse('${json[r'preference']}'),
        url: mapValueOfType<String>(json, r'url'),
        visitedAt: mapDateTime(json, r'visitedAt', r''),
      );
    }
    return null;
  }

  static List<SitesUrlUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SitesUrlUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SitesUrlUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SitesUrlUpdateDto> mapFromJson(dynamic json) {
    final map = <String, SitesUrlUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SitesUrlUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SitesUrlUpdateDto-objects as value to a dart map
  static Map<String, List<SitesUrlUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SitesUrlUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SitesUrlUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

