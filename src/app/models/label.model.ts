import { Deserializable } from '@models/deserialize.model';

export class Label implements Deserializable {
  _id: string;
  user: string;
  name: string;
  color: string;
  font_color: string;
  role: string;
  company: string;
  priority: number;
  created_at: string;
  updated_at: string;
  mine: boolean = false;
  count: number = 0;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
