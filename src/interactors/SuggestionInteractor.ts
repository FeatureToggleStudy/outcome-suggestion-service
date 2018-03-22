import { DataStore, Responder } from '../interfaces/interfaces';
import { suggestMode, OutcomeFilter } from '../interfaces/DataStore';
import * as spellcheck from 'spellchecker';
import * as stemmer from 'stemmer';

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
    if (filter.text) {
      filter.text = this.correctSpellings(filter.text);
    }
    return filter;
  }

  private static correctSpellings(text: string): string {
    let fixedTxt = text;
    let corrections = spellcheck.checkSpelling(text);
    for (let pos of corrections) {
      let old = text.substring(pos.start, pos.end);
      let possibleCorrections = spellcheck.getCorrectionsForMisspelling(old);
      let fixed = this.getHighestScoredCorrection(possibleCorrections);
      fixedTxt = fixedTxt.replace(old, fixed);
    }
    return fixedTxt;
  }

  private static getHighestScoredCorrection(possible: string[]): string {
    let scores: Map<string, number> = new Map<string, number>();
    for (let word of possible) {
      let stem = stemmer(word);
      if (scores.has(stem)) {
        let oldScore = scores.get(stem);
        scores.set(stem, ++oldScore);
      } else {
        scores.set(stem, 1);
      }
    }
    let correction = { word: '', score: 0 };
    scores.forEach((score, word) => {
      if (score > correction.score) {
        correction.score = score;
        correction.word = word;
      }
    });
    return correction.word;
  }
}
