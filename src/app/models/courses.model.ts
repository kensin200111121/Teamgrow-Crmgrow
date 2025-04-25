import { Deserializable } from '@models/deserialize.model';

export class Courses implements Deserializable {
  id: number;
  created_at: string | null;
  user_email: string | null;
  user_name: string | null;
  expiry_date: string | null;
  user_id: number | null;
  course_name: string | null;
  course_id: number | null;
  percentage_completed: string | null;
  completed_at: string | null;
  expired: boolean | null;
  is_free_trial: boolean | null;
  completed: boolean | null;
  started_at: string | null;
  activated_at: string | null;
  updated_at: string | null;
  description: string | null;
  banner_image_url: string | null;
  course_card_image_url: string | null;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
