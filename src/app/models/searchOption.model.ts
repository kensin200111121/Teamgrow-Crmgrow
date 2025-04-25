import { DEFAULT_LIST_TYPE_IDS } from '@app/constants/variable.constants';
import { Deserializable } from '@models/deserialize.model';

export interface AnalyticsCondition {
  id: string;
  range?: number;
}

export interface ActivityCondition {
  type: string;
  detail?: string;
}

export interface CustomFieldCondition {
  column: string;
  type: string;
  include: boolean;
  condition: string;
  options: string[];
  start: Date;
  end: Date;
}

export interface AssigneeCondition {
  _id: string;
  user_name?: string;
}

class LastMaterialCondition implements Deserializable {
  send_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  send_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  send_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}

export class MaterialCondition implements Deserializable {
  watched_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_watched_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_watched_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_watched_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  sent_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  sent_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  sent_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_sent_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_sent_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_sent_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  isSet(): boolean {
    return (
      this.watched_video.flag ||
      this.watched_pdf.flag ||
      this.watched_image.flag ||
      this.not_watched_video.flag ||
      this.not_watched_pdf.flag ||
      this.not_watched_image.flag ||
      this.sent_video.flag ||
      this.sent_pdf.flag ||
      this.sent_image.flag ||
      this.not_sent_video.flag ||
      this.not_sent_pdf.flag ||
      this.not_sent_image.flag
    );
  }
}
export class SearchOption implements Deserializable {
  _id: string;
  searchStr = '';
  analyticsConditions: AnalyticsCondition[] = [];
  recruitingStageCondition: string[] = [];
  countryCondition: string[] = [];
  regionCondition: string[] = [];
  cityCondition: string[] = [];
  zipcodeCondition = '';
  tagsCondition: string[] = [];
  stagesCondition: string[] = [];
  sourceCondition: string[] = [];
  brokerageCondition: string[] = [];
  activityCondition: ActivityCondition[] = [];
  labelCondition: string[] = [];
  lastMaterial: LastMaterialCondition = new LastMaterialCondition();
  materialCondition: MaterialCondition = new MaterialCondition();
  includeLabel = true;
  includeUnsubscribed = true;
  includeLastActivity = true;
  includeBrokerage = true;
  includeSource = true;
  includeStage = true;
  includeTag = true;
  orTag = true;
  includeFollowUps = true;
  activityStart: Date;
  activityEnd: Date;
  assigneeCondition: AssigneeCondition[] = [];
  teamOptions: any = {};
  customFieldCondition: CustomFieldCondition[] = [];
  unsubscribed: {
    email: boolean;
    text: boolean;
  } = {
    email: false,
    text: false
  };
  listType: 'team' | 'private' | 'prospect' | 'assigned' | 'pending' | 'own' =
    'own';

  deserialize(input: any): this {
    Object.assign(this, input);
    this.materialCondition = new MaterialCondition().deserialize(
      this.materialCondition
    );
    this.lastMaterial = new LastMaterialCondition().deserialize(
      this.lastMaterial
    );
    return this;
  }

  isEmpty(): boolean {
    return (
      !this.analyticsConditions?.length &&
      !this.searchStr &&
      !this.labelCondition.length &&
      !this.recruitingStageCondition.length &&
      !(this.countryCondition && this.countryCondition.length) &&
      !this.regionCondition.length &&
      !this.cityCondition.length &&
      !this.zipcodeCondition &&
      !this.tagsCondition.length &&
      !this.stagesCondition.length &&
      !this.brokerageCondition.length &&
      !this.activityCondition.length &&
      !this.sourceCondition.length &&
      !this.lastMaterial.send_pdf.flag &&
      !this.lastMaterial.send_video.flag &&
      !this.lastMaterial.send_image.flag &&
      !this.lastMaterial.watched_video.flag &&
      !this.lastMaterial.watched_pdf.flag &&
      !this.lastMaterial.watched_image.flag &&
      !this.activityStart &&
      !this.activityEnd &&
      !this.materialCondition.isSet() &&
      !Object.keys(this.teamOptions).length &&
      !this.customFieldCondition.length &&
      !this.assigneeCondition.length &&
      !(this.unsubscribed?.email || this.unsubscribed?.text)
    );
  }

