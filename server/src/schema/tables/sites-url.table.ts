import { UserTable } from "src/schema/tables/user.table";
import { Column, CreateDateColumn, ForeignKeyColumn, Index, PrimaryGeneratedColumn, Table } from "src/sql-tools";

@Table('sites_url')
@Index({
  name: 'UQ_sites_url_url',
  columns: ['url'],
  unique: true,
})
export class SitesUrlTable {
  // The primary key is a UUID
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: 'character varying', nullable: false })
  // The URL is a string
  url!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  visitedAt!: Date | null;
  // The visitedAt column is a timestamp with time zone

  @Column({ type: 'timestamp with time zone', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  runAt!: Date | null;

  @Column({type:'boolean', nullable: true})
  failed!: boolean | null;
  
  @Column({ type: 'integer', nullable: true, default: 0 })
  // The preference column is a boolean that can be null
  preference!: number | null;
  
  @Column({ type: 'character varying', nullable: true, default: null })
  // The description column is a string that can be null
  description!: string | null;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ type: 'integer', nullable: true, default: 0 })
  posts!: number ;
}

