import { AssetTable } from "src/schema/tables/asset.table";
import { WebScrappedLocationsTable } from "src/schema/tables/web-scrapped-locations.table";
import { ForeignKeyColumn, Table } from "src/sql-tools";
@Table('web_scrapped_locations_tmp')
export class WebScrappedLocationsTmpTable 
{
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  assetId!: string | null;

  @ForeignKeyColumn(() => WebScrappedLocationsTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  // This is the foreign key to the web_scrapped_locations table
  webScrappedLocationId!: string | null;
}