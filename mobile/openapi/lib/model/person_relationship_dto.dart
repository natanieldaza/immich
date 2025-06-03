//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonRelationshipDto {
  /// Returns a new [PersonRelationshipDto] instance.
  PersonRelationshipDto({
    required this.direction,
    required this.personId,
    required this.relatedPerson,
    required this.relatedPersonId,
    required this.type,
  });

  Object direction;

  String personId;

  RelatedPersonDto? relatedPerson;

  String relatedPersonId;

  PersonRelationshipDtoTypeEnum type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonRelationshipDto &&
    other.direction == direction &&
    other.personId == personId &&
    other.relatedPerson == relatedPerson &&
    other.relatedPersonId == relatedPersonId &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (direction.hashCode) +
    (personId.hashCode) +
    (relatedPerson == null ? 0 : relatedPerson!.hashCode) +
    (relatedPersonId.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'PersonRelationshipDto[direction=$direction, personId=$personId, relatedPerson=$relatedPerson, relatedPersonId=$relatedPersonId, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'direction'] = this.direction;
      json[r'personId'] = this.personId;
    if (this.relatedPerson != null) {
      json[r'relatedPerson'] = this.relatedPerson;
    } else {
    //  json[r'relatedPerson'] = null;
    }
      json[r'relatedPersonId'] = this.relatedPersonId;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [PersonRelationshipDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonRelationshipDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonRelationshipDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonRelationshipDto(
        direction: mapValueOfType<Object>(json, r'direction')!,
        personId: mapValueOfType<String>(json, r'personId')!,
        relatedPerson: RelatedPersonDto.fromJson(json[r'relatedPerson']),
        relatedPersonId: mapValueOfType<String>(json, r'relatedPersonId')!,
        type: PersonRelationshipDtoTypeEnum.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<PersonRelationshipDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonRelationshipDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonRelationshipDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonRelationshipDto> mapFromJson(dynamic json) {
    final map = <String, PersonRelationshipDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonRelationshipDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonRelationshipDto-objects as value to a dart map
  static Map<String, List<PersonRelationshipDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonRelationshipDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonRelationshipDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'direction',
    'personId',
    'relatedPerson',
    'relatedPersonId',
    'type',
  };
}


class PersonRelationshipDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const PersonRelationshipDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const parent = PersonRelationshipDtoTypeEnum._(r'parent');
  static const child = PersonRelationshipDtoTypeEnum._(r'child');
  static const sibling = PersonRelationshipDtoTypeEnum._(r'sibling');
  static const spouse = PersonRelationshipDtoTypeEnum._(r'spouse');
  static const grandparent = PersonRelationshipDtoTypeEnum._(r'grandparent');
  static const grandchild = PersonRelationshipDtoTypeEnum._(r'grandchild');
  static const uncle = PersonRelationshipDtoTypeEnum._(r'uncle');
  static const aunt = PersonRelationshipDtoTypeEnum._(r'aunt');
  static const nephew = PersonRelationshipDtoTypeEnum._(r'nephew');
  static const niece = PersonRelationshipDtoTypeEnum._(r'niece');
  static const cousin = PersonRelationshipDtoTypeEnum._(r'cousin');
  static const parentInLaw = PersonRelationshipDtoTypeEnum._(r'parent_in_law');
  static const childInLaw = PersonRelationshipDtoTypeEnum._(r'child_in_law');
  static const siblingInLaw = PersonRelationshipDtoTypeEnum._(r'sibling_in_law');
  static const friend = PersonRelationshipDtoTypeEnum._(r'friend');
  static const bestFriend = PersonRelationshipDtoTypeEnum._(r'best_friend');
  static const acquaintance = PersonRelationshipDtoTypeEnum._(r'acquaintance');
  static const friendOfFriend = PersonRelationshipDtoTypeEnum._(r'friend_of_friend');
  static const colleague = PersonRelationshipDtoTypeEnum._(r'colleague');
  static const supervisor = PersonRelationshipDtoTypeEnum._(r'supervisor');
  static const subordinate = PersonRelationshipDtoTypeEnum._(r'subordinate');
  static const businessPartner = PersonRelationshipDtoTypeEnum._(r'business_partner');
  static const coauthor = PersonRelationshipDtoTypeEnum._(r'coauthor');
  static const classmate = PersonRelationshipDtoTypeEnum._(r'classmate');
  static const teacher = PersonRelationshipDtoTypeEnum._(r'teacher');
  static const student = PersonRelationshipDtoTypeEnum._(r'student');
  static const teammate = PersonRelationshipDtoTypeEnum._(r'teammate');
  static const neighbor = PersonRelationshipDtoTypeEnum._(r'neighbor');
  static const roommate = PersonRelationshipDtoTypeEnum._(r'roommate');
  static const mentor = PersonRelationshipDtoTypeEnum._(r'mentor');
  static const mentee = PersonRelationshipDtoTypeEnum._(r'mentee');

  /// List of all possible values in this [enum][PersonRelationshipDtoTypeEnum].
  static const values = <PersonRelationshipDtoTypeEnum>[
    parent,
    child,
    sibling,
    spouse,
    grandparent,
    grandchild,
    uncle,
    aunt,
    nephew,
    niece,
    cousin,
    parentInLaw,
    childInLaw,
    siblingInLaw,
    friend,
    bestFriend,
    acquaintance,
    friendOfFriend,
    colleague,
    supervisor,
    subordinate,
    businessPartner,
    coauthor,
    classmate,
    teacher,
    student,
    teammate,
    neighbor,
    roommate,
    mentor,
    mentee,
  ];

  static PersonRelationshipDtoTypeEnum? fromJson(dynamic value) => PersonRelationshipDtoTypeEnumTypeTransformer().decode(value);

  static List<PersonRelationshipDtoTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonRelationshipDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonRelationshipDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PersonRelationshipDtoTypeEnum] to String,
/// and [decode] dynamic data back to [PersonRelationshipDtoTypeEnum].
class PersonRelationshipDtoTypeEnumTypeTransformer {
  factory PersonRelationshipDtoTypeEnumTypeTransformer() => _instance ??= const PersonRelationshipDtoTypeEnumTypeTransformer._();

  const PersonRelationshipDtoTypeEnumTypeTransformer._();

  String encode(PersonRelationshipDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a PersonRelationshipDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PersonRelationshipDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'parent': return PersonRelationshipDtoTypeEnum.parent;
        case r'child': return PersonRelationshipDtoTypeEnum.child;
        case r'sibling': return PersonRelationshipDtoTypeEnum.sibling;
        case r'spouse': return PersonRelationshipDtoTypeEnum.spouse;
        case r'grandparent': return PersonRelationshipDtoTypeEnum.grandparent;
        case r'grandchild': return PersonRelationshipDtoTypeEnum.grandchild;
        case r'uncle': return PersonRelationshipDtoTypeEnum.uncle;
        case r'aunt': return PersonRelationshipDtoTypeEnum.aunt;
        case r'nephew': return PersonRelationshipDtoTypeEnum.nephew;
        case r'niece': return PersonRelationshipDtoTypeEnum.niece;
        case r'cousin': return PersonRelationshipDtoTypeEnum.cousin;
        case r'parent_in_law': return PersonRelationshipDtoTypeEnum.parentInLaw;
        case r'child_in_law': return PersonRelationshipDtoTypeEnum.childInLaw;
        case r'sibling_in_law': return PersonRelationshipDtoTypeEnum.siblingInLaw;
        case r'friend': return PersonRelationshipDtoTypeEnum.friend;
        case r'best_friend': return PersonRelationshipDtoTypeEnum.bestFriend;
        case r'acquaintance': return PersonRelationshipDtoTypeEnum.acquaintance;
        case r'friend_of_friend': return PersonRelationshipDtoTypeEnum.friendOfFriend;
        case r'colleague': return PersonRelationshipDtoTypeEnum.colleague;
        case r'supervisor': return PersonRelationshipDtoTypeEnum.supervisor;
        case r'subordinate': return PersonRelationshipDtoTypeEnum.subordinate;
        case r'business_partner': return PersonRelationshipDtoTypeEnum.businessPartner;
        case r'coauthor': return PersonRelationshipDtoTypeEnum.coauthor;
        case r'classmate': return PersonRelationshipDtoTypeEnum.classmate;
        case r'teacher': return PersonRelationshipDtoTypeEnum.teacher;
        case r'student': return PersonRelationshipDtoTypeEnum.student;
        case r'teammate': return PersonRelationshipDtoTypeEnum.teammate;
        case r'neighbor': return PersonRelationshipDtoTypeEnum.neighbor;
        case r'roommate': return PersonRelationshipDtoTypeEnum.roommate;
        case r'mentor': return PersonRelationshipDtoTypeEnum.mentor;
        case r'mentee': return PersonRelationshipDtoTypeEnum.mentee;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PersonRelationshipDtoTypeEnumTypeTransformer] instance.
  static PersonRelationshipDtoTypeEnumTypeTransformer? _instance;
}


