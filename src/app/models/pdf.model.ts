import { Deserializable } from '@models/deserialize.model';

export class Pdf implements Deserializable {
  user: string;
  title: string;
  description: string;
  preview: string;
  type: string;
  url: string;
  role: string;
  default_edited: boolean;
  is_sharable: boolean;
  is_download: boolean;
  default_pdf: string;
  del: boolean;
  created_at: Date;
  updated_at: Date;
  views: number;
  _id: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
