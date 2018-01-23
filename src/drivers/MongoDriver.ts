import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';

import {
    autosFor,
    fixedsFor,
    foreignsFor,
    fieldsFor,
    collections,
    collectionFor,
    schemaFor,
    foreignData,
} from 'clark-schema';

import {
    Record, Update, Insert, Edit,
    RecordID, UserID, LearningObjectID, OutcomeID,
    LearningOutcomeID, StandardOutcomeID,
    UserSchema, UserRecord, UserUpdate, UserInsert, UserEdit,
    LearningObjectSchema, LearningObjectRecord, LearningObjectUpdate,
    LearningObjectInsert, LearningObjectEdit,
    LearningOutcomeSchema, LearningOutcomeRecord, LearningOutcomeUpdate,
    LearningOutcomeInsert, LearningOutcomeEdit,
    StandardOutcomeSchema, StandardOutcomeRecord, StandardOutcomeUpdate,
    StandardOutcomeInsert, StandardOutcomeEdit,
    OutcomeRecord,
} from 'clark-schema';
export { ObjectID as DBID };

import { DataStore } from "../interfaces/DataStore";
import * as dotenv from 'dotenv';
dotenv.config();

export class MongoDriver implements DataStore {
    private db: Db;
    constructor() {
        let dburi = process.env.NODE_ENV === 'production' ?
            process.env.CLARK_DB_URI.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD).replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT).replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME)
            : process.env.CLARK_DB_URI_DEV.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD).replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT).replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
        this.connect(dburi);
    }

    async connect(dburi: any): Promise<void> {
        try {
            this.db = await MongoClient.connect(dburi);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem connecting to database at ' + dburi + ':\n\t' + e);
        }
    }
    disconnect(): void {
        this.db.close();
    }

    /**
         * Fetch the user document associated with the given id.
         * @async
         *
         * @param id database id
         *
         * @returns {UserRecord}
         */
    async fetchUser(id: UserID): Promise<UserRecord> {
        return this.fetch<UserRecord>(UserSchema, id);
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
     * @returns {Cursor<OutcomeRecord>} cursor of positive matches
     */
    searchOutcomes(text: string): Cursor<OutcomeRecord> {
        return this.db.collection(collectionFor(StandardOutcomeSchema))
            .find<OutcomeRecord>(
            { $text: { $search: text } },
            { score: { $meta: 'textScore' } });
    }

    /**
     * Find outcomes matching a text query.
     * This variant finds all outcomes containing every word in the query.
     * @param {string} text the words to match against
     *
     * @returns {Cursor<OutcomeRecord>} cursor of positive matches
     */
    matchOutcomes(text: string): Cursor<OutcomeRecord> {
        let tokens = text.split(/\s/);
        let docs: any[] = [];
        for (let token of tokens) {
            docs.push({ outcome: { $regex: token } });
        }

        // score property is not projected, will be undefined in documents
        return this.db.collection(collectionFor(StandardOutcomeSchema))
            .find<OutcomeRecord>({
                $and: docs,
            });
    }

    ////////////////////////////////////////////////
    // GENERIC HELPER METHODS - not in public API //
    ////////////////////////////////////////////////

    /**
     * Fetch a database record by its id.
     * @param {Function} schema provides collection information
     * @param {RecordID} id the document to fetch
     */
    private async fetch<T>(schema: Function, id: RecordID): Promise<T> {
        let record = await this.db.collection(collectionFor(schema)).findOne<T>({ _id: id });
        if (!record) return Promise.reject('Problem fetching a ' + schema.name + ':\n\tInvalid database id ' + JSON.stringify(id));
        return Promise.resolve(record);
    }

}