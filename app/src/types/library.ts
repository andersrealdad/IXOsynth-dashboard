import type { ShowStyle } from './graph';

export interface LibraryMedia {
  url: string;
  thumb: string;
  poster: string;
  duration_s: number;
}

export interface LibraryItem {
  id: string;
  title: string;
  show_style: ShowStyle;
  group: number;
  duration_s: number;
  media: LibraryMedia[];
  data?: { rows: Record<string, unknown>[] };
}

export interface LibraryData {
  items: LibraryItem[];
}
