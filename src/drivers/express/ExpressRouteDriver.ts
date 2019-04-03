import { DataStore } from '../../interfaces/DataStore';
import { Router } from 'express';
import { SuggestionInteractor } from '../../interactors/SuggestionInteractor';
import { OutcomeFilter, suggestMode } from '../../interfaces/DataStore';
import { StandardOutcome } from '@cyber4all/clark-entity';
import {searchOutcomes} from '../../Search/SearchInteractor';

// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressRouteDriver {
  constructor(private dataStore: DataStore) {}

  public static buildRouter(dataStore: DataStore): Router {
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
        const outcomePayload = await searchOutcomes({
          dataStore: this.dataStore,
          filter,
          limit,
          page,
        });

        outcomePayload.outcomes = outcomePayload.outcomes.map(
          outcome => outcome.toPlainObject() as StandardOutcome,
        );
        res.send(outcomePayload);
      } catch (e) {
        res.status(500).send(e);
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
        const outcomePayload = await SuggestionInteractor.suggestOutcomes(
          this.dataStore,
          filter,
          mode,
          scoreThreshold,
          limit,
          page,
        );
        outcomePayload.outcomes = outcomePayload.outcomes.map(
          outcome => outcome.toPlainObject() as StandardOutcome,
        );
        res.send(outcomePayload);
      } catch (e) {
        res.status(500).send(e);
      }
    });

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
