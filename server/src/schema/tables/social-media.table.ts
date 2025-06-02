import { PersonTable } from 'src/schema/tables/person.table';
import { UserTable } from 'src/schema/tables/user.table';
import { Column, ForeignKeyColumn, Index, PrimaryGeneratedColumn, Table, UpdateDateColumn } from 'src/sql-tools';


@Index({
  name: 'UQ_social_media_platform_platformUserId_platformUserIdHash',
  columns: ['platform', 'platformUserId', 'platformUserIdHash'],
  unique: true,
})


@Table('social_media')
export class SocialMediaTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => PersonTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: true })
  personId?: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ type: 'character varying', nullable: true})
  platform!: string; // e.g., 'Facebook', 'Instagram', 'Twitter'
  @Column({ type: 'character varying', nullable: true})
  platformUserId!: string; // e.g., Instagram username, Twitter handle, etc.
  @Column({ type: 'character varying', nullable: true})
  platformUserIdHash!: string; // Ensure uniqueness
    
  @Column({ type: 'character varying', nullable: true })
  thumbnailPath!: string;
  @Column({ type: 'character varying', nullable: true })
  name!: string;
  @Column({ type: 'character varying', nullable: true })
  description!: string;
  @Column({ type: 'character varying', nullable: true })
  url!: string;
  @Column({ type: 'integer', nullable: true })
  followers!: number;
  @Column({ type: 'integer', nullable: true })
  following!: number;
  @Column({ type: 'integer', nullable: true })
  posts!: number;
  @UpdateDateColumn()
  updatedAt?: Date;
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastDownloaded?: Date;
  @Column({ type: 'character varying', nullable: true })
  lastDownloadedNode?: string;
}
