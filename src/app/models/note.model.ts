import { Deserializable } from '@models/deserialize.model';

export class Note implements Deserializable {
  _id: string;
  user: string;
  title: string;
  content: string;
  audio: string;
  contact: string;
  updated_at: Date;
  created_at: Date;
  assigned_contacts?: any[];
  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
