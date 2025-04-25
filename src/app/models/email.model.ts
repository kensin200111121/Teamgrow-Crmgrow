import { Deserializable } from '@models/deserialize.model';
import { Deal } from '@models/deal.model';
import { Contact } from '@models/contact.model';

export class Email implements Deserializable {
  _id: string;
  user: string;
  subject: string;
  content: string;
  type: string;
  to: string[];
  cc: string[];
  bcc: string[];
  message_id: string;
  email_message_id: string;
  contacts: Contact[];
  deal: Deal;
  created_at: Date;
  updated_at: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
