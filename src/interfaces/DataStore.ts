


import {
    Record, Update, Insert, Edit,
    RecordID, UserID, LearningObjectID, OutcomeID,
    LearningOutcomeID, StandardOutcomeID,
    UserSchema, UserRecord, UserUpdate, UserInsert, UserEdit,
    LearningObjectSchema, LearningObjectRecord, LearningObjectUpdate,
    LearningObjectInsert, LearningObjectEdit,
    LearningOutcomeSchema, LearningOutcomeRecord, LearningOutcomeUpdate,
    LearningOutcomeInsert, LearningOutcomeEdit,
    StandardOutcomeSchema, StandardOutcomeRecord, StandardOutcomeUpdate,
    StandardOutcomeInsert, StandardOutcomeEdit,
    OutcomeRecord,
} from '../../schema/schema';

import { Cursor } from 'mongodb';

export interface DataStore {
    connect(dburistring): Promise<void>;
    disconnect(): void;
    fetchUser(id: UserID): Promise<UserRecord>;
    fetchAllObjects(): Cursor<LearningObjectRecord>;
    fetchMultipleObjects(ids: { username: string, learningObjectName: string }[]): Cursor<LearningObjectRecord>;
    searchObjects(namestring, authorstring, lengthstring, levelstring, contentstring): Promise<LearningObjectRecord[]>;
    searchOutcomes(textstring): Cursor<OutcomeRecord>;
    matchOutcomes(textstring): Cursor<OutcomeRecord>;
}