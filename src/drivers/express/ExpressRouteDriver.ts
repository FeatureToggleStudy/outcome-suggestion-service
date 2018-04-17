import { ExpressResponder } from '../drivers';
import { DataStore, Responder } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { SuggestionInteractor } from '../../interactors/interactors';
import { User, LearningObject } from '@cyber4all/clark-entity';
import { OutcomeFilter, suggestMode } from '../../interfaces/DataStore';
import * as businesscards from '../../business-cards/business-cards';

const threshold = parseFloat(process.env.CLARK_LO_SUGGESTION_THRESHOLD);
// tslint:disable-next-line:no-require-imports
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
        message: `Welcome to the Learning Outcome Suggestion' API v${version}`,
      });
    });
    router.get('/outcomes', async (req, res) => {
      try {
        let filter: OutcomeFilter = {
          text: req.query.text ? req.query.text : '',
          source: req.query.author,
          name: req.query.name,
          date: req.query.date,
        };
        let page = req.query.page ? +req.query.page : undefined;
        let limit = req.query.limit ? +req.query.limit : undefined;
        await SuggestionInteractor.searchOutcomes(
          this.dataStore,
          this.getResponder(res),
          filter,
          page,
          limit,
        );
      } catch (e) {
        console.log(e);
      }
    });
    router.get('/outcomes/suggest', async (req, res) => {
      try {
        const mode: suggestMode = 'text';
        const scoreThreshold: number = process.env.SUGGESTION_THRESHOLD
          ? +process.env.SUGGESTION_THRESHOLD
          : 0;
        let filter: OutcomeFilter = {
          text: req.query.text ? req.query.text : '',
          source: req.query.author,
          name: req.query.name,
          date: req.query.date,
        };
        let page = req.query.page ? +req.query.page : undefined;
        let limit = req.query.limit ? +req.query.limit : undefined;
        await SuggestionInteractor.suggestOutcomes(
          this.dataStore,
          this.getResponder(res),
          filter,
          mode,
          scoreThreshold,
          limit,
          page,
        );
      } catch (e) {
        console.log(e);
      }
    });
    // FIXME: Remove from Outcome Suggestion if feature is removed or expanded
    router.get('/users/:username/cards', async (req, res) => {
      try {
        const first_name = req.query.fname;
        const last_name = req.query.lname;
        let org = req.query.org;
        const user_name = req.params.username;

        const responder = this.getResponder(res);

        org = org.replace(/"/g, '');

        businesscards.fillPdf(responder, first_name, last_name, user_name, org);
      } catch (e) {
        console.log(e);
      }
    });
  }
}
