import { Deserializable } from '@models/deserialize.model';
import { Contact } from '@models/contact.model';
export class Activity implements Deserializable {
  _id: string;
  user: string;
  content: string;
  type: string;
  appointments: string;
  follow_ups: string;
  notes: string;
  phone_logs: string;
  videos: string;
  video_trackers: string;
  pdfs: string;
  pdf_trackers: string;
  images: string;
  image_trackers: string;
  emails: string;
  email_trackers: string;
  sms: string;
  contacts: Contact;
  material_last: number;
  full_watched: boolean;
  send_type: number;
  subject: string;
  description: string;
  additional_field: any[];
  created_at: Date;
  updated_at: Date;
  assigned_id?: any;
  deserialize(input: any): this {
    Object.assign(this, input);
    this.contacts = new Contact().deserialize(input.contacts);
    return this;
  }
}
