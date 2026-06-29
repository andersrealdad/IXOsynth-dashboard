export interface CuratedView {
  id: string;
  name: string;
  description: string;
  node_ids: string[];
}

export interface LensView {
  id: string;
  name: string;
  algorithm: string;
  description: string;
}

export interface ViewsData {
  curated: CuratedView[];
  lens: LensView[];
}
