import { DataStore } from '../interfaces/interfaces';
import { suggestMode, OutcomeFilter } from '../interfaces/DataStore';
// @ts-ignore spellchecker does not have type definitions
import * as spellcheck from 'spellchecker';
// @ts-ignore stopword does not have type definitions
import * as stopword from 'stopword';
import * as stemmer from 'stemmer';
import { StandardOutcome } from '@cyber4all/clark-entity';

export class SuggestionInteractor {
  /**
   * Suggests Outcomes
   *
   * @static
   * @param {DataStore} dataStore
   * @param {suggestMode} [mode='text']
   * @param {number} [threshold=0]
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<{ total: number; outcomes: StandardOutcome[] }>}
   * @memberof SuggestionInteractor
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
      filter = this.sanitizeFilter(filter);
      filter.text = this.removeStopwords(filter.text);
      filter.text = this.stemWords(filter.text);
      const suggestions = await dataStore.suggestOutcomes(
        filter,
        mode,
        threshold,
        limit,
        page,
      );
      return suggestions;
    } catch (e) {
      return Promise.reject(`Problem suggesting outcomes. Error: ${e}.`);
    }
  }
  /**
   * Searches Outcomes
   *
   * @static
   * @param {DataStore} dataStore
   * @param {OutcomeFilter} filter
   * @param {number} [limit]
   * @param {number} [page]
   * @returns {Promise<{ total: number; outcomes: StandardOutcome[] }>}
   * @memberof SuggestionInteractor
   */
  public static async searchOutcomes(params: {
    dataStore: DataStore;
    filter: OutcomeFilter;
    limit?: number;
    page?: number;
  }): Promise<{ total: number; outcomes: StandardOutcome[] }> {
    try {
      params.filter = this.sanitizeFilter(params.filter);
      const suggestions = await params.dataStore.searchOutcomes(
        params.filter,
        params.limit,
        params.page,
      );
      return suggestions;
    } catch (e) {
      return Promise.reject(`Problem searching outcomes. Error: ${e}.`);
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

  public static async fetchAreas(dataStore: DataStore): Promise<{ _id: string, areas: string[]}> {
    try {
      return dataStore.fetchAreas();
    } catch (e) {
      return Promise.reject(`Problem finding sources. Error: ${e}.`);
    }
  }

  /**
   * Removes undefined properties in Outcome Filter
   *
   * @private
   * @static
   * @param {OutcomeFilter} filter
   * @returns {OutcomeFilter}
   * @memberof SuggestionInteractor
   */
  private static sanitizeFilter(filter: OutcomeFilter): OutcomeFilter {
    for (const prop in filter) {
      if (!filter[prop]) {
        delete filter[prop];
      }
    }
    if (filter.text) {
      filter.text = filter.text.trim();
      filter.text = this.correctSpellings(filter.text);
    } else {
      filter.text = '';
    }
    return filter;
  }
  /**
   * Replaces misspelled word with highest weighted stemmed correction
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static correctSpellings(text: string): string {
    let fixedTxt = text;
    const corrections = spellcheck.checkSpelling(text);
    for (const pos of corrections) {
      const old = text.substring(pos.start, pos.end);
      const possibleCorrections = spellcheck.getCorrectionsForMisspelling(old);
      let fixed = this.getHighestWeightedCorrection(possibleCorrections);
      fixedTxt = fixedTxt.replace(old, fixed);
    }
    return fixedTxt;
  }
  /**
   * Gets stem of each correction and assigns weights based on frequency of stem.
   *
   * @private
   * @static
   * @param {string[]} possible
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static getHighestWeightedCorrection(possible: string[]): string {
    const scores: Map<string, number> = new Map<string, number>();
    for (const word of possible) {
      const stem = this.stemWords(word);
      if (scores.has(stem)) {
        let oldScore = scores.get(stem);
        scores.set(stem, ++oldScore);
      } else {
        scores.set(stem, 1);
      }
    }
    const correction = { word: '', score: 0 };
    scores.forEach((score, word) => {
      if (score > correction.score) {
        correction.score = score;
        correction.word = word;
      }
    });
    return correction.word;
  }
  /**
   * Returns stems for words in a string
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   * @memberof SuggestionInteractor
   */
  private static stemWords(text: string): string {
    text = text
      .split(' ')
      .map(word => stemmer(word))
      .join(' ')
      .trim();
    return text;
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
