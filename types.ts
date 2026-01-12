export type CategoryType = 'emotion' | 'plot' | 'reasoning';

export interface AnalysisItem {
  id: string;
  category: CategoryType;
  text: string;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  items: AnalysisItem[];
}

export interface AppState {
  animeTitle: string;
  episodes: Episode[];
}