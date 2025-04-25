import { Deserializable } from '@models/deserialize.model';
import { ITrigger } from '@app/types/trigger';

export class Automation implements Deserializable {
  _id: string;
  original_id: string;
  user: string;
  title: string;
  company: string;
  automations: any[];
  role: string;
  type: string | undefined;
  isFolder: boolean;
  is_sharable: boolean;
  is_active: boolean;
  trigger?: ITrigger;
  description: string;
  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
