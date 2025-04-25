import { Deserializable } from '@models/deserialize.model';

export class Timeline implements Deserializable {
  _id: string;
  user: string;
  status: string;
  due_date: Date;
  period: number;
  action: any;
  ref: string;
  parent_ref: string;
  activity: string;
  automation: string;
  condition: {
    case: string;
    answer: boolean;
  };
  watched_video: string;
  watched_pdf: string;
  watched_image: string;
  opened_email: string;
  contact: string;
  deal: string;
  text: string;
  finished_materials: string[];
  watched_materials: string[];
  created_at: Date;
  updated_at: Date;
  root: boolean;
  freeze_edit: boolean;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
