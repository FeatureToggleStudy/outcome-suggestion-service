import * as stemmer from 'stemmer';
// @ts-ignore spellchecker does not have type definitions
import * as spellcheck from 'spellchecker';
import {OutcomeFilter} from './OutcomeFilter';

/**
 * Removes undefined properties in Outcome Filter
 *
 * @private
 * @static
 * @param {OutcomeFilter} filter
 * @returns {OutcomeFilter}
 */
export function sanitizeFilter(filter: OutcomeFilter): OutcomeFilter {
    for (const prop in filter) {
        if (!filter[prop]) {
            delete filter[prop];
        }
    }
    if (filter.text) {
        filter.text = filter.text.trim();
        filter.text = correctSpellings(filter.text);
    } else {
        filter.text = '';
    }
    return filter;
}
/**
 * Returns stems for words in a string
 *
 * @private
 * @static
 * @param {string} text
 * @returns {string}
 */
export function stemWords(text: string): string {
    text = text
        .split(' ')
        .map(word => stemmer(word))
        .join(' ')
        .trim();
    return text;
}
/**
 * Gets stem of each correction and assigns weights based on frequency of stem.
 *
 * @private
 * @static
 * @param {string[]} possible
 * @returns {string}
 */
function getHighestWeightedCorrection(possible: string[]): string {
    const scores: Map<string, number> = new Map<string, number>();
    for (const word of possible) {
        const stem = stemWords(word);
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
 * Replaces misspelled word with highest weighted stemmed correction
 *
 * @private
 * @static
 * @param {string} text
 * @returns {string}
 */
function correctSpellings(text: string): string {
    let fixedTxt = text;
    const corrections = spellcheck.checkSpelling(text);
    for (const pos of corrections) {
        const old = text.substring(pos.start, pos.end);
        const possibleCorrections = spellcheck.getCorrectionsForMisspelling(old);
        let fixed = getHighestWeightedCorrection(possibleCorrections);
        fixedTxt = fixedTxt.replace(old, fixed);
    }
    return fixedTxt;
}
