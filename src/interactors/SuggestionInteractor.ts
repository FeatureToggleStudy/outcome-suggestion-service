
import assertNever from 'assert-never';

import { DataStore, Responder, Interactor } from '../interfaces/interfaces';

import {

    LearningObjectRecord, /* TODO: this import oughtn't be necessary */
} from '../../schema/schema';

import { ObjectSuggestion, OutcomeSuggestion } from 'clark-entity';

export type suggestMode = 'text' | 'regex';
export class SuggestionInteractor implements Interactor {

    private _responder: Responder;

    public set responder(responder: Responder) {
        this._responder = responder;
    }

    constructor(private dataStore: DataStore) { }


    /**
        * Search for outcomes related to a given text string.
        *
        * FIXME: We may want to transform this into a streaming algorithm,
        *       rather than waiting for schema -> entity conversion
        *       for the entire list. I don't know if there's a good way
        *       to do that, but the terms 'Buffer' and 'Readable' seem
        *       vaguely promising.
        *
        * @param {string} text the words to search for
        * @param {suggestMode} mode which suggestion mode to use:
        *      'text' - uses mongo's native text search query
        *      'regex' - matches outcomes containing each word in text
        * @param {number} threshold minimum score to include in results
        *      (ignored if mode is 'regex')
        *
        * @returns {Outcome[]} list of outcome suggestions, ordered by score
        */
    async suggestOutcomes(text: string, mode: suggestMode = 'text', threshold = 0, filter): Promise<void> {
        try {
            let suggestions: OutcomeSuggestion[] = [];

            let cursor;
            switch (mode) {
                case 'text':
                    cursor = this.dataStore.searchOutcomes(text)
                        .sort({ score: { $meta: 'textScore' } });
                    break;
                case 'regex': cursor = this.dataStore.matchOutcomes(text); break;
                default: this.responder.sendObject(assertNever(mode));
            }

            while (await cursor.hasNext()) {
                let doc = await cursor.next();
                let suggestion = {
                    id: doc._id,
                    author: doc.author,
                    name: doc.name_,
                    date: doc.date,
                    outcome: doc.outcome,
                };

                // if mode provides scoring information
                if (doc['score'] !== undefined) {
                    let score = doc['score'];

                    // skip record if score is lower than threshold
                    if (score < threshold) break;

                    /*
                     * TODO: Look into sorting options. An streaming insert
                     *       sort here may be better than mongo's,
                     *       if such a thing is possible
                     * In that case, switch break above to continue.
                     */

                }

                suggestions.push(suggestion);
            }

            let filtered = suggestions.filter((suggestion) => {
                for (let prop in filter) {
                    if (suggestion[prop] && suggestion[prop].indexOf(filter[prop]) < 0) {
                        return false; // leave out suggestion if it doesn't contain filter text
                    }
                }
                return true;
            });
            this.responder.sendObject(filtered);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    };

    /**
     * Search for objects by name, author, length, level, and content.
     * FIXME: implementation is rough and probably not as efficient as it could be
     *
     * @param {string} name the objects' names should closely relate
     * @param {string} author the objects' authors' names` should closely relate
     * @param {string} length the objects' lengths should match exactly
     * @param {string} level the objects' levels should match exactly TODO: implement
     * @param {string} content the objects' outcomes' outcomes should closely relate
     *
     * @returns {Outcome[]} list of outcome suggestions, ordered by score
     */
    async suggestObjects(
        name: string,
        author: string,
        length: string,
        level: string,
        content: string,
    ): Promise<void> {
        try {
            let objects: LearningObjectRecord[] = await this.dataStore.searchObjects(name, author, length, level, content);
            let suggestions: ObjectSuggestion[] = [];
            for (let object of objects) {
                let owner = await this.dataStore.fetchUser(object.authorID);
                suggestions.push({
                    id: object._id,
                    author: owner.name_,
                    length: object.length_,
                    name: object.name_,
                    date: object.date,
                });
            }
            this.responder.sendObject(suggestions);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    };
}

}