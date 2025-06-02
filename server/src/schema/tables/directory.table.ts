import { AlbumTable } from 'src/schema/tables/album.table';
import { LibraryTable } from 'src/schema/tables/library.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  Index,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

import { DirectoryStatus } from "src/enum";
import { directy_status_enum } from 'src/schema/enums';
import { DIRECTORY_LIBRARY_PATH_CONSTRAINT } from 'src/utils/database';


@Table('directory')
@Index({
  name: DIRECTORY_LIBRARY_PATH_CONSTRAINT,
  columns: ['libraryId', 'path'],
  unique: true,
})

export class DirectoryTable {
  @PrimaryGeneratedColumn()
  id!: string;
  
  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @ForeignKeyColumn(() => LibraryTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: true })
  libraryId?: string | null;

  @Column({ enum: directy_status_enum, default: DirectoryStatus.ADDED })
  status!: DirectoryStatus;
  
  @Column({ index: true })
  path!: string;
  
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
  
  @Column({ type: 'boolean', default: false })
  isOffline!: boolean;

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  @ForeignKeyColumn(() => AlbumTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: true })
  albumId!: string | null;

  @ForeignKeyColumn(() => DirectoryTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: true })
  parentId!: string;
}

