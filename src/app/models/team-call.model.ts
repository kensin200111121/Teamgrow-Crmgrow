import { Deserializable } from '@models/deserialize.model';

export class TeamCall implements Deserializable {
  _id: string;
  leader: string;
  team: string;
  guests: string[];
  contacts: string[];
  invites: any[];
  subject: string;
  description: string;
  duration: number;
  location: string;
  note: string;
  status: string;
  link: string;
  schedule_link: string;
  proposed_at: string[];
  confirmed_at: string;
  desired_at: string;
  updated_at: string;
  created_at: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
