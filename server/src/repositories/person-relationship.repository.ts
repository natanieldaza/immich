import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { stdout } from 'process';
import { DB } from 'src/db';
import { RelationshipType } from 'src/enum';

import { PersonRelationshipDto } from 'src/dtos/person-relationship.dto';

// Relaciones simétricas
const SYMMETRIC_RELATIONSHIPS = new Set([
  RelationshipType.SIBLING,
  RelationshipType.FRIEND,
  RelationshipType.SPOUSE,
]);

// Relaciones padre-hijo
const PARENT_CHILD_MAP: Partial<Record<RelationshipType, RelationshipType>> = {
  [RelationshipType.PARENT]: RelationshipType.CHILD,
  [RelationshipType.CHILD]: RelationshipType.PARENT,
};

@Injectable()
export class PersonRelationshipRepository {
  
  
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  
  /**
   * Crea una relación y su contraparte si aplica.
   */
  async createRelationship(personId: string, relatedPersonId: string, type: RelationshipType) {
    const reverseType = this.getReverseType(type);

    await this.db.transaction().execute(async (trx) => {
      try {
        const existingRelationship = await trx
        .selectFrom('person_relationship')
        .where('personId', '=', personId)
        .where('relatedPersonId', '=', relatedPersonId)
        .where('type', '=', type)
        .executeTakeFirst();

        if (!existingRelationship) {
          await trx.insertInto('person_relationship').values({ personId, relatedPersonId, type }).execute();
        }

        if (reverseType) {
          const existingReverse = await trx
            .selectFrom('person_relationship')
            .where('personId', '=', relatedPersonId)
            .where('relatedPersonId', '=', personId)
            .where('type', '=', reverseType)
            .executeTakeFirst();

          if (!existingReverse) {
            await trx
              .insertInto('person_relationship')
              .values({ personId: relatedPersonId, relatedPersonId: personId, type: reverseType })
              .execute();
          }
        }

        if (type === RelationshipType.PARENT) {
          await this.createMultiGenerationRelationships(trx, relatedPersonId, personId, new Set());
        }
      } catch (error) {
        stdout.write(`Error creating relationship: ${String(error)}`);
      }
    });
  }

  /**
   * Crea relaciones multi-generacionales recursivamente.
   */
  private async createMultiGenerationRelationships(
    trx: Kysely<DB>,
    currentPersonId: string,
    childId: string,
    visited: Set<string>
  ) {
    if (visited.has(currentPersonId)) return;
    visited.add(currentPersonId);

    const parentRelationship = await trx
      .selectFrom('person_relationship')
      .where('relatedPersonId', '=', currentPersonId)
      .where('type', '=', RelationshipType.PARENT)
      .select(['personId'])
      .executeTakeFirst();

    if (parentRelationship) {
      const grandparentId = parentRelationship.personId;

      await trx
        .insertInto('person_relationship')
        .values({ personId: grandparentId, relatedPersonId: childId, type: RelationshipType.CHILD })
        .execute();

      await this.createMultiGenerationRelationships(trx, grandparentId, childId, visited);
    }
  }

  /**
   * Elimina una relación y su contraparte si aplica.
   */
  async deleteRelationship(personId: string, relatedPersonId: string, type: RelationshipType) {
    const reverseType = this.getReverseType(type);

    await this.db.transaction().execute(async (trx) => {
      try {
        await trx
          .deleteFrom('person_relationship')
          .where('personId', '=', personId)
          .where('relatedPersonId', '=', relatedPersonId)
          .where('type', '=', type)
          .execute();

        if (reverseType) {
          await trx
            .deleteFrom('person_relationship')
            .where('personId', '=', relatedPersonId)
            .where('relatedPersonId', '=', personId)
            .where('type', '=', reverseType)
            .execute();
        }

        if (type === RelationshipType.PARENT) {
          await this.deleteMultiGenerationRelationships(trx, relatedPersonId, personId, new Set());
        }
      } catch (error) {
        console.error('Error deleting relationship:', error);
        throw new Error('Failed to delete relationship');
      }
    });
  }

  /**
   * Elimina relaciones multi-generacionales recursivamente.
   */
  private async deleteMultiGenerationRelationships(
    trx: Kysely<DB>,
    currentPersonId: string,
    childId: string,
    visited: Set<string>
  ) {
    if (visited.has(currentPersonId)) return;
    visited.add(currentPersonId);

    const parentRelationship = await trx
      .selectFrom('person_relationship')
      .where('relatedPersonId', '=', currentPersonId)
      .where('type', '=', RelationshipType.PARENT)
      .select(['personId'])
      .executeTakeFirst();

    if (parentRelationship) {
      const grandparentId = parentRelationship.personId;

      await trx
        .deleteFrom('person_relationship')
        .where('personId', '=', grandparentId)
        .where('relatedPersonId', '=', childId)
        .where('type', '=', RelationshipType.CHILD)
        .execute();

      await this.deleteMultiGenerationRelationships(trx, grandparentId, childId, visited);
    }
  }

  /**
   * Determina el tipo de relación inversa.
   */
  private getReverseType(type: RelationshipType): RelationshipType | undefined {
    return SYMMETRIC_RELATIONSHIPS.has(type) ? type : PARENT_CHILD_MAP[type];
  }

  async getAllRelationships(personId: string): Promise<PersonRelationshipDto[]> {
    const rows = await this.db
      .selectFrom('person_relationship')
      .innerJoin('person', (join) =>
        join.onRef('person.id', '=', 'person_relationship.relatedPersonId')
      )
      .where((eb) =>
        eb.or([
          eb('person_relationship.personId', '=', personId),
          eb('person_relationship.relatedPersonId', '=', personId),
        ])
      )
      .select([
        'person_relationship.personId',
        'person_relationship.relatedPersonId',
        'person_relationship.type',
        'person.id as related_id',
        'person.name as related_name',
        'person.birthDate as related_birthDate',
        'person.age as related_age',
        'person.thumbnailPath as related_thumbnailPath',
      ])
      .execute();
  
    const result: PersonRelationshipDto[] = rows.map((row) => {
      const isSource = row.personId === personId;
      const relatedId = isSource ? row.relatedPersonId : row.personId;
  
      return {
        personId: row.personId,
        relatedPersonId: row.relatedPersonId,
        type: row.type,
        direction: isSource ? 'asSource' : 'asTarget',
        relatedPerson: {
          id: relatedId,
          name: row.related_name,
          birthDate: row.related_birthDate,
          age: row.related_age,
          thumbnailPath: row.related_thumbnailPath,
        },
      };
    });
  
    return result;
  }
  async reassignRelationships(
    personId: string,
    oldPersonId: string,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      try {
        await trx
          .updateTable('person_relationship')
          .set({ personId })
          .where('personId', '=', oldPersonId)
          .execute();

        await trx
          .updateTable('person_relationship')
          .set({ relatedPersonId: personId })
          .where('relatedPersonId', '=', oldPersonId)
          .execute();
      } catch (error) {
        console.error('Error reassigning relationships:', error);
        throw new Error('Failed to reassign relationships');
      }
    });
  }
  
}
