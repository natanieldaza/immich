import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  Index,
  Check,
  AfterInsert,
  AfterRemove,
  Repository,
  QueryFailedError,
} from 'typeorm';
import { PersonEntity } from './person.entity';
//import { AppDataSource } from '../repositories/index'

export enum RelationshipType {
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  FRIEND = 'friend',
  SPOUSE = 'spouse',
  COLLEAGUE = 'colleague',
}

// Define relationships that should be **symmetric**
const SYMMETRIC_RELATIONSHIPS = new Set([
  RelationshipType.SIBLING,
  RelationshipType.FRIEND,
  RelationshipType.SPOUSE,
]);

// Define **parent-child** relationships
const PARENT_CHILD_MAP = new Map<RelationshipType, RelationshipType>([
  [RelationshipType.PARENT, RelationshipType.CHILD], // A -> B (parent) should create B -> A (child)
  [RelationshipType.CHILD, RelationshipType.PARENT], // A -> B (child) should create B -> A (parent)
]);

@Entity('person_relationship')
@Unique(['person', 'relatedPerson', 'type']) // Prevent duplicate A -> B (friend)
@Check(`"personId" <> "relatedPersonId"`) // Prevent self-relationships
export class PersonRelationshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PersonEntity, (person) => person.relationships, { onDelete: 'CASCADE' })
  @Index()
  person!: PersonEntity;

  @ManyToOne(() => PersonEntity, { onDelete: 'CASCADE' })
  @Index()
  relatedPerson!: PersonEntity;

  @Column({ type: 'enum', enum: RelationshipType })
  type!: RelationshipType;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  /**
   * Auto-create the reverse relationship (symmetric, parent-child, grandparent-grandchild, etc.).
   */
  // @AfterInsert()
  // async createReverseRelationship() {
  //   const relationshipRepo: Repository<PersonRelationshipEntity> =
  //     AppDataSource.getRepository(PersonRelationshipEntity);

  //   // Determine the reverse relationship type
  //   let reverseType: RelationshipType | undefined;

  //   if (SYMMETRIC_RELATIONSHIPS.has(this.type)) {
  //     reverseType = this.type; // Symmetric: Same type for reverse
  //   } else if (PARENT_CHILD_MAP.has(this.type)) {
  //     reverseType = PARENT_CHILD_MAP.get(this.type); // Parent-child mapping
  //   }

  //   if (!reverseType) return; // No reverse needed

  //   // Check if the reverse relationship already exists
  //   const existingReverse = await relationshipRepo.findOne({
  //     where: {
  //       person: { id: this.relatedPerson.id },
  //       relatedPerson: { id: this.person.id },
  //       type: reverseType,
  //     },
  //   });

  //   if (!existingReverse) {
  //     const reverseRelationship = relationshipRepo.create({
  //       person: this.relatedPerson,
  //       relatedPerson: this.person,
  //       type: reverseType,
  //     });
  //     await relationshipRepo.save(reverseRelationship);
  //   }

  //   // Handle Multi-Generation Relationships (Grandparents, Great-Grandparents, etc.)
  //   if (this.type === RelationshipType.PARENT) {
  //     await this.createMultiGenerationRelationships(this.relatedPerson, this.person, new Set());
  //   }
  // }

  // /**
  //  * Recursively create multi-generation relationships (grandparents, great-grandparents, etc.).
  //  * @param currentPerson The current parent being processed.
  //  * @param child The child for which relationships are being created.
  //  * @param visited Set to track visited individuals and avoid circular references.
  //  */
  // private async createMultiGenerationRelationships(
  //   currentPerson: PersonEntity,
  //   child: PersonEntity,
  //   visited: Set<string>
  // ) {
  //   // Avoid circular references (infinite loops)
  //   if (visited.has(currentPerson.id)) {
  //     console.warn(`Circular reference detected for ${currentPerson.id}, skipping further processing.`);
  //     return;
  //   }
  //   visited.add(currentPerson.id);

  //   const relationshipRepo = AppDataSource.getRepository(PersonRelationshipEntity);

  //   // Get the parent of the current person (the grandparent)
  //   const parentRelationship = await relationshipRepo.findOne({
  //     where: {
  //       person: { id: currentPerson.id },
  //       type: RelationshipType.PARENT,
  //     },
  //     relations: ['relatedPerson'],
  //   });

  //   if (parentRelationship) {
  //     const grandparent = parentRelationship.relatedPerson;

  //     // Create grandparent -> child (grandparent-grandchild)
  //     const grandparentRelationship = relationshipRepo.create({
  //       person: grandparent,
  //       relatedPerson: child,
  //       type: RelationshipType.CHILD,
  //     });
  //     await relationshipRepo.save(grandparentRelationship);

  //     // Recursively handle great-grandparents if they exist
  //     await this.createMultiGenerationRelationships(grandparent, child, visited);
  //   } else {
  //     console.warn(`No parent found for ${currentPerson.id}, stopping recursion.`);
  //   }
  // }

  // /**
  //  * Auto-remove the reverse relationship when deleting a relationship.
  //  */
  // @AfterRemove()
  // async deleteReverseRelationship() {
  //   const relationshipRepo: Repository<PersonRelationshipEntity> =
  //     AppDataSource.getRepository(PersonRelationshipEntity);

  //   // Determine the reverse type
  //   let reverseType: RelationshipType | undefined;

  //   if (SYMMETRIC_RELATIONSHIPS.has(this.type)) {
  //     reverseType = this.type;
  //   } else if (PARENT_CHILD_MAP.has(this.type)) {
  //     reverseType = PARENT_CHILD_MAP.get(this.type);
  //   }

  //   if (!reverseType) return;

  //   await relationshipRepo.delete({
  //     person: { id: this.relatedPerson.id },
  //     relatedPerson: { id: this.person.id },
  //     type: reverseType,
  //   });

  //   // Handle Multi-Generation Deletion (grandparents, great-grandparents, etc.)
  //   if (this.type === RelationshipType.PARENT) {
  //     await this.deleteMultiGenerationRelationships(this.relatedPerson, this.person, new Set());
  //   }
  // }

  // /**
  //  * Recursively delete multi-generation relationships (grandparents, great-grandparents, etc.).
  //  * @param currentPerson The current parent being processed.
  //  * @param child The child whose relationships are being deleted.
  //  * @param visited Set to track visited individuals and avoid circular references.
  //  */
  // private async deleteMultiGenerationRelationships(
  //   currentPerson: PersonEntity,
  //   child: PersonEntity,
  //   visited: Set<string>
  // ) {
  //   // Avoid circular references (infinite loops)
  //   if (visited.has(currentPerson.id)) {
  //     console.warn(`Circular reference detected for ${currentPerson.id}, skipping further processing.`);
  //     return;
  //   }
  //   visited.add(currentPerson.id);

  //   const relationshipRepo = AppDataSource.getRepository(PersonRelationshipEntity);

  //   // Get the parent of the current person (the grandparent)
  //   const parentRelationship = await relationshipRepo.findOne({
  //     where: {
  //       person: { id: currentPerson.id },
  //       type: RelationshipType.PARENT,
  //     },
  //     relations: ['relatedPerson'],
  //   });

  //   if (parentRelationship) {
  //     const grandparent = parentRelationship.relatedPerson;

  //     // Remove grandparent -> child (grandparent-grandchild)
  //     await relationshipRepo.delete({
  //       person: grandparent,
  //       relatedPerson: child,
  //       type: RelationshipType.CHILD,
  //     });

  //     // Recursively handle great-grandparents if they exist
  //     await this.deleteMultiGenerationRelationships(grandparent, child, visited);
  //   } else {
  //     console.warn(`No parent found for ${currentPerson.id}, stopping recursion.`);
  //   }
  // }
}
