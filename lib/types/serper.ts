// Serper.dev API Types

export interface SerperScrapeRequest {
  url: string;
}

export interface SerperScrapeResponse {
  text?: string;
  html?: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  author?: string;
  date?: string;
  lang?: string;
  [key: string]: any;
}

export interface SerperSearchRequest {
  q: string; // search query
  gl?: string; // country code (e.g., 'us', 'tr')
  hl?: string; // language (e.g., 'en', 'tr')
  num?: number; // number of results
  page?: number; // page number
}

export interface SerperSearchResult {
  position: number;
  title: string;
  link: string;
  snippet?: string;
  date?: string;
  [key: string]: any;
}

export interface SerperSearchResponse {
  searchParameters: {
    q: string;
    gl: string;
    hl: string;
    num: number;
    type: string;
  };
  organic?: SerperSearchResult[];
  answerBox?: any;
  knowledgeGraph?: any;
  relatedSearches?: Array<{ query: string }>;
  credits?: number;
  [key: string]: any;
}

export interface SerperError {
  error: string;
  message: string;
  statusCode?: number;
}