  getActiveOptions(): number {
    let count = 0;
    this.listType &&
      DEFAULT_LIST_TYPE_IDS.includes(this.listType) &&
      this.listType !== 'own' &&
      count++;
    this.searchStr && count++;
    this.labelCondition.length && count++;
    this.countryCondition && this.countryCondition.length && count++;
    this.regionCondition.length && count++;
    this.cityCondition && this.cityCondition.length && count++;
    this.zipcodeCondition && this.zipcodeCondition.length && count++;
    if (
      this.activityCondition.length ||
      this.lastMaterial.send_pdf.flag ||
      this.lastMaterial.send_video.flag ||
      this.lastMaterial.send_image.flag ||
      this.lastMaterial.watched_video.flag ||
      this.lastMaterial.watched_pdf.flag ||
      this.lastMaterial.watched_image.flag
    ) {
      count++;
    }
    this.activityStart && count++;
    this.activityEnd && count++;
    if (Object.keys(this.teamOptions).length) {
      count++;
    } else {
      this.materialCondition.isSet() && count++;
      this.stagesCondition.length && count++;
      this.brokerageCondition.length && count++;
      this.sourceCondition.length && count++;
      this.tagsCondition.length && count++;
    }
    if (this.analyticsConditions.length) {
      count += this.analyticsConditions.length;
    }
    this.assigneeCondition?.length && count++;
    if (this.unsubscribed?.email || this.unsubscribed?.text) {
      count++;
    }
    return count;
  }

  hasTeamOptions(): boolean {
    if (Object.keys(this.teamOptions).length) {
      return true;
    } else {
      return false;
    }
  }

  hasNoneShareOptions(): boolean {
    return !(
      !this.analyticsConditions?.length &&
      !this.recruitingStageCondition.length &&
      !this.tagsCondition.length &&
      !this.stagesCondition.length &&
      !this.brokerageCondition.length &&
      !this.activityCondition.length &&
      !this.sourceCondition.length &&
      !this.lastMaterial.send_pdf.flag &&
      !this.lastMaterial.send_video.flag &&
      !this.lastMaterial.send_image.flag &&
      !this.lastMaterial.watched_video.flag &&
      !this.lastMaterial.watched_pdf.flag &&
      !this.lastMaterial.watched_image.flag &&
      !this.activityStart &&
      !this.activityEnd &&
      !this.materialCondition.isSet() &&
      !this.customFieldCondition.length &&
      !this.assigneeCondition.length &&
      !(this.unsubscribed?.email || this.unsubscribed?.text)
    );
  }

  removeNoneShareOptions(): void {
    this.analyticsConditions = [];
    this.recruitingStageCondition = [];
    this.tagsCondition = [];
    this.stagesCondition = [];
    this.brokerageCondition = [];
    this.activityCondition = [];
    this.sourceCondition = [];
    this.lastMaterial = new LastMaterialCondition();
    this.materialCondition = new MaterialCondition();
    this.activityStart = undefined;
    this.activityEnd = undefined;
    this.customFieldCondition = [];
    this.assigneeCondition = [];
    this.unsubscribed = {
      email: false,
      text: false
    };
  }
}

export class TaskSearchOption implements Deserializable {
  str: string;
  status = 0;
  contact: string;
  types: string[];
  labels: string[];
  date_mode = 0; // 0 --> Sort by, 1 --> Filter(Start date, End date)
  start_date: string;
  end_date: string;
  name = 'all';
  countries: string[] = [];
  states: string[] = [];
  zipcode = '';
  tags: string[] = [];
  sources: string[] = [];
  companies: string[] = [];
  assigneeCondition: AssigneeCondition[] = [];

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get isActive(): boolean {
    if (
      this.str ||
      this.contact ||
      (this.labels && this.labels.length) ||
      this.start_date ||
      this.end_date ||
      (this.countries && this.countries.length) ||
      (this.states && this.states.length) ||
      (this.tags && this.tags.length) ||
      (this.sources && this.sources.length) ||
      (this.companies && this.companies.length) ||
      (this.assigneeCondition && this.assigneeCondition.length) ||
      this.zipcode
    ) {
      return true;
    }
    return false;
  }

  getActiveOptions(): number {
    let count = 0;
    this.str && count++;
    this.contact && count++;
    this.types && this.types.length && count++;
    this.labels && this.labels.length && count++;
    (this.start_date || this.end_date) && count++;
    this.countries && this.countries.length && count++;
    this.states && this.states.length && count++;
    this.tags && this.tags.length && count++;
    this.sources && this.sources.length && count++;
    this.companies && this.companies.length && count++;
    this.assigneeCondition && this.assigneeCondition.length && count++;
    this.zipcode && count++;
    return count;
  }

  isEmpty(): boolean {
    return (
      !this.str &&
      !(this.status !== 0) &&
      !this.contact &&
      !(this.types && this.types.length) &&
      !(this.labels && this.labels.length) &&
      !(this.start_date || this.end_date) &&
      !(this.countries && this.countries.length) &&
      !(this.states && this.states.length) &&
      !(this.tags && this.tags.length) &&
      !(this.sources && this.sources.length) &&
      !(this.companies && this.companies.length) &&
      !(this.assigneeCondition && this.assigneeCondition.length) &&
      !this.zipcode
    );
  }
}
export class TaskDurationOption implements Deserializable {
  start_date: string;
  end_date: string;
  status = 0;
  name: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
