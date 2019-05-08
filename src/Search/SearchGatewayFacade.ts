import { OutcomeGateway } from './SearchInteractor';
import { OutcomeFilter } from '../Shared/OutcomeFilter';
import { StandardOutcome } from '@cyber4all/clark-entity';
import { MongoSearchGateway } from './MongoSearchGateway';
import { ElasticSearchGateway } from './ElasticSearchGateway';

/**
 * SearchGatewayFacade is a means to abstract away the delegation of queries between
 * both Mongo and Elasticsearch. This way, only one data store that implements the
 * OutcomeGateway interface can be passed around, and underneath we have the option
 * of routing queries between the two services.
 *
 * @author Sean Donnelly
 */
export class SearchGatewayFacade implements OutcomeGateway {
  mongoGateway: MongoSearchGateway;
  elasticSearchGateway: ElasticSearchGateway;

  constructor() {
    this.mongoGateway = new MongoSearchGateway();
    this.elasticSearchGateway = new ElasticSearchGateway();
    const useElasticForSearch = process.env.ELASTIC_TOGGLE === 'true';
    this.searchOutcomes = useElasticForSearch
      ? (filter: OutcomeFilter, limit?: number, page?: number) => this.elasticSearchGateway.searchOutcomes(filter, limit, page)
      : (filter: OutcomeFilter, limit?: number, page?: number) => this.mongoGateway.searchOutcomes(filter, limit, page);
    console.log(`Configured to use ${useElasticForSearch ? 'ElasticSearch' : 'MongoDB'} for outcome search.`);
  }

  /**
   * This method is overridden when the SearchGatewayFacade is built. Depending on the existance
   * of the ELASTIC_TOGGLE to happen
   * just once when the class is constructed, rather than on each call to searchOutcomes.
   */
  searchOutcomes(
    filter: OutcomeFilter,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }> {
    throw new Error('No datastore has been set for search');
  }
  fetchSources(): Promise<string[]> {
    return this.mongoGateway.fetchSources();
  }
  fetchAreas(): Promise<{ _id: string; areas: string[] }[]> {
    return this.mongoGateway.fetchAreas();
  }
}
