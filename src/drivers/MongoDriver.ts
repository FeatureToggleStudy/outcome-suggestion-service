import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';

export { ObjectID as DBID };

import { DataStore } from '../interfaces/interfaces';
import { StandardOutcomeDocument } from '@cyber4all/clark-schema';
import { OutcomeFilter, suggestMode } from '../interfaces/DataStore';
import * as stemmer from 'stemmer';
import * as dotenv from 'dotenv';
dotenv.config();

export interface Collection {
  name: string;
  foreigns?: Foriegn[];
  uniques?: string[];
  text?: string[];
}
export interface Foriegn {
  name: string;
  data: ForiegnData;
}

export interface ForiegnData {
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
          child: true
        }
      }
    ],
    uniques: ['username']
  };
  public static LearningObject: Collection = {
    name: 'objects',
    foreigns: [
      {
        name: 'authorID',
        data: {
          target: 'User',
          child: false,
          registry: 'objects'
        }
      },
      {
        name: 'outcomes',
        data: {
          target: 'LearningOutcome',
          child: true,
          registry: 'source'
        }
      }
    ]
  };
  public static LearningOutcome: Collection = {
    name: 'learning-outcomes',
    foreigns: [
      {
        name: 'source',
        data: {
          target: 'LearningObject',
          child: false,
          registry: 'outcomes'
        }
      }
    ]
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
  COLLECTIONS.LearningObjectCollection
);

export class MongoDriver implements DataStore {
  private db: Db;
  constructor() {
    let dburi =
      process.env.NODE_ENV === 'production'
        ? process.env.CLARK_DB_URI.replace(
            /<DB_PASSWORD>/g,
            process.env.CLARK_DB_PWD
          )
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME)
        : process.env.CLARK_DB_URI_DEV.replace(
            /<DB_PASSWORD>/g,
            process.env.CLARK_DB_PWD
          )
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
    this.connect(dburi);
  }

  async connect(dburi: any): Promise<void> {
    try {
      this.db = await MongoClient.connect(dburi);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem connecting to database at ' + dburi + ':\n\t' + e
      );
    }
  }
  disconnect(): void {
    this.db.close();
  }

  public async searchOutcomes(
    filter: OutcomeFilter,
    limit?: number,
    page?: number
  ): Promise<{ total: number; outcomes: StandardOutcomeDocument[] }> {
    try {
      if (page !== undefined && page <= 0) page = 1;
      let skip = page && limit ? (page - 1) * limit : undefined;
      // let query: any = { $text: { $search: filter.text } };
      let query: any = { outcome: { $regex: new RegExp(filter.text, 'ig') } };
      delete filter.text;
      for (let prop in filter) {
        query[prop] = { $regex: new RegExp(filter[prop], 'ig') };
      }
      let docs = await this.db
        .collection(COLLECTIONS.StandardOutcome.name)
        .find(query);

      let total = await docs.count();

      docs =
        skip !== undefined
          ? docs.skip(skip).limit(limit)
          : limit ? docs.limit(limit) : docs;

      let outcomes = await docs.toArray();
      return { total: total, outcomes: outcomes };
    } catch (e) {
      return Promise.reject(e);
    }
  }
  public async suggestOutcomes(
    filter: OutcomeFilter,
    mode: suggestMode,
    threshold: number,
    limit?: number,
    page?: number
  ): Promise<{ total: number; outcomes: StandardOutcomeDocument[] }> {
    try {
      if (page !== undefined && page <= 0) page = 1;
      let skip = page && limit ? (page - 1) * limit : undefined;

      if (mode === 'text') {
        let text = `${filter.text ? filter.text : ''}`.trim();
        text = text
          .split(' ')
          .map(word => stemmer(word))
          .join(' ');
        console.log('STEMMED: ', text);
        delete filter.text;

        let query: any = { $text: { $search: text } };

        if (filter.name) query.name = { $regex: new RegExp(filter.name, 'ig') };
        delete filter.name;

        if (filter.source)
          query.source = { $regex: new RegExp(filter.source, 'ig') };
        delete filter.source;

        for (let prop in filter) {
          query[prop] = filter[prop];
        }

        let docs = await this.db
          .collection(COLLECTIONS.StandardOutcome.name)
          .aggregate([
            { $match: query },
            {
              $project: {
                _id: 1,
                author: 1,
                name: 1,
                date: 1,
                outcome: 1,
                source: 1,
                tag: 1,
                score: { $meta: 'textScore' }
              }
            },
            { $match: { score: { $gt: threshold } } }
          ])
          .sort({ score: { $meta: 'textScore' } });

        let arr = await docs.toArray();
        let total = arr.length;

        docs =
          skip !== undefined
            ? docs.skip(skip).limit(limit)
            : limit ? docs.limit(limit) : docs;

        let outcomes = await docs.toArray();
        return { total: total, outcomes: outcomes };
      } else {
        //TODO: Match via regex if requirement is different from basic searching....
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
