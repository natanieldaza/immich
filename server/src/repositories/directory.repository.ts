import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, Directory } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { CreateDirectoryDto, DirectoryResponseDto, UpdateDirectoryDto } from 'src/dtos/directory.dto';
import { DirectoryStatus } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';


@Injectable()
export class DirectoryRepository {
  constructor(
    @InjectKysely() private readonly db: Kysely<DB>,
    private readonly logger: LoggingRepository,

  ) { }

  async create(data: Insertable<CreateDirectoryDto>): Promise<DirectoryResponseDto | null> {
    try {
      const [result] = await this.db
        .insertInto('directory')
        .values(data)
        .returningAll()
        .execute();

      if (!result) {
        throw new Error('Insert failed, no result returned');
      }
      const response: DirectoryResponseDto = {
        id: result.id ? String(result.id) : '',
        libraryId: result.libraryId,
        ownerId: result.ownerId,
  
        status: result.status,
        path: result.path,
        
        createdAt: new Date(String(result.createdAt)),
        updatedAt: new Date(String(result.updatedAt)),
        deletedAt: result.deletedAt ? new Date(String(result.deletedAt)) : null,
        
        isOffline: result.isOffline,
        isHidden: result.isHidden,
        albumId: result.albumId,
      };
      return response;


    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        throw new Error('A record with the same URL already exists.');
      }
      throw error;
    }
  }

  async createAll(data: Insertable<CreateDirectoryDto>[]): Promise<DirectoryResponseDto[]> {
    try {
      const result = await this.db
        .insertInto('directory')
        .values(data)
        .onConflict((oc) =>
          oc
            .columns(['libraryId', 'path'])  // specify the conflict target
            .doNothing()
        )
        .returningAll()
        .execute();

      if (!result) {
        throw new Error('Insert failed, no result returned');
      }
      const response: DirectoryResponseDto[] = result.map((row) => ({
        id: row.id ? String(row.id) : '',
        libraryId: row.libraryId,
        ownerId: row.ownerId,
        status: row.status,
        path: row.path,
        
        createdAt: new Date(String(row.createdAt)),
        updatedAt: new Date(String(row.updatedAt)),
        deletedAt: row.deletedAt ? new Date(String(row.deletedAt)) : null,
        
        isOffline: row.isOffline,
        isHidden: row.isHidden,
        albumId: row.albumId,
      }));
      return response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key value violates unique constraint')
      ) {
        throw new Error('A record with the same libraryId and path already exists.');
      }
      throw error;
    }
  }

  async get(id: string): Promise<Directory> {
    const result = await this.db
      .selectFrom('directory')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return result as any as Promise<Directory>;
  }
  async getByPath(path: string): Promise<Directory | null> {
    const result = await this.db
      .selectFrom('directory')
      .selectAll()
      .where('path', '=', path)
      .executeTakeFirst();

    return result as any as Directory ?? null;
  }

  async getByPaths(paths: string[], libraryId: string): Promise<Directory[]> {
    const result = await this.db
      .selectFrom('directory')
      .selectAll()
      .where('libraryId', '=', libraryId)
      .where('path', 'in', paths)
      .execute();
    return result as any as Directory[] ?? [];
  }

  streamAssetIds(libraryId: string, directoryId: string) {
    return this.db.selectFrom('assets').select(['id']).where('libraryId', '=', libraryId).where('directoryId', '=', directoryId).stream();
  }

  async getByLibraryId(libraryId: string): Promise<Directory[]> {
    const result = await this.db
      .selectFrom('directory')
      .selectAll()
      .where('libraryId', '=', libraryId)
      .execute();

    return result as any as Directory[] ?? [];
  }
  async getByOwnerId(ownerId: string): Promise<Directory[]> {
    const result = await this.db
      .selectFrom('directory')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .execute();

    return result as any as Directory[] ?? [];
  }
  async getByStatus(status: DirectoryStatus[]): Promise<Directory[]> {
    const result = await this.db
      .selectFrom('directory')
      .selectAll()
      .where('status', 'in', status)
      .execute();

    return result as any as Directory[] ?? [];
  }
  async getAll(): Promise<Directory[]> {
    const result = await this.db
      .selectFrom('directory')
      .selectAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async update(id: string, data: Partial<UpdateDirectoryDto>): Promise<DirectoryResponseDto | null> {
    const [result] = await this.db
      .updateTable('directory')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .execute();

    return result as any as DirectoryResponseDto | null ?? null;
  }
  async delete(id: string): Promise<Directory | null> {
    const [result] = await this.db
      .deleteFrom('directory')
      .where('id', '=', id)
      .returningAll()
      .execute();

    return result as any as Directory ?? null;
  }
  async deleteByPath(path: string): Promise<Directory | null> {
    const [result] = await this.db
      .deleteFrom('directory')
      .where('path', '=', path)
      .returningAll()
      .execute();

    return result as any as Directory ?? null;
  }
  async deleteByOwnerId(ownerId: string): Promise<Directory[]> {
    const result = await this.db
      .deleteFrom('directory')
      .where('ownerId', '=', ownerId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async deleteByLibraryId(libraryId: string): Promise<Directory[]> {
    const result = await this.db
      .deleteFrom('directory')
      .where('libraryId', '=', libraryId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async deleteByStatus(status: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .deleteFrom('directory')
      .where('status', '=', status)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async deleteAll(): Promise<Directory[]> {
    const result = await this.db
      .deleteFrom('directory')
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatus(id: string, status: DirectoryStatus): Promise<Directory | null> {
    const [result] = await this.db
      .updateTable('directory')
      .set({ status })
      .where('id', '=', id)
      .returningAll()
      .execute();

    return result as any as Directory | null ?? null;
  }
  async updateStatusByPath(path: string, status: DirectoryStatus): Promise<Directory | null> {
    const [result] = await this.db
      .updateTable('directory')
      .set({ status })
      .where('path', '=', path)
      .returningAll()
      .execute();

    return result as any as Directory | null ?? null;
  }
  async updateStatusByOwnerId(ownerId: string, status: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status })
      .where('ownerId', '=', ownerId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatusByLibraryId(libraryId: string, status: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status })
      .where('libraryId', '=', libraryId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatusByStatus(status: DirectoryStatus, newStatus: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status: newStatus })
      .where('status', '=', status)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatusByStatusAndOwnerId(status: DirectoryStatus, ownerId: string, newStatus: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status: newStatus })
      .where('status', '=', status)
      .where('ownerId', '=', ownerId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatusByStatusAndLibraryId(status: DirectoryStatus, libraryId: string, newStatus: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status: newStatus })
      .where('status', '=', status)
      .where('libraryId', '=', libraryId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatusByStatusAndPath(status: DirectoryStatus, path: string, newStatus: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status: newStatus })
      .where('status', '=', status)
      .where('path', '=', path)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatusByStatusAndPathAndOwnerId(status: DirectoryStatus, path: string, ownerId: string, newStatus: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status: newStatus })
      .where('status', '=', status)
      .where('path', '=', path)
      .where('ownerId', '=', ownerId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }
  async updateStatusByStatusAndPathAndLibraryId(status: DirectoryStatus, path: string, libraryId: string, newStatus: DirectoryStatus): Promise<Directory[]> {
    const result = await this.db
      .updateTable('directory')
      .set({ status: newStatus })
      .where('status', '=', status)
      .where('path', '=', path)
      .where('libraryId', '=', libraryId)
      .returningAll()
      .execute();

    return result as any as Directory[] ?? [];
  }

  // @GenerateSql({
  //   params: [{ libraryId: DummyValue.UUID, paths: [DummyValue.STRING] }],
  // })
  // async filterNewExternalDirectoryPaths(
  //   libraryId: string,
  //   paths: string[],
  // ): Promise<string[]> {
  //   const pathAlias = 'p';

  //   const result = await this.db
  //     .selectFrom(unnest(paths).as(pathAlias)) // Use only one argument for aliasing
  //     .select('path')
  //     .where((eb) =>
  //       eb.not(
  //         eb.exists(
  //           this.db
  //             .selectFrom('directory')
  //             .select(sql`1`.as('exists'))
  //             .where(
  //               sql<boolean>`RTRIM(${sql.ref('directory.path')}, '/') = RTRIM(${sql.ref(`${pathAlias}`)}, '/')`
  //             )
  //             .where('libraryId', '=', asUuid(libraryId))
  //         )
  //       )
  //     )
  //     .execute();

  //   return result.map((row) => row.path as string);
  // }

  @GenerateSql({
    params: [{ libraryId: DummyValue.UUID, paths: [DummyValue.STRING] }],
  })
  async filterNewExternalDirectoryPaths(
    libraryId: string,
    paths: string[],
  ): Promise<string[]> {

    // Obtener las rutas existentes en la base de datos
    const result = await this.db
      .selectFrom('directory')
      .select('path')
      .where('libraryId', '=', libraryId)
      .execute();

    const existingPaths = result.map((row) => row.path as string);

    // Filtrar las rutas nuevas que no existen en la base de datos
    const newPaths = paths.filter((path) => {
      const trimmedPath = path.replace(/\/+$/, ''); // Eliminar barras al final
      return !existingPaths.some((existingPath) => {
        const trimmedExistingPath = existingPath.replace(/\/+$/, '');
        return trimmedPath === trimmedExistingPath;
      });
    });

    // Devolver solo las nuevas rutas que no existen en la base de datos
    return newPaths;
  }



}
