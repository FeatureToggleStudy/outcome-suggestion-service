import {Router} from 'express';
import {OutcomeFilter} from '../Shared/OutcomeFilter';
import {SuggestionInteractor} from './SuggestionInteractor';
import {StandardOutcome} from '@cyber4all/clark-entity';
import {MongoSuggestionGateway} from './MongoSuggestionGateway';
import {suggestMode} from './SuggestMode';
import {reportError} from '../Shared/SentryConnector';

export function buildRouter(): Router {
    // TODO: Experiment with a DI pattern or some other way of resolving dependencies at a higher level
    const dataStore = new MongoSuggestionGateway();

    const router: Router = Router();
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
                dataStore,
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
            reportError(e);
            res.status(500).send(e);
        }
    });
    return router;
}

