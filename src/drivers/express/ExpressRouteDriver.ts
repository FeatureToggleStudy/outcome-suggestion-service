import { ExpressResponder } from '../drivers';
import { DataStore, Responder } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { SuggestionInteractor } from '../../interactors/interactors';
import { User, LearningObject } from '@cyber4all/clark-entity';

const threshold = parseFloat(process.env.CLARK_LO_SUGGESTION_THRESHOLD);

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
    router.get('/outcomes', async (req, res) => {
      let text = req.query.text;
      let filter = req.query.filter;

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
