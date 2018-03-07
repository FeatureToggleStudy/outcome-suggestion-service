import { Cursor } from 'mongodb';
import { StandardOutcomeDocument } from '@cyber4all/clark-schema';

export interface DataStore {
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  searchOutcomes(text: string): Cursor<StandardOutcomeDocument>;
  matchOutcomes(text: string): Cursor<StandardOutcomeDocument>;
}
