import { StandardOutcome } from '@cyber4all/clark-entity';
export interface DataStore {
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  searchOutcomes(
    filter: OutcomeFilter,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }>;
  suggestOutcomes(
    filter: OutcomeFilter,
    mode: suggestMode,
    threshold: number,
    limit?: number,
    page?: number,
  ): Promise<{ total: number; outcomes: StandardOutcome[] }>;
  fetchSources(): Promise<string[]>;
  fetchAreas(): Promise<{ _id: string, areas: string[]}>;
}

export interface OutcomeFilter {
  [key: string]: string;
  text?: string;
  source?: string;
  name?: string;
  date?: string;
}

export type suggestMode = 'text' | 'regex';
