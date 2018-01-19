import { DataStore, Responder, Interactor } from '../interfaces/interfaces';

import {
    LearningObjectRecord, /* TODO: this import oughtn't be necessary */
} from '../../schema/schema';

import { LearningObject, User } from 'clark-entity';


export class LearningObjectInteractor implements Interactor {

    private _responder: Responder;

    public set responder(responder: Responder) {
        this._responder = responder;
    }

    constructor(private dataStore: DataStore) { }


    async fetchAllObjects(): Promise<void> {
        try {
            let records = await this.dataStore.fetchAllObjects().toArray();
            let objects: LearningObject[] = [];
            for (let doc of records) {
                let authorRecord = await this.dataStore.fetchUser(doc.author);
                let author = new User(authorRecord.username, authorRecord.name_, null, null);
                let object = new LearningObject(author, '');
                object.name = doc.name_;
                object.date = doc.date;
                object.length = doc.length_;
                objects.push(object);
            }
            this.responder.sendObject(objects);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    }

    // FIXME: IDs will be replaced with {username: string, learningObjectName: string}[]
    async fetchMultipleObjects(ids: string[]): Promise<void> {
        try {
            // FIXME: IDs will be replaced with {username: string, learningObjectName: string}[]
            let records = await this.dataStore.fetchMultipleObjects([]).toArray();
            let objects: LearningObject[] = [];
            for (let doc of records) {
                let authorRecord = await this.dataStore.fetchUser(doc.author);
                let author = new User(authorRecord.username, authorRecord.name_, null, null);
                let object = new LearningObject(author, '');
                object.name = doc.name_;
                object.date = doc.date;
                object.length = doc.length_;
                objects.push(object);
            }
            this.responder.sendObject(objects);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    }


}