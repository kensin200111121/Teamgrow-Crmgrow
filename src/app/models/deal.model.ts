import { Deserializable } from '@models/deserialize.model';
import { Activity } from '@models/activity.model';
import { Contact } from '@models/contact.model';
import { User } from '@models/user.model';

export class Deal implements Deserializable {
  _id: string;
  user: string;
  primary_contact: string;
  contacts: Contact[] = [];
  deal_stage: string;
  title: string;
  additional_field: any;
  created_at: Date;
  updated_at: Date;
  put_at: Date;
  running_automation: boolean;
  price: number;
  close_date: Date;
  team_members: User[] = [];
  description: string;
  commission: {
    unit: string; // $ and %
    value: number;
  } = {
    unit: '$',
    value: 0
  };
  agent_price: number;
  team_price: number;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}

export interface TeamUser {
  user_name: string;
  picture_profile: string | null;
  _id: string | null;
}
