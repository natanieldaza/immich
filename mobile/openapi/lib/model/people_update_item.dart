//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleUpdateItem {
  /// Returns a new [PeopleUpdateItem] instance.
  PeopleUpdateItem({
    this.age,
    this.birthDate,
    this.city,
    this.color,
    this.country,
    this.description,
    this.featureFaceAssetId,
    this.height,
    required this.id,
    this.isFavorite,
    this.isHidden,
    this.name,
  });

  int? age;

  /// Person date of birth. Note: the mobile app cannot currently set the birth date to null.
  DateTime? birthDate;

  String? city;

  String? color;

  String? country;

  /// Person description
  String? description;

  /// Asset is used to get the feature face thumbnail.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? featureFaceAssetId;

  num? height;

  /// Person id.
  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  /// Person visibility
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isHidden;

  /// Person name.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleUpdateItem &&
    other.age == age &&
    other.birthDate == birthDate &&
    other.city == city &&
    other.color == color &&
    other.country == country &&
    other.description == description &&
    other.featureFaceAssetId == featureFaceAssetId &&
    other.height == height &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (age == null ? 0 : age!.hashCode) +
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (featureFaceAssetId == null ? 0 : featureFaceAssetId!.hashCode) +
    (height == null ? 0 : height!.hashCode) +
    (id.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isHidden == null ? 0 : isHidden!.hashCode) +
    (name == null ? 0 : name!.hashCode);

  @override
  String toString() => 'PeopleUpdateItem[age=$age, birthDate=$birthDate, city=$city, color=$color, country=$country, description=$description, featureFaceAssetId=$featureFaceAssetId, height=$height, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name]';

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
    if (this.featureFaceAssetId != null) {
      json[r'featureFaceAssetId'] = this.featureFaceAssetId;
    } else {
    //  json[r'featureFaceAssetId'] = null;
    }
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
    if (this.isHidden != null) {
      json[r'isHidden'] = this.isHidden;
    } else {
    //  json[r'isHidden'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    return json;
  }

  /// Returns a new [PeopleUpdateItem] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleUpdateItem? fromJson(dynamic value) {
    upgradeDto(value, "PeopleUpdateItem");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleUpdateItem(
        age: mapValueOfType<int>(json, r'age'),
        birthDate: mapDateTime(json, r'birthDate', r''),
        city: mapValueOfType<String>(json, r'city'),
        color: mapValueOfType<String>(json, r'color'),
        country: mapValueOfType<String>(json, r'country'),
        description: mapValueOfType<String>(json, r'description'),
        featureFaceAssetId: mapValueOfType<String>(json, r'featureFaceAssetId'),
        height: json[r'height'] == null
            ? null
            : num.parse('${json[r'height']}'),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isHidden: mapValueOfType<bool>(json, r'isHidden'),
        name: mapValueOfType<String>(json, r'name'),
      );
    }
    return null;
  }

  static List<PeopleUpdateItem> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleUpdateItem>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleUpdateItem.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleUpdateItem> mapFromJson(dynamic json) {
    final map = <String, PeopleUpdateItem>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleUpdateItem.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleUpdateItem-objects as value to a dart map
  static Map<String, List<PeopleUpdateItem>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleUpdateItem>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleUpdateItem.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
  };
}

