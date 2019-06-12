import { OutcomeFilter } from './OutcomeFilter';

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
  } else {
    filter.text = '';
  }
  return filter;
}
