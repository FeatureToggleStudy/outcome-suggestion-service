


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
fetchAllObjects(): Cursor<LearningObjectRecord>;
fetchMultipleObjects(ids: LearningObjectID[]): Cursor<LearningObjectRecord>;
suggestObjects(text: string, mode: suggestMode, threshold: number): Promise<ObjectSuggestion[]>;
suggestOutcomes(text: string, mode: suggestMode, threshold: number): Promise<OutcomeSuggestion[]>;
matchOutcomes(text: string): Cursor<OutcomeRecord>;
}