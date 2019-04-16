import 'dotenv/config';
import * as SearchInteractor from './SearchInteractor'
import { SearchGatewayFacade } from './SearchGatewayFacade';
import { OutcomeFilter } from '../Shared/OutcomeFilter';
import { MongoConnector } from '../Shared/MongoConnector';
import { generateDbURI } from '../Shared/GenerateDbURI';

describe('SearchInteractor', () => {
    process.env.NODE_ENV = 'development';
    let dataStore: SearchInteractor.OutcomeGateway;
    beforeAll(async () => {
        await MongoConnector.build(generateDbURI()).catch(e => {
            console.error(e);
        });
        dataStore = new SearchGatewayFacade();
    });
    it('should return all standard outcomes in the elastic search node', () => {
        const filter: OutcomeFilter = {};
        return SearchInteractor.searchOutcomes(
            {
                dataStore,
                filter,
            },
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
    it('should return all standard outcomes that include the specified text', () => {
        const filter: OutcomeFilter = {
            text: 'risk management',
        };
        return SearchInteractor.searchOutcomes(
            {
                dataStore,
                filter,
            },
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
    it('should return all standard outcomes under the specified author', () => {
        const filter: OutcomeFilter = {
            source: 'CS2013',
        };
        return SearchInteractor.searchOutcomes(
            {
                dataStore,
                filter,
            },
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
    it('should return all standard outcomes under the specified author and text', () => {
        const filter: OutcomeFilter = {
            text: 'risk management',
            source: 'CS2013',
        };
        return SearchInteractor.searchOutcomes(
            {
                dataStore,
                filter,
            },
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
    it('should return no standard outcomes for text that doesn\'t make sense', () => {
        const filter: OutcomeFilter = {
            text: 'riskfnsdfj fwjdbfabkjasaskdjfadj',
            source: 'CS2013',
        };
        return SearchInteractor.searchOutcomes(
            {
                dataStore,
                filter,
            },
        ).then(res => {
            expect(res.outcomes[0]).toEqual(undefined)
            expect(res.total).toEqual(expect.any(Number));
            console.log(res.total);
        });
    });
});
