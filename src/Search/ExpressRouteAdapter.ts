import {OutcomeFilter} from '../Shared/OutcomeFilter';
import {fetchAreas, fetchSources, searchOutcomes} from './SearchInteractor';
import {StandardOutcome} from '@cyber4all/clark-entity';
import {Router} from 'express';
import {MongoSearchGateway} from './MongoSearchGateway';

export function buildRouter() {
    const dataStore = new MongoSearchGateway();

    const router = Router() ;
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
                dataStore,
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
    router.get('/outcomes/sources', async (req, res) => {
        try {
            const sources = await fetchSources(this.dataStore);
            // TODO: Should this be JSON?
            res.status(200).send(sources);
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    });
    router.get('/outcomes/areas', async (req, res) => {
        try {
            const areas = await fetchAreas(this.dataStore);
            res.json(areas);
        } catch (e) {
            res.status(500).send('Internal Server Error');
        }
    });
    return router;
}
