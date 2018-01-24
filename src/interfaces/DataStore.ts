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
} from 'clark-schema'

import { Cursor } from 'mongodb';

export interface DataStore {
    connect(dburi: string): Promise<void>;
    disconnect(): void;
    fetchUser(id: UserID): Promise<UserRecord>;
    searchOutcomes(text: string): Cursor<OutcomeRecord>;
    matchOutcomes(text: string): Cursor<OutcomeRecord>;
}