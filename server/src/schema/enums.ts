import { AssetPersonType, AssetStatus, AssetVisibility, DirectoryStatus, RelationshipType, SourceType } from 'src/enum';
import { registerEnum } from 'src/sql-tools';

export const assets_status_enum = registerEnum({
  name: 'assets_status_enum',
  values: Object.values(AssetStatus),
});

export const asset_face_source_type = registerEnum({
  name: 'sourcetype',
  values: Object.values(SourceType),
});

export const asset_visibility_enum = registerEnum({
  name: 'asset_visibility_enum',
  values: Object.values(AssetVisibility),
});

export const directy_status_enum = registerEnum({
  name: 'directory_status_enum',
  values: Object.values(DirectoryStatus),
});

export const relation_type_enum = registerEnum({
  name: 'relation_type_enum',
  values: Object.values(RelationshipType),
});

export const asset_person_type_enum = registerEnum({
  name: 'asset_person_type_enum',
  values: Object.values(AssetPersonType),
});