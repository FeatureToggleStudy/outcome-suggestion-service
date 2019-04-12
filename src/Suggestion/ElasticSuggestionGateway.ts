import 'dotenv/config';
import { SuggestionGateway } from './SuggestionInteractor';
import { StandardOutcome } from '@cyber4all/clark-entity';
import { OutcomeFilter } from '../Shared/OutcomeFilter';
import {
  buildPaginator,
  queryGuidelines,
  ElasticSearchQuery,
} from '../Shared/ElasticSearchHelpers';
import { suggestMode } from './SuggestMode';

export class ElasticSuggestionGateway implements SuggestionGateway {
  private analyzers = {
    stop_words: 'stop',
  };
  suggestOutcomes(
    filter: OutcomeFilter,
    _: suggestMode,
    __: number,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }> {
    const query: ElasticSearchQuery = this.buildSearchQuery({
      filter,
      limit,
      page,
    });

    return queryGuidelines(query);
  }

  private buildSearchQuery({
    filter,
    limit,
    page,
  }: {
    filter: OutcomeFilter;
    limit?: number;
    page?: number;
  }): ElasticSearchQuery {
    let paginator = {};
    let query = {
      query_string: {
        query: filter.text,
        analyzer: this.analyzers.stop_words,
      },
    };
    if (limit > 0) {
      paginator = buildPaginator({ limit, page });
    }
    return { query, ...paginator };
  }
}
