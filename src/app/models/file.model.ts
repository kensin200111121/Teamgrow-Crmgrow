import { Deserializable } from '@models/deserialize.model';

export class File implements Deserializable {
  name: string;
  user: string;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
