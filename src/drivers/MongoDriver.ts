import { MongoClient, Db } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import { StandardOutcomeDocument } from '@cyber4all/clark-schema';
import { OutcomeFilter, suggestMode } from '../interfaces/DataStore';
import * as dotenv from 'dotenv';
dotenv.config();

export interface Collection {
  name: string;
  foreigns?: Foreign[];
  uniques?: string[];
  text?: string[];
}
export interface Foreign {
  name: string;
  data: ForeignData;
}

export interface ForeignData {
  target: string;
  child: boolean;
  registry?: string;
}
export class COLLECTIONS {
  public static User: Collection = {
    name: 'users',
    foreigns: [
      {
        name: 'objects',
        data: {
          target: 'LearningObject',
          child: true,
        },
      },
    ],
    uniques: ['username'],
  };

  public static LearningObject: Collection = {
    name: 'objects',
    foreigns: [
      {
        name: 'authorID',
        data: {
          target: 'User',
          child: false,
          registry: 'objects',
        },
      },
      {
        name: 'outcomes',
        data: {
          target: 'LearningOutcome',
          child: true,
          registry: 'source',
        },
      },
    ],
  };

  public static LearningOutcome: Collection = {
    name: 'learning-outcomes',
    foreigns: [
      {
        name: 'source',
        data: {
          target: 'LearningObject',
          child: false,
          registry: 'outcomes',
        },
      },
    ],
  };

  public static StandardOutcome: Collection = { name: 'outcomes' };
  public static LearningObjectCollection: Collection = { name: 'collections' };
}

const COLLECTIONS_MAP = new Map<string, Collection>();
COLLECTIONS_MAP.set('User', COLLECTIONS.User);
COLLECTIONS_MAP.set('LearningObject', COLLECTIONS.LearningObject);
COLLECTIONS_MAP.set('LearningOutcome', COLLECTIONS.LearningOutcome);
COLLECTIONS_MAP.set('StandardOutcome', COLLECTIONS.StandardOutcome);
COLLECTIONS_MAP.set(
  'LearningObjectCollection',
  COLLECTIONS.LearningObjectCollection,
);

export class MongoDriver implements DataStore {
  private db: Db;
  constructor() {
    const dburi =
      process.env.NODE_ENV === 'production'
        ? process.env.CLARK_DB_URI.replace(
            /<DB_PASSWORD>/g,
            process.env.CLARK_DB_PWD,
          )
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME)
        : process.env.CLARK_DB_URI_DEV.replace(
            /<DB_PASSWORD>/g,
            process.env.CLARK_DB_PWD,
          )
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
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
      this.db = await MongoClient.connect(dbURI);
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
    this.db.close();
  }
  /**
   * Performs regex search on Outcomes with provided fields
   *
   * @param {OutcomeFilter} filter
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<{ total: number; outcomes: StandardOutcomeDocument[] }>}
   * @memberof MongoDriver
   */
  public async searchOutcomes(
    filter: OutcomeFilter,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcomeDocument[] }> {
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
      let docs = await this.db
        .collection(COLLECTIONS.StandardOutcome.name)
        .find(query);

      const total = await docs.count();

      docs =
        skip !== undefined
          ? docs.skip(skip).limit(limit)
          : limit
            ? docs.limit(limit)
            : docs;

      let outcomes = await docs.toArray();
      outcomes = outcomes.map(outcome => {
        outcome.id = outcome._id;
        delete outcome._id;
        return outcome;
      });
      return { total: total, outcomes: outcomes };
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
   * @returns {Promise<{ total: number; outcomes: StandardOutcomeDocument[] }>}
   * @memberof MongoDriver
   */
  public async suggestOutcomes(
    filter: OutcomeFilter,
    mode: suggestMode,
    threshold: number,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcomeDocument[] }> {
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

      let docs = await this.db
        .collection(COLLECTIONS.StandardOutcome.name)
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
      return { total, outcomes };
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
        this.db.collection(COLLECTIONS.StandardOutcome.name)
      )).distinct('source');
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
