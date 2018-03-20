import assertNever from 'assert-never';

import { DataStore, Responder } from '../interfaces/interfaces';
import { suggestMode, OutcomeFilter } from '../interfaces/DataStore';

export class SuggestionInteractor {
  /**
   * Suggests Outcomes
   *
   * @static
   * @param {DataStore} dataStore
   * @param {Responder} responder
   * @param {OutcomeFilter} filter
   * @param {suggestMode} [mode='text']
   * @param {number} [threshold=0]
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<void>}
   * @memberof SuggestionInteractor
   */
  public static async suggestOutcomes(
    dataStore: DataStore,
    responder: Responder,
    filter: OutcomeFilter,
    mode: suggestMode = 'text',
    threshold: number = 0,
    limit?: number,
    page?: number
  ): Promise<void> {
    try {
      filter = this.sanitizeFilter(filter);
      let suggestions = await dataStore.suggestOutcomes(
        filter,
        mode,
        threshold,
        limit,
        page
      );
      responder.sendObject(suggestions);
    } catch (e) {
      responder.sendOperationError(`Problem suggesting outcomes. Error: ${e}.`);
    }
  }
  /**
   * Searches Outcomes
   *
   * @static
   * @param {DataStore} dataStore
   * @param {Responder} responder
   * @param {OutcomeFilter} filter
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<void>}
   * @memberof SuggestionInteractor
   */
  public static async searchOutcomes(
    dataStore: DataStore,
    responder: Responder,
    filter: OutcomeFilter,
    limit?: number,
    page?: number
  ): Promise<void> {
    try {
      filter = this.sanitizeFilter(filter);
      let suggestions = await dataStore.searchOutcomes(filter, limit, page);
      responder.sendObject(suggestions);
    } catch (e) {
      responder.sendOperationError(`Problem searching outcomes. Error: ${e}.`);
    }
  }
  /**
   * Removes undefined propeties in Outcome Filter
   *
   * @private
   * @static
   * @param {OutcomeFilter} filter
   * @returns {OutcomeFilter}
   * @memberof SuggestionInteractor
   */
  private static sanitizeFilter(filter: OutcomeFilter): OutcomeFilter {
    for (let prop in filter) {
      if (!filter[prop]) delete filter[prop];
    }
    return filter;
  }
}
