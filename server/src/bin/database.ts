import { ConfigRepository } from 'src/repositories/config.repository';
import { DataSource } from 'typeorm';

const { database } = new ConfigRepository().getEnv();

console.log(database.config.typeorm);
console.log("tesr");
/**
 * @deprecated - DO NOT USE THIS
 *
 * this export is ONLY to be used for TypeORM commands in package.json#scripts
 */
export const dataSource = new DataSource({ ...database.config.typeorm, host: 'localhost' });
