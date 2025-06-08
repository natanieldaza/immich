import { AssetTable } from "src/schema/tables/asset.table";
import { WebScrappedLocationsTable } from "src/schema/tables/web-scrapped-locations.table";
import { ForeignKeyColumn, PrimaryGeneratedColumn, Table } from "src/sql-tools";

@Table('asset_web_location')
export class AssetWebLocationTable {
  @PrimaryGeneratedColumn()
  id!: string;
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  assetId!: string | null;
  @ForeignKeyColumn(() => WebScrappedLocationsTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  webScrappedLocationId!: string | null;  
}