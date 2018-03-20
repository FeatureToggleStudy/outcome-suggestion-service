import { StandardOutcomeDocument } from '@cyber4all/clark-schema';

export interface DataStore {
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  searchOutcomes(
    filter: OutcomeFilter,
    limit?: number,
    page?: number
  ): Promise<{ total: number; outcomes: StandardOutcomeDocument[] }>;
  suggestOutcomes(
    filter: OutcomeFilter,
    mode: suggestMode,
    threshold: number,
    limit?: number,
    page?: number
  ): Promise<{ total: number; outcomes: StandardOutcomeDocument[] }>;
}

export type OutcomeFilter = {
  [key: string]: string;
  text?: string;
  source?: string;
  name?: string;
  date?: string;
};

export type suggestMode = 'text' | 'regex';
