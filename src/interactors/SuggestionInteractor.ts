
import assertNever from 'assert-never';

import { DataStore, Responder, Interactor } from '../interfaces/interfaces';

import {
    LearningObjectRecord, /* TODO: this import oughtn't be necessary */
} from '@cyber4all/clark-schema';

import { ObjectSuggestion, OutcomeSuggestion } from '@cyber4all/clark-entity';

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
    async suggestOutcomes(text: string, mode: suggestMode = 'text', threshold: number = 0, filter:any): Promise<void> {
        try {
            let suggestions: OutcomeSuggestion[] = [];
            let cursor;
            switch (mode) {
                case 'text':
                    cursor = this.dataStore.searchOutcomes(text)
                        .sort({ score: { $meta: 'textScore' } });
                    break;
                case 'regex': cursor = this.dataStore.matchOutcomes(text); break;
                default: this._responder.sendObject(assertNever(mode));
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
            this._responder.sendObject(filtered);
        } catch (e) {
            this._responder.sendOperationError(e);
        }
    };
}