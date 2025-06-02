import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, Table } from 'src/sql-tools';

@Table('directory_job_status')
export class DirectoryJobStatusTable
{
 @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  directoryId!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  assetsSyncedAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedMetadataDataAt!: Date | null;
  
  @Column({ type: 'timestamp with time zone', nullable: true })
  createdPersonDataAt!: Date | null;
}