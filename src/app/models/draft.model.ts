import { Deserializable } from '@models/deserialize.model';

export class Draft implements Deserializable {
  _id: string;
  user: string;
  subject: string;
  content: string;
  type: string;
  contact: string;
  deal: string;
  created_at: Date;
  updated_at: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
