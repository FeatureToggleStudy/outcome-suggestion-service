// @ts-ignore stopword does not have type definitions
import * as stopword from 'stopword';
import {StandardOutcome} from '@cyber4all/clark-entity';
import {sanitizeFilter, stemWords} from '../Shared/SanitizeFilter';
import {OutcomeFilter} from '../Shared/OutcomeFilter';
import {suggestMode} from './SuggestMode';

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
    dataStore: SuggestionGateway,
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

export interface SuggestionGateway {
  suggestOutcomes(
      filter: OutcomeFilter,
      mode: suggestMode,
      threshold: number,
      limit?: number,
      page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }>;
}
