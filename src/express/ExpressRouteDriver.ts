import { Router } from 'express';
import * as SuggestionAdapter from '../Suggestion/ExpressRouteAdapter';
import * as SearchAdapter from '../Search/ExpressRouteAdapter';

// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressRouteDriver {
  public static buildRouter(): Router {
    let router: Router = Router();
    router.get('/', async (req, res) => {
      res.json({
        version,
        message: `Welcome to the Learning Outcome Suggestion' API v${version}`,
      });
    });
    router.use(SearchAdapter.buildRouter());
    router.use(SuggestionAdapter.buildRouter());
    return router;
  }
}
