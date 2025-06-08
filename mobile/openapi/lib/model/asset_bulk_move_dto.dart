//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkMoveDto {
  /// Returns a new [AssetBulkMoveDto] instance.
  AssetBulkMoveDto({
    this.ids = const [],
    this.newFolderPath,
  });

  List<String> ids;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? newFolderPath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkMoveDto &&
    _deepEquality.equals(other.ids, ids) &&
    other.newFolderPath == newFolderPath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ids.hashCode) +
    (newFolderPath == null ? 0 : newFolderPath!.hashCode);

  @override
  String toString() => 'AssetBulkMoveDto[ids=$ids, newFolderPath=$newFolderPath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ids'] = this.ids;
    if (this.newFolderPath != null) {
      json[r'newFolderPath'] = this.newFolderPath;
    } else {
    //  json[r'newFolderPath'] = null;
    }
    return json;
  }

  /// Returns a new [AssetBulkMoveDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkMoveDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetBulkMoveDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkMoveDto(
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        newFolderPath: mapValueOfType<String>(json, r'newFolderPath'),
      );
    }
    return null;
  }

  static List<AssetBulkMoveDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkMoveDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkMoveDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetBulkMoveDto> mapFromJson(dynamic json) {
    final map = <String, AssetBulkMoveDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetBulkMoveDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetBulkMoveDto-objects as value to a dart map
  static Map<String, List<AssetBulkMoveDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetBulkMoveDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetBulkMoveDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
  };
}

