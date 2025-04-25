import { Deserializable } from '@models/deserialize.model';

export class Campaign implements Deserializable {
  _id: string;
  title: string;
  contacts: any[];
  mail_list: string;
  email_template: [];
  due_start: string;
  subject: string;
  content: string;
  videos: any[];
  pdfs: any[];
  images: any[];
  created_at: string;
  updated_at: string;
  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
