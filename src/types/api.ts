export interface DiscoverRequest {
  city: string;
  country: string;
  countryCode: string;
}

export interface DiscoverResponse {
  status: 'cached' | 'running' | 'error';
  jobId?: string;
  galleries?: import('./gallery').Gallery[];
  error?: string;
}

export interface JobStatus {
  status: 'running' | 'done' | 'error';
  progress: number;
  total: number;
  message: string;
  galleries?: import('./gallery').Gallery[];
  error?: string;
}
