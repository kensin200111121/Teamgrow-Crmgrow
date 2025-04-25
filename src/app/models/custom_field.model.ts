import { Deserializable } from '@models/deserialize.model';

export class CustomField implements Deserializable {
  _id: string;
  id?: string;
  user: string;
  name: string;
  type: string;
  placeholder: string;
  format: string;
  status: boolean;
  kind: string;
  created_at: string;
  updated_at: string;

  deserialize(input: any): this {
    Object.assign(this, input);
    this.id = this._id;

    return this;
  }
}
