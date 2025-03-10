import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,  
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { AssetOrder } from 'src/enum';

@Entity('albums')
@Tree('closure-table') // Enables tree structure in TypeORM
export class AlbumEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @Column({ default: 'Untitled Album' })
  albumName!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index('IDX_albums_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;

  @ManyToOne(() => AssetEntity, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  albumThumbnailAsset!: AssetEntity | null;

  @Column({ comment: 'Asset ID to be used as thumbnail', nullable: true })
  albumThumbnailAssetId!: string | null;

  @OneToMany(() => AlbumUserEntity, ({ album }) => album, { cascade: true, onDelete: 'CASCADE' })
  albumUsers!: AlbumUserEntity[];

  @ManyToMany(() => AssetEntity, (asset) => asset.albums)
  @JoinTable({ synchronize: false })
  assets!: AssetEntity[];

  @OneToMany(() => SharedLinkEntity, (link) => link.album)
  sharedLinks!: SharedLinkEntity[];

  @Column({ default: true })
  isActivityEnabled!: boolean;

  @Column({ type: 'varchar', default: AssetOrder.DESC })
  order!: AssetOrder;

  @Column( {type: 'varchar', default: ''})
  path!: string | null;

  // Tree structure (Nested Albums)
  @TreeParent()
  parentAlbum!: AlbumEntity | null;

  @TreeChildren()
  childAlbums!: AlbumEntity[];
}
