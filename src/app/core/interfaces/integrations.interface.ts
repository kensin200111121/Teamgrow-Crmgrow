export interface Integration {
  id: string;
  type: string;
  title: string;
  icon: string;
  summary: string;
  description: string;
  isConnected: boolean;
  popular: boolean;
  video: string;
  api_key?: string;
}
