import { Deserializable } from '@models/deserialize.model';

export class LeadForm implements Deserializable {
  _id: string;
  user: string;
  name: string;
  fields: any[];
  tags: any[];
  automation: string;
  capture_delay: number;
  capture_video: string;
  isAdmin: boolean;
  created_at: string;
  updated_at: string;
  trackerCount?: number;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
