import { Column, Index, PrimaryGeneratedColumn, Table } from "src/sql-tools";


@Index({
  name: 'UQ_web_scrapped_locations_libraryId_path',
  columns: ['platform', 'platformLocationId'],
  unique: true,
})

@Table('web_scrapped_locations')
// This entity is used to store locations scraped from social media platforms.
export class WebScrappedLocationsTable {
  @PrimaryGeneratedColumn()
  id!: string;
  @Column({ type: 'character varying', nullable: true })
  name!: string | null;
  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;
  @Column({ type: 'character varying', nullable: true })
  countryCode!: string | null;
  @Column({ type: 'character varying', nullable: true })
  platform!: string; // e.g., 'Instagram', 'Facebook', etc.
  @Column({ type: 'character varying', nullable: true })
  platformLocationId!: string;
  @Column({ type: 'character varying', nullable: true })
  platformUrl!: string | null;
}