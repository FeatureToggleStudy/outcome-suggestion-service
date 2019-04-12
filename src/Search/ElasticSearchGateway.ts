import 'dotenv/config';
import { OutcomeGateway } from './SearchInteractor';
import { StandardOutcome } from '@cyber4all/clark-entity';
import { OutcomeFilter } from '../Shared/OutcomeFilter';
import {
  queryGuidelines,
  buildPaginator,
  ElasticSearchQuery,
} from '../Shared/ElasticSearchHelpers';

const SEARCHABLE_FIELDS = ['author', 'source', 'name', 'outcome'];

export class ElasticSearchGateway implements Partial<OutcomeGateway> {
  private analyzers = {
    stop_words: 'stop',
  };
  /**
   * Performs search on guidelines using ElasticSearch node
   *
   * @param {OutcomeFilter} filter [Object containing search text and field queries]
   * @param {number} limit [The maximum amount results to return]
   * @param {number} page [The page of results to return]
   * @returns {Promise<{
   *     total: number;
   *     outcomes: StandardOutcome[];
   *   }>}
   * @memberof ElasticSearchGateway
   */
  searchOutcomes(
    filter: OutcomeFilter,
    limit?: number,
    page?: number,
  ): Promise<{
    total: number;
    outcomes: StandardOutcome[];
  }> {
    const query: ElasticSearchQuery = this.buildSearchQuery({
      filter,
      limit,
      page,
    });
    return queryGuidelines(query);
  }

  /**
   * Converts OutcomeFilter, page, and limit to valid a valid ElasticSearchQuery
   *
   * @private
   * @param  {OutcomeFilter} filter [Object containing search text and field queries]
   * @param {number} limit [The maximum amount results to return]
   * @param {number} page [The page of results to return]
   * @returns {ElasticSearchQuery}
   * @memberof ElasticSearchGateway
   */
  private buildSearchQuery({
    filter,
    page,
    limit,
  }: {
    filter: OutcomeFilter;
    page?: number;
    limit?: number;
  }): ElasticSearchQuery {
    let query: { [queryKey: string]: any } = {};
    let paginator = {};
    const fieldQuery = { ...filter };
    delete fieldQuery.text;

    const text = filter.text;

    if (Object.keys(fieldQuery).length > 0) {
      query = this.buildMultiMatchQuery({ fieldQuery, text });
    } else {
      query.query_string = {
        fields: SEARCHABLE_FIELDS,
        query: text || '*',
        analyzer: this.analyzers.stop_words,
      };
    }

    if (limit > 0) {
      paginator = buildPaginator({ limit, page });
    }

    return { query, ...paginator };
  }

  /**
   * Constructs multi-match ElasticSearch query based on search parameters
   *
   * @private
   * @param {[x: string]: string; text?: string; source?: string; name?: string; date?: string;} fieldQuery [Object containing field query keys and values]
   * @param {string} text [Query string text]
   * @returns {{ [queryKey: string]: any }}
   * @memberof ElasticSearchGateway
   */
  private buildMultiMatchQuery({
    fieldQuery,
    text,
  }: {
    fieldQuery: {
      [x: string]: string;
      source?: string;
      name?: string;
      date?: string;
    };
    text: string;
  }): { [queryKey: string]: any } {
    const searchableFields = SEARCHABLE_FIELDS.filter(
      field => Object.keys(fieldQuery).indexOf(field) === -1,
    );
    let multiMatchQuery = {
      bool: {
        // @ts-ignore Empty array assignment is valid
        must: [],
      },
    };

    if (text) {
      multiMatchQuery.bool.must.push({
        multi_match: {
          fields: searchableFields,
          query: text,
          analyzer: this.analyzers.stop_words,
        },
      });
    }

    multiMatchQuery = this.appendFieldMatchers({ fieldQuery, multiMatchQuery });

    return multiMatchQuery;
  }

  /**
   * Attaches match queries for each field query specified
   *
   * @private
   * @param {{[x: string]: string;source?: string;name?: string;date?: string;}} fieldQuery [Object containing field query keys and values]
   * @param {{bool: {must: any[]}}} multiMatchQuery [The existing query object to append field matchers to]
   * @returns  { [queryKey: string]: any }
   * @memberof ElasticSearchGateway
   */
  private appendFieldMatchers({
    fieldQuery,
    multiMatchQuery,
  }: {
    fieldQuery: {
      [x: string]: string;
      source?: string;
      name?: string;
      date?: string;
    };
    multiMatchQuery: {
      bool: {
        must: any[];
      };
    };
  }) {
    const fieldMatchQuery = { ...multiMatchQuery };
    const fieldQueryKeys = Object.keys(fieldQuery);
    for (const key of fieldQueryKeys) {
      const value = fieldQuery[key] != null ? fieldQuery[key] : '*';
      const matcher = { match: {} };
      matcher.match[`${key}.keyword`] = value;
      fieldMatchQuery.bool.must.push(matcher as any);
    }
    return fieldMatchQuery;
  }
}
