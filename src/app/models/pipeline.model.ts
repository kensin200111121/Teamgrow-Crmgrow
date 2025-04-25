import { Deserializable } from '@models/deserialize.model';
import { DealStage } from './deal-stage.model';

export class Pipeline implements Deserializable {
  _id: string;
  user: string;
  title: string;
  user_name: string;
  created_at: Date;
  updated_at: Date;
  has_automation: boolean;
  no_automation: boolean;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
export class PipelineWithStages implements Deserializable {
  _id: string;
  detail: Pipeline;
  stages: DealStage[];
  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
