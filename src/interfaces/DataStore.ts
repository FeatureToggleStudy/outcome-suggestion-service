export interface DataStore {
  fetchSources(): Promise<string[]>;
  fetchAreas(): Promise<{ _id: string, areas: string[]}[]>;
}

export type suggestMode = 'text' | 'regex';
