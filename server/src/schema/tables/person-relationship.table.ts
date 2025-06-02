

import { RelationshipType } from 'src/enum';
import { relation_type_enum } from 'src/schema/enums';
import { PersonTable } from 'src/schema/tables/person.table';
import { Column, CreateDateColumn, ForeignKeyColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('person_relationship')
export class PersonRelationshipTable { 
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  personId!: string

  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  relatedPersonId!: string;
  
  @Column({ enum: relation_type_enum, default: RelationshipType.FRIEND })
  type!: RelationshipType;
  
  @CreateDateColumn()
  createdAt!: Date;

}
