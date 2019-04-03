import {Collection} from 'mongodb';
import {StandardOutcomeDocument} from '@cyber4all/clark-schema';
import {MongoConnector} from '../Shared/MongoConnector';
import {COLLECTIONS} from '../drivers/MongoDriver';
import {OutcomeFilter} from '../Shared/OutcomeFilter';
import {StandardOutcome} from '@cyber4all/clark-entity';

export class MongoSearchGateway {
    private standardOutcomes: Collection<StandardOutcomeDocument>;

    constructor() {
        this.standardOutcomes = MongoConnector.getInstance()
            .mongoClient.db('onion')
            .collection<StandardOutcomeDocument>(COLLECTIONS.STANDARD_OUTCOMES);
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
            let docs = await this.standardOutcomes
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
