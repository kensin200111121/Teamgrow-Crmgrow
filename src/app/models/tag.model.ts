import { Deserializable } from '@models/deserialize.model';

export class Tag implements Deserializable {
  _id: string;
  count: number;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
