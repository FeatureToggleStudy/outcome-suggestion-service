import {DataStore} from '../interfaces/interfaces';
import {OutcomeFilter, suggestMode} from '../interfaces/DataStore';

// @ts-ignore stopword does not have type definitions
import * as stopword from 'stopword';
import {StandardOutcome} from '@cyber4all/clark-entity';
import {sanitizeFilter, stemWords} from '../Shared/SanitizeFilter';

export class SuggestionInteractor {
  /**
   * Suggests Outcomes
   *
   * @static
   * @param {DataStore} dataStore
   * @param filter
   * @param {suggestMode} [mode='text']
   * @param {number} [threshold=0]
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<{ total: number; outcomes: StandardOutcome[] }>}
   */
  public static async suggestOutcomes(
    dataStore: DataStore,
    filter: OutcomeFilter,
    mode: suggestMode = 'text',
    threshold: number = 0,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }> {
    try {
      filter = sanitizeFilter(filter);
      filter.text = this.removeStopwords(filter.text);
      filter.text = stemWords(filter.text);
      return await dataStore.suggestOutcomes(
          filter,
          mode,
          threshold,
          limit,
          page,
      );
    } catch (e) {
      return Promise.reject(`Problem suggesting outcomes. Error: ${e}.`);
    }
  }

  /**
   * Fetches all Standard Outcome sources
   *
   * @static
   * @param {DataStore} dataStore
   * @returns {Promise<string[]>}
   * @memberof SuggestionInteractor
   */
  public static async fetchSources(dataStore: DataStore): Promise<string[]> {
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
  public static async fetchAreas(dataStore: DataStore): Promise<{ _id: string, areas: string[]}[]> {
    try {
      return dataStore.fetchAreas();
    } catch (e) {
      return Promise.reject(`Problem finding sources. Error: ${e}.`);
    }
  }

  /**
   * Returns string without stopwords
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static removeStopwords(text: string): string {
    const oldString = text.split(' ');
    text = stopword
      .removeStopwords(oldString)
      .join(' ')
      .trim();
    return text;
  }
}
