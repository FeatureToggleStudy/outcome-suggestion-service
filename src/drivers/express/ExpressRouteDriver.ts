import { ExpressResponder } from '../drivers';
import { DataStore, Responder } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { SuggestionInteractor } from '../../interactors/interactors';
import { User, LearningObject } from '@cyber4all/clark-entity';

const threshold = parseFloat(process.env.CLARK_LO_SUGGESTION_THRESHOLD);
const version = require('../../package.json').version;

export class ExpressRouteDriver {
  constructor(private dataStore: DataStore) {}

  public static buildRouter(dataStore: DataStore): Router {
    let e = new ExpressRouteDriver(dataStore);
    let router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private getResponder(response: Response): Responder {
    return new ExpressResponder(response);
  }

  private setRoutes(router: Router): void {
    router.get('/', async (req, res) => {
      res.json({
        version,
        message: `Welcome to the Learning Outcome Suggestion' API v${version}`
      });
    });
    router.get('/outcomes', async (req, res) => {
      let text = req.query.text;
      let filter = {
        source: req.query.author,
        name: req.query.name,
        date: req.query.date
      };
      for (let prop in filter) {
        if (!filter[prop]) delete filter[prop];
      }
      await SuggestionInteractor.suggestOutcomes(
        this.dataStore,
        this.getResponder(res),
        text,
        'text',
        threshold,
        filter
      );
    });
  }
}
