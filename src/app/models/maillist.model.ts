import { Deserializable } from '@models/deserialize.model';

export class MailList implements Deserializable {
  _id: string;
  title: string;
  contacts: any[];
  created_at: string;
  updated_at: string;
  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
