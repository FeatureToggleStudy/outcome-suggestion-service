import { OutcomeGateway } from './SearchInteractor';
import { OutcomeFilter } from '../Shared/OutcomeFilter';
import { StandardOutcome } from '@cyber4all/clark-entity';
import { MongoSearchGateway } from './MongoSearchGateway';

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

  constructor() {
    this.mongoGateway = new MongoSearchGateway();
  }
  searchOutcomes(filter: OutcomeFilter, limit?: number, page?: number): Promise<{ total: number; outcomes: StandardOutcome[]; }> {
    return this.mongoGateway.searchOutcomes(filter, limit, page);
  }
  fetchSources(): Promise<string[]> {
    return this.mongoGateway.fetchSources();
  }
  fetchAreas(): Promise<{ _id: string; areas: string[]; }[]> {
    return this.mongoGateway.fetchAreas();
  }
}
