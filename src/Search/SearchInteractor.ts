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
import {DataStore, OutcomeFilter} from '../interfaces/DataStore';
import {StandardOutcome} from '@cyber4all/clark-entity';
import {sanitizeFilter} from '../Shared/SanitizeFilter';

export async function searchOutcomes(params: {
    dataStore: DataStore;
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
