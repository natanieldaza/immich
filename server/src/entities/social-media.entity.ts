import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PersonEntity } from 'src/entities/person.entity';

@Entity('social_media')
export class SocialMediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PersonEntity, (person) => person.socialMediaAccounts, { onDelete: 'CASCADE', eager: true })
  person!: PersonEntity;
    
  @Column({ type: 'varchar', nullable: false })
  platform!: string; // e.g., 'Facebook', 'Instagram', 'Twitter'
  
  @Column({ type: 'varchar', nullable: false })
  platformUserId!: string; // e.g., Instagram username, Twitter handle, etc.

  @Column({ type: 'varchar', unique: true, nullable: false })
  platformUserIdHash!: string; // Ensure uniqueness

  @Column({ default: '' })
  thumbnailPath!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', nullable: false })
  url!: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  followers!: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  following!: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  posts!: number;

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated?: Date;

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  lastDownloaded?: Date;

  @Column({ type: 'varchar', nullable: true })
  lastDownloadedNode?: string;
}
