import { Deserializable } from '@models/deserialize.model';

export class Invoice implements Deserializable {
  id: string;
  customer: string;
  description: string;
  status: string;
  amount: number;
  date: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
