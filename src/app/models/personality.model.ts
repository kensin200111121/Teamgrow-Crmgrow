import { Deserializable } from '@models/deserialize.model';
import { Deal } from '@models/deal.model';
import { Contact } from '@models/contact.model';

export class Personality implements Deserializable {
  _id: string;
  user: string;
  title: string;
  content: string;
  role = 'user';
  created_at: Date;
  updated_at: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
