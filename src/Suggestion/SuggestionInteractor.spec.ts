import 'dotenv/config';
import { SuggestionInteractor } from './SuggestionInteractor';
import { OutcomeFilter } from '../Shared/OutcomeFilter';
import { MongoConnector } from '../Shared/MongoConnector';
import { generateDbURI } from '../Shared/GenerateDbURI';
import { OutcomeGateway } from '../Search/SearchInteractor';
import { ElasticSuggestionGateway } from './ElasticSuggestionGateway';

describe('SearchInteractor', () => {
    process.env.NODE_ENV = 'development';
    let dataStore: ElasticSuggestionGateway;
    beforeAll(async () => {
        await MongoConnector.build(generateDbURI()).catch(e => {
            console.error(e);
        });
        dataStore = new ElasticSuggestionGateway();
    });
    it('should return all standard outcomes in the elastic search node matching the specified query', () => {
        const filter: OutcomeFilter = {
            text: 'risk management',
        };
        return SuggestionInteractor.suggestOutcomes(
                dataStore,
                filter,
        ).then(res => {
            expect(res.outcomes[0]).toMatchObject({
                id: expect.any(String),
                author: expect.any(String),
                source: expect.any(String),
                name: expect.any(String),
                date: expect.any(String),
                outcome: expect.any(String),
            });
            expect(res.total).toEqual(expect.any(Number));
        });
    });
    it('should return no standard outcomes', () => {
        const filter: OutcomeFilter = {
            text: ' ',
        };
        return SuggestionInteractor.suggestOutcomes(
                dataStore,
                filter,
        ).then(res => {
            expect(res.total).toEqual(0);
        });
    });
});
