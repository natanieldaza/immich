//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SideCarPersonDto {
  /// Returns a new [SideCarPersonDto] instance.
  SideCarPersonDto({
    this.age,
    this.birthDate,
    this.color,
    this.hashId,
    required this.id,
    required this.name,
    this.socialMedia = const [],
    this.thumbnailPath,
    this.updatedAt,
    this.url,
    required this.username,
  });

  num? age;

  DateTime? birthDate;

  /// This property was added in v1.126.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? color;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? hashId;

  String id;

  String name;

  List<SocialMediaResponseDto> socialMedia;

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

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? url;

  String username;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SideCarPersonDto &&
    other.age == age &&
    other.birthDate == birthDate &&
    other.color == color &&
    other.hashId == hashId &&
    other.id == id &&
    other.name == name &&
    _deepEquality.equals(other.socialMedia, socialMedia) &&
    other.thumbnailPath == thumbnailPath &&
    other.updatedAt == updatedAt &&
    other.url == url &&
    other.username == username;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (age == null ? 0 : age!.hashCode) +
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (hashId == null ? 0 : hashId!.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (socialMedia.hashCode) +
    (thumbnailPath == null ? 0 : thumbnailPath!.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode) +
    (url == null ? 0 : url!.hashCode) +
    (username.hashCode);

  @override
  String toString() => 'SideCarPersonDto[age=$age, birthDate=$birthDate, color=$color, hashId=$hashId, id=$id, name=$name, socialMedia=$socialMedia, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt, url=$url, username=$username]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.age != null) {
      json[r'age'] = this.age;
    } else {
    //  json[r'age'] = null;
    }
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!.toUtc());
    } else {
    //  json[r'birthDate'] = null;
    }
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
    if (this.hashId != null) {
      json[r'hashId'] = this.hashId;
    } else {
    //  json[r'hashId'] = null;
    }
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'socialMedia'] = this.socialMedia;
    if (this.thumbnailPath != null) {
      json[r'thumbnailPath'] = this.thumbnailPath;
    } else {
    //  json[r'thumbnailPath'] = null;
    }
    if (this.updatedAt != null) {
      json[r'updatedAt'] = this.updatedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'updatedAt'] = null;
    }
    if (this.url != null) {
      json[r'url'] = this.url;
    } else {
    //  json[r'url'] = null;
    }
      json[r'username'] = this.username;
    return json;
  }

  /// Returns a new [SideCarPersonDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SideCarPersonDto? fromJson(dynamic value) {
    upgradeDto(value, "SideCarPersonDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SideCarPersonDto(
        age: json[r'age'] == null
            ? null
            : num.parse('${json[r'age']}'),
        birthDate: mapDateTime(json, r'birthDate', r''),
        color: mapValueOfType<String>(json, r'color'),
        hashId: mapValueOfType<String>(json, r'hashId'),
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        socialMedia: SocialMediaResponseDto.listFromJson(json[r'socialMedia']),
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath'),
        updatedAt: mapDateTime(json, r'updatedAt', r''),
        url: mapValueOfType<String>(json, r'url'),
        username: mapValueOfType<String>(json, r'username')!,
      );
    }
    return null;
  }

  static List<SideCarPersonDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SideCarPersonDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SideCarPersonDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SideCarPersonDto> mapFromJson(dynamic json) {
    final map = <String, SideCarPersonDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SideCarPersonDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SideCarPersonDto-objects as value to a dart map
  static Map<String, List<SideCarPersonDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SideCarPersonDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SideCarPersonDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
    'username',
  };
}

