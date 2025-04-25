import { Deserializable } from '@models/deserialize.model';
export class PureActivity implements Deserializable {
  _id: string;
  user: string;
  content: string;
  type: string;
  appointments: string;
  follow_ups: string;
  notes: string;
  phone_logs: string;
  videos: any;
  video_trackers: string;
  pdfs: any;
  pdf_trackers: string;
  images: any;
  image_trackers: string;
  emails: string;
  email_trackers: string;
  texts: string;
  sms: string;
  contacts: string;
  users: string;
  material_last: number;
  full_watched: boolean;
  send_type: number;
  subject: string;
  description: string;
  created_at: Date;
  updated_at: Date;

  deserialize(input: any): this {
    Object.assign(this, input);
    return this;
  }
}

export class ActivityDetail implements Deserializable {
  _id: string;
  user: any;
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
  texts: string;
  sms: string;
  contacts: any;
  material_last: number;
  full_watched: boolean;
  send_type: number;
  subject: string;
  description: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}

export class DetailActivity extends PureActivity {
  group_id: string;
  activity_detail: any; // VIDEO_Tracker, PDF_Tracker, IMAGE_tracker, VIDEO, PDF, IMAGE, TASK, NOTE, PHONE_LOG
  contact_details: any[];
  video_trackers: any;
  image_trackers: any;
  pdf_trackers: any;
  email_trackers: any;
  text_trackers: any;
  activity: string;
  assigned_contacts: any[];
  assigned_id?: string;
  automations: string;
  parent_automations: string;
  automation_lines: string;
  sub_activities?: any[];

  deserialize(input: any): this {
    Object.assign(this, input);
    this.activity_detail = input.activity_detail
      ? input.activity_detail[0]
      : null;
    return this;
  }
}
