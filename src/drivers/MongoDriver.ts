import { MongoClient } from 'mongodb';
import { DataStore } from '../interfaces/DataStore';
import { MongoConnector } from '../Shared/MongoConnector';

export const COLLECTIONS = {
  STANDARD_OUTCOMES: 'outcomes',
};

export class MongoDriver implements DataStore {
  private mongoClient: MongoClient;

  constructor() {
    this.mongoClient = MongoConnector.getInstance().mongoClient;
  }

  /**
   * Fetches array of distinct sources
   *
   * @returns {Promise<string[]>}
   * @memberof MongoDriver
   */
  public async fetchSources(): Promise<string[]> {
    try {
      return (<any>(
        this.mongoClient.db().collection(COLLECTIONS.STANDARD_OUTCOMES)
      )).distinct('source');
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Returns all areas of standard outcomes, grouped by source.
   *
   * NOTE: "area" is stored as the property "name" in the database.
   */
  public async fetchAreas(): Promise<{ _id: string, areas: string[] }[]> {
    try {
      return this.mongoClient.db().collection(COLLECTIONS.STANDARD_OUTCOMES)
        .aggregate([
          { $group: { _id: '$source', areas: { $addToSet: '$name' } } },
        ]).toArray();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
