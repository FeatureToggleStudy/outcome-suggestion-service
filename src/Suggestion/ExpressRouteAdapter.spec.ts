import * as supertest from 'supertest';
import {MongoConnector} from '../Shared/MongoConnector';
import {generateDbURI} from '../Shared/GenerateDbURI';
import * as SuggestionRouter from './ExpressRouteAdapter';
import * as bodyParser from 'body-parser';
import * as express from 'express';

// Forces these tests to run in development, as we are currently using the dev db for our assertions
process.env.NODE_ENV = 'development';

/**
 * Theses test ensure that the responses sent from the suggest module routes are in compliance with the
 * APIs projected contract.
 *
 * NOTE:
 * For this test to pass, a standard outcome must match the text search for "web applications"
 */
describe('Suggestion Routes', function () {
    let request: supertest.SuperTest<supertest.Test>;
    beforeAll(async (done) => {
        await MongoConnector.build(generateDbURI()).catch(e => {
            console.error(e);
        });
        const app = express();
        const router = SuggestionRouter.buildRouter();

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: true}));

        app.use(router);

        request = supertest(app);
        done();
    });
    describe('GET /outcomes/suggest', () => {
        it('should return well formatted outcomes', () => {
            return request.get('/outcomes/suggest?text=web%20application')
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
