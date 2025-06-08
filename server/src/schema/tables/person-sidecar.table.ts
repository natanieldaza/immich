import { PersonTable } from "src/schema/tables/person.table";
import { UserTable } from "src/schema/tables/user.table";
import { Column, ForeignKeyColumn, Index, PrimaryGeneratedColumn, Table } from "src/sql-tools";


// This entity is used to store sidecar files associated with a person.


@Index({
  name: 'UQ_person_sidecar',
  // This index is used to enforce uniqueness on the combination of personId and sidecarPath.
  columns: ['personId', 'sidecarPath', 'ownerId'],
  unique: true,
})


@Table('person_sidecar')
export class PersonSidecarTable {
  @PrimaryGeneratedColumn()
  id!: string;
  
  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  personId!: string;
  
  @Column()
  sidecarPath!: string;
  
  @Column({ type: 'timestamp with time zone',nullable: true })
  lastProcessedAt!: Date | null;
  
  @Column({ type: 'timestamp with time zone',nullable: true })
  updatedAt!: Date;  
  
  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;
  
}