//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RelatedPersonDto {
  /// Returns a new [RelatedPersonDto] instance.
  RelatedPersonDto({
    required this.age,
    required this.birthDate,
    required this.id,
    required this.name,
    required this.thumbnailPath,
  });

  num? age;

  Object birthDate;

  String id;

  String name;

  String thumbnailPath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RelatedPersonDto &&
    other.age == age &&
    other.birthDate == birthDate &&
    other.id == id &&
    other.name == name &&
    other.thumbnailPath == thumbnailPath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (age == null ? 0 : age!.hashCode) +
    (birthDate.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (thumbnailPath.hashCode);

  @override
  String toString() => 'RelatedPersonDto[age=$age, birthDate=$birthDate, id=$id, name=$name, thumbnailPath=$thumbnailPath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.age != null) {
      json[r'age'] = this.age;
    } else {
    //  json[r'age'] = null;
    }
      json[r'birthDate'] = this.birthDate;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'thumbnailPath'] = this.thumbnailPath;
    return json;
  }

  /// Returns a new [RelatedPersonDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RelatedPersonDto? fromJson(dynamic value) {
    upgradeDto(value, "RelatedPersonDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RelatedPersonDto(
        age: json[r'age'] == null
            ? null
            : num.parse('${json[r'age']}'),
        birthDate: mapValueOfType<Object>(json, r'birthDate')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
      );
    }
    return null;
  }

  static List<RelatedPersonDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RelatedPersonDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RelatedPersonDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RelatedPersonDto> mapFromJson(dynamic json) {
    final map = <String, RelatedPersonDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RelatedPersonDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RelatedPersonDto-objects as value to a dart map
  static Map<String, List<RelatedPersonDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RelatedPersonDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RelatedPersonDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'age',
    'birthDate',
    'id',
    'name',
    'thumbnailPath',
  };
}

