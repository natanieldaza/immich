//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonWithFacesResponseDto {
  /// Returns a new [PersonWithFacesResponseDto] instance.
  PersonWithFacesResponseDto({
    this.age,
    required this.birthDate,
    this.city,
    this.color,
    this.country,
    this.description,
    this.faces = const [],
    this.height,
    required this.id,
    this.isFavorite,
    required this.isHidden,
    required this.name,
    this.ownerId,
    this.relationships = const [],
    this.socialMedia = const [],
    required this.thumbnailPath,
    this.updatedAt,
  });

  num? age;

  DateTime? birthDate;

  String? city;

  /// This property was added in v1.126.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? color;

  String? country;

  String? description;

  List<AssetFaceWithoutPersonResponseDto> faces;

  num? height;

  String id;

  /// This property was added in v1.126.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  bool isHidden;

  String name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? ownerId;

  List<PersonRelationshipDto> relationships;

  List<SocialMediaResponseDto> socialMedia;

  String thumbnailPath;

  /// This property was added in v1.107.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonWithFacesResponseDto &&
    other.age == age &&
    other.birthDate == birthDate &&
    other.city == city &&
    other.color == color &&
    other.country == country &&
    other.description == description &&
    _deepEquality.equals(other.faces, faces) &&
    other.height == height &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.ownerId == ownerId &&
    _deepEquality.equals(other.relationships, relationships) &&
    _deepEquality.equals(other.socialMedia, socialMedia) &&
    other.thumbnailPath == thumbnailPath &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (age == null ? 0 : age!.hashCode) +
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (faces.hashCode) +
    (height == null ? 0 : height!.hashCode) +
    (id.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (ownerId == null ? 0 : ownerId!.hashCode) +
    (relationships.hashCode) +
    (socialMedia.hashCode) +
    (thumbnailPath.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode);

  @override
  String toString() => 'PersonWithFacesResponseDto[age=$age, birthDate=$birthDate, city=$city, color=$color, country=$country, description=$description, faces=$faces, height=$height, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, ownerId=$ownerId, relationships=$relationships, socialMedia=$socialMedia, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt]';

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
    if (this.city != null) {
      json[r'city'] = this.city;
    } else {
    //  json[r'city'] = null;
    }
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
    if (this.country != null) {
      json[r'country'] = this.country;
    } else {
    //  json[r'country'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'faces'] = this.faces;
    if (this.height != null) {
      json[r'height'] = this.height;
    } else {
    //  json[r'height'] = null;
    }
      json[r'id'] = this.id;
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
      json[r'isHidden'] = this.isHidden;
      json[r'name'] = this.name;
    if (this.ownerId != null) {
      json[r'ownerId'] = this.ownerId;
    } else {
    //  json[r'ownerId'] = null;
    }
      json[r'relationships'] = this.relationships;
      json[r'socialMedia'] = this.socialMedia;
      json[r'thumbnailPath'] = this.thumbnailPath;
    if (this.updatedAt != null) {
      json[r'updatedAt'] = this.updatedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'updatedAt'] = null;
    }
    return json;
  }

  /// Returns a new [PersonWithFacesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonWithFacesResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonWithFacesResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonWithFacesResponseDto(
        age: json[r'age'] == null
            ? null
            : num.parse('${json[r'age']}'),
        birthDate: mapDateTime(json, r'birthDate', r''),
        city: mapValueOfType<String>(json, r'city'),
        color: mapValueOfType<String>(json, r'color'),
        country: mapValueOfType<String>(json, r'country'),
        description: mapValueOfType<String>(json, r'description'),
        faces: AssetFaceWithoutPersonResponseDto.listFromJson(json[r'faces']),
        height: json[r'height'] == null
            ? null
            : num.parse('${json[r'height']}'),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        ownerId: mapValueOfType<String>(json, r'ownerId'),
        relationships: PersonRelationshipDto.listFromJson(json[r'relationships']),
        socialMedia: SocialMediaResponseDto.listFromJson(json[r'socialMedia']),
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        updatedAt: mapDateTime(json, r'updatedAt', r''),
      );
    }
    return null;
  }

  static List<PersonWithFacesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonWithFacesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonWithFacesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonWithFacesResponseDto> mapFromJson(dynamic json) {
    final map = <String, PersonWithFacesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonWithFacesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonWithFacesResponseDto-objects as value to a dart map
  static Map<String, List<PersonWithFacesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonWithFacesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonWithFacesResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'birthDate',
    'faces',
    'id',
    'isHidden',
    'name',
    'thumbnailPath',
  };
}

