import { MongoClient, Db } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import { StandardOutcomeDocument } from '@cyber4all/clark-schema';
import { OutcomeFilter, suggestMode } from '../interfaces/DataStore';
import * as dotenv from 'dotenv';
import { StandardOutcome } from '@cyber4all/clark-entity';
dotenv.config();

export const COLLECTIONS = {
  STANDARD_OUTCOMES: 'outcomes',
};

export class MongoDriver implements DataStore {
  private client: MongoClient;
  constructor(dburi: string) {
    this.connect(dburi);
  }
  /**
   * Connect to MongoDB
   *
   * @param {*} dburi
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  async connect(dbURI: string, retryAttempt?: number): Promise<void> {
    try {
      this.client = await MongoClient.connect(dbURI);
    } catch (e) {
      if (!retryAttempt) {
        this.connect(
          dbURI,
          1,
        );
      } else {
        return Promise.reject(
          'Problem connecting to database at ' + dbURI + ':\n\t' + e,
        );
      }
    }
  }
  /**
   * Disconnect from Mongo
   *
   * @memberof MongoDriver
   */
  disconnect(): void {
    this.client.close();
  }
  /**
   * Performs regex search on Outcomes with provided fields
   *
   * @param {OutcomeFilter} filter
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<{ total: number; outcomes: StandardOutcome[] }>}
   * @memberof MongoDriver
   */
  public async searchOutcomes(
    filter: OutcomeFilter,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }> {
    try {
      if (page !== undefined && page <= 0) {
        page = 1;
      }
      const skip = page && limit ? (page - 1) * limit : undefined;
      const query: any = {
        $or: [
          { $text: { $search: filter.text } },
          { outcome: new RegExp(filter.text, 'ig') },
        ],
      };
      delete filter.text;
      for (const prop of Object.keys(filter)) {
        query[prop] = { $regex: new RegExp(filter[prop], 'ig') };
      }
      let docs = await this.client
        .db()
        .collection<StandardOutcomeDocument>(COLLECTIONS.STANDARD_OUTCOMES)
        .find(query);

      const total = await docs.count();

      docs =
        skip !== undefined
          ? docs.skip(skip).limit(limit)
          : limit
          ? docs.limit(limit)
          : docs;
      let outcomes = await docs.toArray();
      return {
        total: total,
        outcomes: outcomes.map(
          outcome => new StandardOutcome({ ...outcome, id: outcome._id }),
        ),
      };
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Suggests outcomes based on user input
   *
   * @param {OutcomeFilter} filter
   * @param {suggestMode} mode
   * @param {number} threshold
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<{ total: number; outcomes: StandardOutcome[] }>}
   * @memberof MongoDriver
   */
  public async suggestOutcomes(
    filter: OutcomeFilter,
    mode: suggestMode,
    threshold: number,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }> {
    try {
      if (page !== undefined && page <= 0) {
        page = 1;
      }
      const skip = page && limit ? (page - 1) * limit : undefined;

      const text = filter.text;
      delete filter.text;

      const query: any = { $text: { $search: text } };

      if (filter.name) {
        query.name = { $regex: new RegExp(filter.name, 'ig') };

        delete filter.name;
      }
      if (filter.source) {
        query.source = { $regex: new RegExp(filter.source, 'ig') };
        delete filter.source;
      }

      for (const prop of Object.keys(filter)) {
        query[prop] = filter[prop];
      }

      let docs = await this.client
        .db()
        .collection<StandardOutcomeDocument>(COLLECTIONS.STANDARD_OUTCOMES)
        .aggregate([
          { $match: query },
          {
            $project: {
              _id: 0,
              id: '$_id',
              author: 1,
              name: 1,
              date: 1,
              outcome: 1,
              source: 1,
              tag: 1,
              score: { $meta: 'textScore' },
            },
          },
          { $match: { score: { $gt: threshold } } },
        ])
        .sort({ score: { $meta: 'textScore' } });

      const arr = await docs.toArray();
      const total = arr.length;

      docs =
        skip !== undefined
          ? docs.skip(skip).limit(limit)
          : limit
          ? docs.limit(limit)
          : docs;

      const outcomes = await docs.toArray();
      return {
        total,
        outcomes: outcomes.map(
          outcome => new StandardOutcome({ ...outcome, id: outcome._id }),
        ),
      };
    } catch (e) {
      return Promise.reject(e);
    }
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
        this.client.db().collection(COLLECTIONS.STANDARD_OUTCOMES)
      )).distinct('source');
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
