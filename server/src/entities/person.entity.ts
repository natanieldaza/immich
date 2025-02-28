import { SocialMediaEntity } from 'src/entities/social-media.entity';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PersonRelationshipEntity } from 'src/entities/person-relationship.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('person')
@Check(`("birthDate" IS NOT NULL AND "age" IS NULL) OR ("birthDate" IS NULL AND "age" IS NOT NULL) OR ("birthDate" IS NULL AND "age" IS NULL)`)
@Check(`"birthDate" <= CURRENT_DATE`)
export class PersonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index('IDX_person_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;

  @Column()
  ownerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column({ default: '' })
  name!: string;

  @Column({ type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'numeric', nullable: true })
  height!: number | null;

  @Column({ type: 'integer', nullable: true })
  age!: number | null;

  @Column({ default: '' })
  thumbnailPath!: string;

  @Column({ nullable: true })
  faceAssetId!: string | null;

  @ManyToOne(() => AssetFaceEntity, { onDelete: 'SET NULL', nullable: true })
  faceAsset!: AssetFaceEntity | null;

  @OneToMany(() => AssetFaceEntity, (assetFace) => assetFace.person)
  faces!: AssetFaceEntity[];

  @Column({ default: false })
  isHidden!: boolean;

  @Column({ default: false })
  isFavorite!: boolean;

  @Column({ type: 'varchar', nullable: true, default: null })
  color?: string | null;

  @OneToMany(() => SocialMediaEntity, (socialMedia) => socialMedia.person, { cascade: true })
  socialMediaAccounts!: SocialMediaEntity[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @OneToMany(() => PersonRelationshipEntity, (relationship) => relationship.person, { cascade: true })
  relationships!: PersonRelationshipEntity[];

}
