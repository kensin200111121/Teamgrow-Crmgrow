import { Deserializable } from '@models/deserialize.model';
export class CallLog implements Deserializable {
  _id: string;
  user: string;
  contact: string;
  content: string;
  rating: number;
  url: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  type: string;
  rvm_title: string;
  rvm_id: string;

  deserialize(input: any): this {
    Object.assign(this, input);
    return this;
  }
}
