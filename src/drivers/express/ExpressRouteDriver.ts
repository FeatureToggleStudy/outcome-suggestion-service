import { ExpressResponder } from "../drivers";
import { DataStore, Responder } from "../../interfaces/interfaces";
import { Router, Response } from 'express';
import { SuggestionInteractor } from '../../interactors/interactors'
import { User, LearningObject } from "@cyber4all/clark-entity";

const threshold = parseFloat(process.env.CLARK_LO_SUGGESTION_THRESHOLD);

export class ExpressRouteDriver {

    private _SuggestionInteractor: SuggestionInteractor;

    constructor(private dataStore: DataStore) {
        this._SuggestionInteractor = new SuggestionInteractor(dataStore);
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


    }
}