import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';

export { ObjectID as DBID };

import { DataStore } from '../interfaces/DataStore';
import * as dotenv from 'dotenv';
import { StandardOutcomeDocument } from '@cyber4all/clark-schema';
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

  /////////////////
  // TEXT SEARCH //
  /////////////////

  /**
   * Find outcomes matching a text query.
   * This variant uses Mongo's fancy text query. Questionable results.
   * NOTE: this function also projects a score onto the cursor documents
   *
   * @param {string} text the words to search for
   *
   * @returns {Cursor<StandardOutcomeDocument>} cursor of positive matches
   */
  searchOutcomes(text: string): Cursor<StandardOutcomeDocument> {
    return this.db
      .collection(COLLECTIONS.StandardOutcome.name)
      .find<StandardOutcomeDocument>(
        { $text: { $search: text } },
        { score: { $meta: 'textScore' } }
      );
  }

  /**
   * Find outcomes matching a text query.
   * This variant finds all outcomes containing every word in the query.
   * @param {string} text the words to match against
   *
   * @returns {Cursor<StandardOutcomeDocument>} cursor of positive matches
   */
  matchOutcomes(text: string): Cursor<StandardOutcomeDocument> {
    let tokens = text.split(/\s/);
    let docs: any[] = [];
    for (let token of tokens) {
      docs.push({ outcome: { $regex: token } });
    }

    // score property is not projected, will be undefined in documents
    return this.db
      .collection(COLLECTIONS.StandardOutcome.name)
      .find<StandardOutcomeDocument>({
        $and: docs
      });
  }
}
