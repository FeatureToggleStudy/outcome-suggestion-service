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
    let query: {
      [queryKey: string]: any,
    } = {};
    let paginator = { from: 0, size: 0 };
    const defaultLimit = 20;
    let post_filter: {
      bool: {
        must: any[],
      },
    };
    const fieldQuery = { ...filter };
    delete fieldQuery.text;

    const text = filter.text;
    const hasText = text || text.length > 0;
    if (hasText) {
      query = this.buildMultiMatchQuery({ fieldQuery, text });
    } else {
      query.query_string = {
        fields: SEARCHABLE_FIELDS,
        query: '*',
      };
    }


    limit = limit || defaultLimit;
    paginator = buildPaginator({ limit, page });

    if (fieldQuery.source || fieldQuery.date) {
      post_filter = this.appendPostFilterStage({ fieldQuery });
    }

    return { query, post_filter, ...paginator };
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
    let searchableFields = SEARCHABLE_FIELDS;
    if (fieldQuery && Object.keys(fieldQuery).length) {
      searchableFields = SEARCHABLE_FIELDS.filter(
        field => Object.keys(fieldQuery).indexOf(field) === -1,
      );
    }
    const multiMatchQuery = {
      bool: {
        should: [
          {
            multi_match: {
              fields: searchableFields,
              query: text,
              fuzziness: 'AUTO',
              slop: 3,
              analyzer: 'stop',
            },
          },
          {
            match_phrase_prefix: {
              outcome: {
                query: text,
                max_expansions: 4,
                slop: 3,
              },
            },
          },
          {
            match_phrase_prefix: {
              name: {
                query: text,
                max_expansions: 4,
                slop: 3,
              },
            },
          },
        ],
      }
    };


    return multiMatchQuery;
  }

  /**
   * Attaches match queries for each field query specified
   *
   * @private
   * @param {{[x: string]: string;source?: string;name?: string;date?: string;}} fieldQuery [Object containing field query keys and values]
   * @returns  { post_filter: {bool: { must: any[] } } }
   * @memberof ElasticSearchGateway
   */
  private appendPostFilterStage({
    fieldQuery,
  }: {
    fieldQuery: {
      [x: string]: string;
      source?: string;
      name?: string;
      date?: string;
    };
  }) {
    let postFilterQuery = {
      bool: {
        // @ts-ignore Empty array assignment is valid
        must: [],
      },
    };

    const fieldQueryKeys = Object.keys(fieldQuery);
    for (const key of fieldQueryKeys) {
      const value = fieldQuery[key] != null ? fieldQuery[key] : '*';
      const filter = { term: {} };
      filter.term[`${key}.keyword`] = value;
      postFilterQuery.bool.must.push(filter as any);
    }
    return postFilterQuery;

  }
}
