/**
 * Searches Outcomes
 *
 * @static
 * @param {DataStore} dataStore
 * @param {OutcomeFilter} filter
 * @param {number} [limit]
 * @param {number} [page]
 * @returns {Promise<{ total: number; outcomes: StandardOutcome[] }>}
 */
import {DataStore} from '../interfaces/DataStore';
import {StandardOutcome} from '@cyber4all/clark-entity';
import {sanitizeFilter} from '../Shared/SanitizeFilter';
import {OutcomeFilter} from '../Shared/OutcomeFilter';

export async function searchOutcomes(params: {
    dataStore: OutcomeGateway;
    filter: OutcomeFilter;
    limit?: number;
    page?: number;
}): Promise<{ total: number; outcomes: StandardOutcome[] }> {
    try {
        params.filter = sanitizeFilter(params.filter);
        return await params.dataStore.searchOutcomes(
            params.filter,
            params.limit,
            params.page,
        );
    } catch (e) {
        return Promise.reject(`Problem searching outcomes. Error: ${e}.`);
    }
}

export interface OutcomeGateway {
    searchOutcomes(
        filter: OutcomeFilter,
        limit?: number,
        page?: number,
    ): Promise<{ total: number; outcomes: StandardOutcome[] }>;
}
