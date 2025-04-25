import { Deserializable } from '@models/deserialize.model';

export class Template implements Deserializable {
  _id: string;
  original_id: string;
  user: string;
  title = '';
  subject = '';
  content = '';
  role: string;
  company: string;
  video_ids: string[] = [];
  pdf_ids: string[] = [];
  image_ids: string[] = [];
  token_ids: string[] = [];
  attachments: string[];
  type = 'email';
  default: boolean;
  is_sharable: boolean;
  created_at: string;
  updated_at: string;
  isFolder: boolean;
  templates: string[] = [];
  folder = '';
  meta = {
    excerpt: ''
  };
  original_version: string;
  version: 0;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
