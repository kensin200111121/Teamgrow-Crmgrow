import { Deserializable } from '@models/deserialize.model';

export class Material implements Deserializable {
  original_id: string;
  user: any;
  team: any;
  title: string;
  description: string;
  url: any;
  path: string;
  type: string;
  material_type: string;
  folder: string;
  role: string;
  company: string;
  preview: string;
  thumbnail: string;
  thumbnail_path: string;
  custom_thumbnail: boolean;
  site_image: string;
  material_theme: string;
  priority: number;
  converted: string; // none | progress | completed
  uploaded: boolean;
  recording: boolean;
  duration: number;
  capture_form: any;
  enabled_capture: boolean;
  default_edited: boolean;
  is_sharable: boolean;
  is_download: boolean;
  default_video: string;
  default_pdf: string;
  default_image: string;
  has_shared: boolean;
  shared_video: string;
  shared_pdf: string;
  shared_image: string;
  videos: any[] = [];
  pdfs: any[] = [];
  images: any[] = [];
  del: boolean;
  created_at: Date;
  updated_at: Date;
  views: number;
  bucket: string;
  key: any;
  progress: number;
  in_template: boolean = false;
  view_mode: string = "scroll";
  _id: string;

  deserialize(input: any): this {
    const data = JSON.parse(JSON.stringify(input));
    if (data.capture_form) {
      if (typeof data.capture_form === 'string') {
        const capture_form = {};
        capture_form[data.capture_form] = 0;
        data.capture_form = capture_form;
      } else if (Array.isArray(data.capture_form)) {
        const capture_form = {};
        data.capture_form.forEach((e) => {
          capture_form[e] = 0;
        });
        data.capture_form = capture_form;
      }
    }
    return Object.assign(this, data);
  }
}
