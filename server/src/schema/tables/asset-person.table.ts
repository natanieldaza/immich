import { AssetPersonType } from 'src/enum';
import { asset_person_type_enum } from 'src/schema/enums';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { Column, ForeignKeyColumn, Index, Table } from 'src/sql-tools';

@Table({
  name: 'asset_person',
})
@Index({ name: 'PK_asset_person', columns: ['assetId', 'personId'], unique: true }) // Define primary key as a unique index
@Index({ name: 'IDX_asset_person_assetId_personId', columns: ['assetId', 'personId'] })
@Index({ columns: ['personId', 'assetId'] })
export class AssetPersonTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    index: false,
  })
  assetId!: string;

  @ForeignKeyColumn(() => PersonTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    index: false,
  })
  personId!: string;

  @Column({ enum: asset_person_type_enum, default: AssetPersonType.TAGGED })
  type!:AssetPersonType;
}
