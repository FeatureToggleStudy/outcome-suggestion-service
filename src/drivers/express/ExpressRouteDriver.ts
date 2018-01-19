import { ExpressResponder } from "../drivers";
import { DataStore, Responder } from "../../interfaces/interfaces";
import { Router, Response } from 'express';
import { SuggestionInteractor, LearningObjectInteractor } from '../../interactors/interactors'
import { User, LearningObject } from "clark-entity";

const threshold = parseFloat(process.env.CLARK_LO_SUGGESTION_THRESHOLD);

export class ExpressRouteDriver {

    private _SuggestionInteractor: SuggestionInteractor;
    private _LearningObjectInteractor: LearningObjectInteractor;

    constructor(private dataStore: DataStore) {
        this._SuggestionInteractor = new SuggestionInteractor(dataStore);
        this._LearningObjectInteractor = new LearningObjectInteractor(dataStore);
    }

    public static buildRouter(dataStore: DataStore): Router {
        let e = new ExpressRouteDriver(dataStore);
        let router: Router = Router();
        e.setRoutes(router);
        return router
    }

    private getResponder(response: Response): Responder {
        return new ExpressResponder(response);
    }

    private setRoutes(router: Router): void {
        router.post('/suggestOutcomes', async (req, res) => {
            let text = req.body.text;
            let filter = req.body.filter;

            //Set Responder
            this._SuggestionInteractor.responder = this.getResponder(res);

            await this._SuggestionInteractor.suggestOutcomes(text, 'text', threshold, filter);
        });

        router.post('/suggestObjects', async (req, res) => {
            let name = req.body.name;
            let author = req.body.author;
            let length = req.body.length;
            let level = req.body.level;
            let content = req.body.content;

            //Set Responder
            this._SuggestionInteractor.responder = this.getResponder(res);
            await this._SuggestionInteractor.suggestObjects(name, author, length, level, content);
        });

        router.post('/fetchAllObjects', async (req, res) => {
            //Set Responder
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.fetchAllObjects();
        });

        router.post('/fetchMultipleObjects', async (req, res) => {
            let ids = req.body.ids;
            this._LearningObjectInteractor.responder = this.getResponder(res);

            await this._LearningObjectInteractor.fetchMultipleObjects(ids);
        });

    }
}