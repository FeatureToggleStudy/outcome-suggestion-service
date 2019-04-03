import {StandardOutcome} from '@cyber4all/clark-entity';
import {sanitizeFilter} from '../Shared/SanitizeFilter';
import {OutcomeFilter} from '../Shared/OutcomeFilter';

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

/**
 * Fetches all Standard Outcome sources
 *
 * @static
 * @param {OutcomeGateway} dataStore
 * @returns {Promise<string[]>}
 */
export async function fetchSources(dataStore: OutcomeGateway): Promise<string[]> {
    try {
        return dataStore.fetchSources();
    } catch (e) {
        return Promise.reject(`Problem finding sources. Error: ${e}.`);
    }
}

/**
 * Fetches all areas of each standard outcome, grouped by source.
 *
 * @param dataStore the gateway to the outcome datastore
 */
export async function fetchAreas(dataStore: OutcomeGateway): Promise<{ _id: string, areas: string[] }[]> {
    try {
        return dataStore.fetchAreas();
    } catch (e) {
        return Promise.reject(`Problem finding sources. Error: ${e}.`);
    }
}

export interface OutcomeGateway {
    searchOutcomes(
        filter: OutcomeFilter,
        limit?: number,
        page?: number,
    ): Promise<{ total: number; outcomes: StandardOutcome[] }>;
    fetchSources(): Promise<string[]>;
    fetchAreas(): Promise<{ _id: string, areas: string[]}[]>;
}
