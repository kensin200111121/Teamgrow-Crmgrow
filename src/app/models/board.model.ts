import { DealStage } from '@models/deal-stage.model';

export class Board {
  constructor(public name: string, public dealStages: DealStage[]) {}
}
