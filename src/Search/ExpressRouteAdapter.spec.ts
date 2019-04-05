import * as SearchRouter from './ExpressRouteAdapter';
import * as supertest from 'supertest';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import {MongoConnector} from '../Shared/MongoConnector';
import {generateDbURI} from '../Shared/GenerateDbURI';

// Forces these tests to run in development, as we are currently using the dev db for our assertions
process.env.NODE_ENV = 'development';

/**
 * Theses test ensure that the responses sent from the search module routes are in compliance with the
 * APIs projected contract.
 */
describe('Search Routes', () => {
    let request: supertest.SuperTest<supertest.Test>;
    beforeAll(async (done) => {
        await MongoConnector.build(generateDbURI()).catch(e => {
            console.error(e);
        });
        const app = express();
        const router = SearchRouter.buildRouter();

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: true}));

        app.use(router);

        request = supertest(app);
        done();
    });
    describe('GET /outcomes/areas', () => {
        it('should return sources with their areas', () => {
            return request.get('/outcomes/areas')
                .expect(200)
                .then(response => {
                    expect(Array.isArray(response.body)).toBeTruthy();
                    expect(Array.isArray(response.body[0].areas)).toBeTruthy();
                });
        });
    });
    describe('GET /outcomes/sources', () => {
       it('should return an array populated with sources', () => {
           return request.get('/outcomes/sources')
               .expect(200)
               .then(response => {
                   expect(Array.isArray(response.body)).toBeTruthy();
                   expect(response.body.length > 0).toBeTruthy();
                   expect(typeof response.body[0] === 'string').toBeTruthy();
               });
       });
    });
    describe('GET /outcomes', () => {
        it('should return well formatted outcomes', () => {
            return request.get('/outcomes')
                .expect(200)
                .then(response => {
                    const outcome = response.body.outcomes[0];
                    expect(typeof outcome.id === 'string').toBeTruthy();
                    expect(typeof outcome.name === 'string').toBeTruthy();
                    expect(typeof outcome.author === 'string').toBeTruthy();
                    expect(typeof outcome.date === 'string').toBeTruthy();
                    expect(typeof outcome.source === 'string').toBeTruthy();
                    expect(typeof outcome.outcome === 'string').toBeTruthy();
                });
        });
    });
});

