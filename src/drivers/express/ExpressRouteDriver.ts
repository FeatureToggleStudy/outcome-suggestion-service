import { DataStore } from '../../interfaces/DataStore';
import { Router } from 'express';
import { SuggestionInteractor } from '../../Suggestion/SuggestionInteractor';
import * as SuggestionAdapter from '../../Suggestion/ExpressRouteAdapter';
import * as SearchAdapter from '../../Search/ExpressRouteAdapter';
import { MongoDriver } from '../MongoDriver';

// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressRouteDriver {
  constructor(private dataStore: DataStore) {}

  public static buildRouter(): Router {
    const dataStore = new MongoDriver();
    let e = new ExpressRouteDriver(dataStore);
    let router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private setRoutes(router: Router): void {
    router.get('/', async (req, res) => {
      res.json({
        version,
        message: `Welcome to the Learning Outcome Suggestion' API v${version}`,
      });
    });
    router.use(SearchAdapter.buildRouter());
    router.use(SuggestionAdapter.buildRouter());

    router.get('/outcomes/sources', async (req, res) => {
      try {
        const sources = await SuggestionInteractor.fetchSources(this.dataStore);
        // TODO: Should this be JSON?
        res.status(200).send(sources);
      } catch (e) {
        console.error(e);
        res.sendStatus(500);
      }
    });
    router.get('/outcomes/areas', async (req, res) => {
      try {
        const areas = await SuggestionInteractor.fetchAreas(this.dataStore);
        res.json(areas);
      } catch (e) {
        res.status(500).send('Internal Server Error');
      }
    });
  }
}
