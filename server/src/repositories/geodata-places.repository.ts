import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { Asset } from 'src/database';
import { DB, webScrappedLocations } from 'src/db'; // Assuming DB is your Kysely database type
import { LoggingRepository } from 'src/repositories/logging.repository';


@Injectable()
export class GeodataPlacesRepository {
  constructor(@InjectKysely() private readonly db: Kysely<DB>, private logger: LoggingRepository) {

    this.logger.setContext(GeodataPlacesRepository.name);
  }

  LocationHub = new Set<string>();

  //LocationId: jsonData?.location_id || undefined,
  //LocationName: jsonData?.location_slug || undefined,
  //LocationUrl: jsonData?.location_url || undefined,

  async addInstagramLocationId(LocationId: string, LocationName: string | null, LocationUrl: string | null, asset: Asset) {

    // Check if the LocationId already exists in the Set
    if (!this.LocationHub.has(LocationId))
      this.LocationHub.add(LocationId);
    else
      this.logger.verbose(`Instagram Location ID ${LocationId} already exists in the hub`);

    const locationId = await this.addPlace({
      name: LocationName,
      platform: 'Instagram',
      platformLocationId: LocationId,
      platformUrl: LocationUrl,
      longitude: null,
      latitude: null,
      countryCode: null,
    });

    if (locationId) {
      this.logger.verbose(`Instagram Location ID ${LocationId} added to the database with ID ${locationId}`);
      await this.addAssetToWebScrappedLocations(asset.id, locationId);
    } else {
      this.logger.verbose(`Instagram Location ID ${LocationId} already exists in the database`);
    }

  }

  getInstagramLocationIds(): Set<string> {
    return this.LocationHub;
  }
  async addPlace(webScrappedLocations: Omit<webScrappedLocations, 'id'>) {
    // Check if the place already exists
    const existingPlace = await this.db
      .selectFrom('web_scrapped_locations')
      .select(['id']) // Select only the ID
      .where('platformLocationId', '=', webScrappedLocations.platformLocationId)
      .where('platform', '=', webScrappedLocations.platform)
      .where((eb) =>
        webScrappedLocations.name
          ? eb(sql`LOWER(name)`, '=', sql`LOWER(${webScrappedLocations.name})`)
          : eb('name', 'is', null)
      )
      .executeTakeFirst();

    // If the place exists, return the existing ID
    if (existingPlace) {
      return existingPlace.id;
    }

    // Insert the new place if it doesn't exist
    const newPlace = await this.db
      .insertInto('web_scrapped_locations')
      .values(webScrappedLocations)
      .onConflict((oc) =>
        oc.columns(['platformLocationId', 'platform']).doNothing()
      )
      .returning(['id']) // Return the new row's ID
      .executeTakeFirst();

    // Return the new ID or null if no insertion happened
    return newPlace ? newPlace.id : null;
  }





  async updatePlace(webScrappedLocations: Partial<webScrappedLocations>) {
    // Ensure required fields are present
    if (!webScrappedLocations.platformLocationId || !webScrappedLocations.platform) {
      throw new Error('platformLocationId and platform are required for updating a place');
    }

    // Filter out undefined fields to avoid overwriting with NULL
    const updateData = Object.fromEntries(
      Object.entries(webScrappedLocations).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const updatedPlace = await this.db
      .updateTable('web_scrapped_locations')
      .set(updateData)
      .where('platformLocationId', '=', webScrappedLocations.platformLocationId)
      .where('platform', '=', webScrappedLocations.platform)
      .returningAll()
      .executeTakeFirst();

    return updatedPlace;
  }

  async findPlaceByInstagramLocationId(LocationId: string): Promise<webScrappedLocations | null> {
    if (!LocationId) {
      throw new Error('LocationId is required');
    }
    // Check if the LocationId exists in the Set

    const place = await this.db
      .selectFrom('web_scrapped_locations')
      .selectAll()
      .where('platformLocationId', '=', LocationId)
      .where('platform', '=', 'Instagram')
      .executeTakeFirst();

    if (!place) {
      this.logger.debug(`Instagram Location ID ${LocationId} not found`);
      return null;
    }
    this.logger.debug(`Instagram Location ID ${LocationId} found`);

    return place;
  }

  async getallUnscrappedLocations(): Promise<webScrappedLocations[]> {
    const places = await this.db
      .selectFrom('web_scrapped_locations')
      .selectAll()
      .where('longitude', '=', null)
      .where('latitude', '=', null)
      .execute();

    return places;
  }

  async addAssetToWebScrappedLocations(assetId: string, webScrappedLocationId: string) {
    const existingEntry = await this.db
      .selectFrom('web_scrapped_locations_tmp')
      .selectAll()
      .where('assetId', '=', assetId)
      .where('webScrappedLocationId', '=', webScrappedLocationId)
      .executeTakeFirst();

    if (existingEntry) {
      this.logger.debug(`Asset ${assetId} already linked to location ${webScrappedLocationId}`);
      return;
    }

    await this.db
      .insertInto('web_scrapped_locations_tmp')
      .values({ assetId, webScrappedLocationId })
      .execute();
  }

  async getAssetsByWebScrappedLocationId(webScrappedLocationId: string): Promise<Asset[]> {
    const assets = await this.db
      .selectFrom('web_scrapped_locations_tmp')
      .innerJoin('assets', 'assets.id', 'web_scrapped_locations_tmp.assetId')
      .selectAll('assets')
      .where('webScrappedLocationId', '=', webScrappedLocationId)
      .execute();

    return assets.map(asset => ({
      ...asset,
    })) as unknown as Asset[];
  }

  async getallWebScrappedLocations(): Promise<webScrappedLocations[]> {
    const places = await this.db
      .selectFrom('web_scrapped_locations')
      .selectAll()
      .execute();

    return places;
  }

  async deleteAssetsByWebScrappedLocations(webScrappedLocationId: string) {
    await this.db
      .deleteFrom('web_scrapped_locations_tmp')
      .where('webScrappedLocationId', '=', webScrappedLocationId)
      .execute();
  }

  async getUnscrappedLocationsByAssetId(): Promise<webScrappedLocations[]> {
    const places = await this.db
      .selectFrom('web_scrapped_locations_tmp')
      .innerJoin('web_scrapped_locations', 'web_scrapped_locations.id', 'web_scrapped_locations_tmp.webScrappedLocationId')
      .selectAll('web_scrapped_locations')
      .where('longitude', '=', null)
      .where('latitude', '=', null)
      .execute();

    return places;
  }

}
