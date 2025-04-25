import { Deserializable } from '@models/deserialize.model';

export class Video implements Deserializable {
  user: string;
  title: string;
  company: string;
  description: string;
  converted: string; // none | progress | completed
  uploaded: boolean;
  thumbnail: string;
  thumbnail_path: string;
  site_image: string;
  custom_thumbnail: boolean;
  preview: string;
  recording: boolean;
  path: string;
  type: string;
  duration: number;
  url: string;
  role: string;
  material_theme: string;
  default_edited: boolean;
  is_sharable: boolean;
  is_download: boolean;
  default_video: string;
  priority: number;
  created_at: Date;
  updated_at: Date;
  views: number;
  _v: number;
  _id: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
