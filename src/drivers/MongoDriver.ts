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
} from '../../schema/db.schema';

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
} from '../../schema/schema';
export { ObjectID as DBID };

import { DataStore } from "../interfaces/DataStore";

export class MongoDriver implements DataStore {
    constructor(private db: Db) { }

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
     * Return literally all objects. Very expensive.
     * @returns {Cursor<LearningObjectRecord>[]} cursor of literally all objects
     */
    fetchAllObjects(): Cursor<LearningObjectRecord> {
        return this.db.collection(collectionFor(LearningObjectSchema))
            .find<LearningObjectRecord>();
    }

    /**
     * Fetchs the learning object documents associated with the given ids.
     *
     * @param ids array of database ids
     *
     * @returns {Cursor<LearningObjectRecord>[]}
     */
    fetchMultipleObjects(ids: LearningObjectID[]): Cursor<LearningObjectRecord> {
        return this.db.collection(collectionFor(LearningObjectSchema))
            .find<LearningObjectRecord>({ _id: { $in: ids } });
    }

    /* Search for objects on CuBE criteria.
    *
    * TODO: Efficiency very questionable.
    *      Convert to streaming algorithm if possible.
    *
    * TODO: behavior is currently very strict (ex. name, author must exactly match)
    *       Consider text-indexing these fields to exploit mongo $text querying.
    */
    async searchObjects(
        name: string,
        author: string,
        length: string,
        level: string,
        content: string,
    ): Promise<LearningObjectRecord[]> {
        try {
            let all: LearningObjectRecord[] = await this.fetchAllObjects().toArray();
            let results: LearningObjectRecord[] = [];
            for (let object of all) {
                if (name && object.name_ !== name) continue;
                if (author) {
                    let record = await this.db.collection(collectionFor(UserSchema))
                        .findOne<UserRecord>({ _id: object.authorID });
                    if (record.name_ !== author) continue;
                }
                if (length && object.length_ !== length) continue;
                /**
                 * TODO: implement level
                 */
                if (content) {
                    let tokens = content.split(/\s/);
                    let docs: any[] = [];
                    for (let token of tokens) {
                        docs.push({ outcome: { $regex: token } });
                    }
                    /**
                     * TODO: perhaps not all tokens should be needed for a single outcome?
                     *      That is, if one outcome has half the tokens and another
                     *      has the other half, the object should still match?
                     */
                    let count = await this.db.collection(collectionFor(StandardOutcomeSchema))
                        .count({
                            source: object._id,
                            $and: docs,
                        });
                    /**
                     * TODO: objects should also match if any outcomes' mappings match desired content
                     */
                    if (count === 0) continue;
                }
                results.push(object);
            }
            return Promise.resolve(results);
        } catch (e) {
            return Promise.reject('Error suggesting objects' + e);
        }
    }

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