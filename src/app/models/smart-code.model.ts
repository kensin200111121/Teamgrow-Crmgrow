import { Deserializable } from '@models/deserialize.model';

export class SmartCode implements Deserializable {
  code: string;
  tag: string;
  message: string;
  automation: string;
  automation_detail: any;
  thumbnail: string;
  preview: string;
  material_count: number;
  video_ids: any[];
  pdf_ids: any[];
  image_ids: any[];

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get tags(): string[] {
    if (!this.tag) {
      return [];
    }
    return this.tag.split(',');
  }
}
