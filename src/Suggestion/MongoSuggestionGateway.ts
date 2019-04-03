import { Collection } from 'mongodb';
import { OutcomeFilter } from '../Shared/OutcomeFilter';
import { suggestMode } from '../interfaces/DataStore';
import { StandardOutcome } from '@cyber4all/clark-entity';
import { StandardOutcomeDocument } from '@cyber4all/clark-schema';
import { COLLECTIONS } from '../drivers/MongoDriver';
import { MongoConnector } from '../Shared/MongoConnector';

export class MongoSuggestionGateway {
    private standardOutcomes: Collection<StandardOutcomeDocument>;

    constructor() {
        this.standardOutcomes = MongoConnector.getInstance()
            .mongoClient.db('onion')
            .collection<StandardOutcomeDocument>(COLLECTIONS.STANDARD_OUTCOMES);
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

            let docs = await this.standardOutcomes
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
                outcomes: outcomes.map(outcome => new StandardOutcome({
                    id: outcome._id,
                    date: `${outcome.date}`,
                    author: outcome.author,
                    name: outcome.name,
                    source: outcome.source,
                    outcome: outcome.outcome,
                })),
            };
        } catch (e) {
            return Promise.reject(e);
        }
    }
}
