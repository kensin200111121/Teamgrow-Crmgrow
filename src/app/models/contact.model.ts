import { DetailActivity, PureActivity } from '@models/activityDetail.model';
import { Deserializable } from '@models/deserialize.model';
import { Timeline } from '@models/timeline.model';
import * as _ from 'lodash';
import { isValidPhone, validateEmail } from '@app/helper';
import { USER_FEATURES } from '@app/constants/feature.constants';

export class Contact implements Deserializable {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  user: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  label: string;
  cell_phone: string;
  country: string;
  auto_follow_up: string;
  source: string;
  brokerage: string;
  tags: string[];
  recruiting_stage: string;
  deal_stage: string;
  website: string;
  secondary_email: string;
  secondary_phone: string;
  additional_field: any = {};
  last_activity: string;
  lastest_message: string;
  lastest_at: Date;
  unread: boolean;
  response: string; // calendar response status: not for contact
  rate: number;
  automation_off: Date;
  favorite: boolean;
  rate_lock: boolean;
  owner: string;
  pending_users: string[];
  unsubscribed: any = {};
  updated_at?: Date;
  contacted_at?: Date;
  sphere_bucket_id?: string;
  should_contact: boolean;
  action_score?: number;
  type?: string; // share, transfer, clone, avm action type
  prospect_id?: string;
  phones: {
    value: string;
    type: string;
    isPrimary: boolean;
  }[];
  emails: {
    value: string;
    type: string;
    isPrimary: boolean;
  }[];
  addresses: any[];
  birthday: {
    year: number;
    month: string;
    day: number;
  };
  customFields?: any[];
  shared_team: string[];
  shared_all_member: boolean;

  deserialize(input: any): this {
    Object.assign(this, input);

    if (!input?.emails?.length) {
      this.emails = [];
      if (this.email) {
        this.emails.push({ value: this.email, type: '', isPrimary: true });
      }
      if (this.secondary_email) {
        this.emails.push({
          value: this.secondary_email,
          type: '',
          isPrimary: false
        });
      }
    }
    if (!input?.phones?.length) {
      this.phones = [];
      if (this.cell_phone) {
        this.phones.push({ value: this.cell_phone, type: '', isPrimary: true });
      }
      if (this.secondary_phone) {
        this.phones.push({
          value: this.secondary_phone,
          type: '',
          isPrimary: false
        });
      }
    }
    if (!input?.addresses?.length) {
      this.addresses = [];
      if (this.country || this.state || this.city || this.address || this.zip) {
        this.addresses.push({
          country: this.country,
          state: this.state,
          city: this.city,
          street: this.address,
          zip: this.zip,
          type: '',
          isPrimary: true
        });
      }
    }
    if (!this.birthday) {
      this.birthday = { year: 1970, month: undefined, day: undefined };
    }
    if (!this.emails?.length) {
      this.emails = [{ value: '', type: '', isPrimary: true }];
    }
    if (!this.phones?.length) {
      this.phones = [{ value: '', type: '', isPrimary: true }];
    }
    return this;
  }

  get toConatct2I(): Contact2I {
    return new Contact2I().deserialize({
      _id: this._id,
      id: this._id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      user: this.user,
      address: this.address,
      city: this.city,
      state: this.state,
      zip: this.zip,
      label: this.label,
      cell_phone: this.cell_phone,
      country: this.country,
      auto_follow_up: this.auto_follow_up,
      source: this.source,
      brokerage: this.brokerage,
      tags: this.tags,
      recruiting_stage: this.recruiting_stage,
      deal_stage: this.deal_stage,
      website: this.website,
      secondary_email: this.secondary_email,
      secondary_phone: this.secondary_phone,
      additional_field: this.additional_field,
      last_activity: this.last_activity,
      lastest_message: this.lastest_message,
      lastest_at: this.lastest_at,
      unread: this.unread,
      response: this.response,
      favorite: this.favorite,
      rate: this.rate,
      automation_off: this.automation_off,
      prospect_id: this.prospect_id
    });
  }

  get fullName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name;
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  get avatarName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name[0] + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name.substring(0, 2);
    } else if (this.last_name) {
      return this.last_name.substring(0, 2);
    } else {
      return 'UN';
    }
  }

  get shortName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed';
    }
  }

  get fullAddress(): string {
    return `${this.address ? this.address + ' ' : ''}${
      this.city ? this.city + ' ' : ''
    }${this.state ? this.state + ' ' : ''}${
      this.country ? this.country + ' ' : ''
    }${this.zip ? this.zip + ' ' : ''}`;
  }

  get shortAddress(): string {
    if (!this.city && !this.state && !this.country) {
      return '---';
    } else {
      const comps = [this.city, this.state, this.country].filter((e) => {
        return !!e;
      });
      return comps.join(', ');
    }
  }

  get isVip(): boolean {
    return this.action_score > 2;
  }

  get isPending(): boolean {
    return this.pending_users?.length > 0;
  }
}

export class ContactActivity implements Deserializable {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  user: string;
  last_activity: PureActivity;
  address: string;
  city: string;
  state: string;
  zip: string;
  label: string;
  cell_phone: string;
  country: string;
  auto_follow_up: string;
  source: string;
  brokerage: string;
  tags: string[];
  stages: string[];
  recruiting_stage: string;
  website: string;
  shared_all_member: boolean;
  shared_members: any[];
  shared_team: string[];
  pending_users: string;
  type?: string;
  prospect_id?: string;

  deserialize(input: any): this {
    Object.assign(this, input);
    if (input.last_activity instanceof Array && input.last_activity[0]) {
      this.last_activity = new PureActivity().deserialize(
        input.last_activity[0]
      );
    }
    return this;
  }

  get fullName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name;
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  get avatarName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name[0] + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name.substring(0, 2);
    } else if (this.last_name) {
      return this.last_name.substring(0, 2);
    } else {
      return 'UN';
    }
  }

  get shortName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed';
    }
  }

  get moreTag(): string {
    if (this.tags?.length > 1) {
      return '+' + (this.tags.length - 1) + ' more';
    }
    return '';
  }

  get moreStage(): string {
    if (this.stages?.length > 1) {
      return '+' + (this.stages.length - 1) + ' more';
    }
    return '';
  }

  get mainInfo(): Contact {
    return new Contact().deserialize({
      _id: this._id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      cell_phone: this.cell_phone,
      shared_all_member: this.shared_all_member,
      shared_members: this.shared_members,
      shared_team: this.shared_team,
      type: this.type,
      pending_users: this.pending_users,
      user: this.user
    });
  }

  get shortAddress(): string {
    if (!this.city && !this.state && !this.country) {
      return '---';
    } else {
      const comps = [this.city, this.state, this.country].filter((e) => {
        return !!e;
      });
      return comps.join(', ');
    }
  }

  updateTag(tagData: any): void {
    switch (tagData.option) {
      case 2:
        this.tags = _.union(this.tags, tagData.tags);
        break;
      case 3:
        this.tags = _.difference(this.tags, tagData.tags);
        break;
      case 4:
        this.tags = tagData.tags;
        break;
    }
  }
}

export class ContactDetail extends Contact {
  activity: DetailActivity[] = [];
  automation: {
    _id: string;
    title: string;
  };
  time_lines: Timeline[];
  next: string;
  prev: string;

  created_at: Date;
  updated_at: Date;

  details: any = {};

  deserialize(input: any = {}): this {
    Object.assign(this, input);
    this.activity = (input.activity || []).map((e) =>
      new DetailActivity().deserialize(e)
    );
    this.activity ? true : (this.activity = []);

    if (!input?.emails?.length) {
      this.emails = [];
      if (this.email) {
        this.emails.push({ value: this.email, type: '', isPrimary: true });
      }
      if (this.secondary_email) {
        this.emails.push({
          value: this.secondary_email,
          type: '',
          isPrimary: false
        });
      }
    }
    if (!input?.phones?.length) {
      this.phones = [];
      if (this.cell_phone) {
        this.phones.push({ value: this.cell_phone, type: '', isPrimary: true });
      }
      if (this.secondary_phone) {
        this.phones.push({
          value: this.secondary_phone,
          type: '',
          isPrimary: false
        });
      }
    }
    if (!input?.addresses?.length) {
      this.addresses = [];
      if (this.country || this.state || this.city || this.address || this.zip) {
        this.addresses.push({
          country: this.country,
          state: this.state,
          city: this.city,
          street: this.address,
          zip: this.zip,
          type: '',
          isPrimary: true
        });
      }
    }
    return this;
  }

  get last_activity_time(): Date {
    if (!this.activity || !this.activity.length) {
      return new Date();
    }
    const last_activity = this.activity.slice(-1)[0];
    return last_activity.created_at;
  }
}

export class Contact2I implements Deserializable {
  _id: string;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cell_phone: string;
  secondary_email: string;
  secondary_phone: string;
  brokerage: string;
  website: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  tags: string[];
  source: string;
  label: string;
  notes: string[] = [];
  label_id: string;
  auto_follow_up: string;
  recruiting_stage: string;
  deal_stage: string;
  additional_field: any;
  deal: any;
  emails: string[] = [];
  phones: string[] = [];

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get fullName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name;
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return '';
    }
  }

  get fullAddress(): string {
    return `${this.address ? this.address + ' ' : ''}${
      this.city ? this.city + ' ' : ''
    }${this.state ? this.state + ' ' : ''}${
      this.country ? this.country + ' ' : ''
    }${this.zip ? this.zip + ' ' : ''}`;
  }

  get isValidEmails(): boolean {
    if (
      (!this.email || validateEmail(this.email)) &&
      (!this.secondary_email || validateEmail(this.secondary_email))
    ) {
      return true;
    }
    return false;
  }
  get isValidPhones(): boolean {
    if (!isValidPhone(this.cell_phone)) {
      return false;
    }
    if (!isValidPhone(this.secondary_phone)) {
      return false;
    }
    return true;
  }
}

export class CampContact extends Contact {
  not_found = false;
  failed = false;
  failed_reason = '';
  failed_type = '';
  status = '';
}

/* New Contact Detail Interface for refactoring */
export type ActivityType =
  | 'email_trackers'
  | 'pdf_trackers'
  | 'image_trackers'
  | 'video_trackers'
  | 'videos'
  | 'pdfs'
  | 'images'
  | 'users'
  | 'emails'
  | 'follow_ups'
  | 'notes'
  | 'texts';

export type ActivityTrackerType =
  | 'video_trackers'
  | 'pdf_trackers'
  | 'image_trackers'
  | 'email_trackers';

export type ContactDetailActionType =
  | 'note'
  | 'email'
  | 'text'
  | 'appointment'
  | 'follow_up'
  | 'tasks'
  | 'deal'
  | 'phone_log'
  | 'automation'
  | 'activity'
  | 'event'
  | 'user'
  | 'team'
  | 'assigner'
  | 'single_id';

export const ContactActionUIScheme = [
  {
    name: 'Tasks',
    type: 'follow_up',
    icon: 'i-task',
    items: [],
    emptyStr: 'No tasks. Create one clicking in “+” (Plus).',
    isExpanded: false
  },
  {
    name: 'Deals',
    type: 'deal',
    icon: 'i-deal',
    items: [],
    emptyStr: 'No deals.',
    isExpanded: false,
    feature: USER_FEATURES.PIPELINE
  },
  {
    name: 'Appointments',
    type: 'appointment',
    icon: 'i-calendar',
    items: [],
    emptyStr: 'No upcoming appointments.',
    isExpanded: false
  },
  {
    name: 'Automations',
    type: 'automation',
    icon: 'i-automation',
    items: [],
    emptyStr:
      'Automate your next actions by adding an automation to the contact',
    isExpanded: false,
    feature: USER_FEATURES.AUTOMATION
  }
];

export const LabelOnContactType: {
  [typeKey in ContactDetailActionType]: string;
} = {
  note: 'note',
  email: 'email',
  text: 'Sent Text',
  appointment: 'meeting',
  follow_up: 'task',
  tasks: 'tasks',
  deal: 'deal',
  phone_log: 'call',
  automation: 'automation',
  activity: 'activity',
  event: 'event',
  user: 'user',
  team: 'team',
  assigner: 'assigner',
  single_id: 'single_id'
};

export type ActivityListResponseBodyItem = {
  [typeKey in ActivityType]?: string[] | string;
} & {
  _id: string;
  assigner: string;
  type: ActivityType;
  user: string;
  content: string;
  contacts: string[];
  to_emails: string[];
  assigned_id?: string;
  subject?: string;
  created_at: Date;
  updated_at: Date;
  status: string;
  message_id?: string;
  receivers?: string[]; // receivers list for email / text case
};
export interface ActivityListResponseItem {
  _id: { [key in ContactDetailActionType]: string | null };
  activity: ActivityListResponseBodyItem;
  videos: string[];
  images: string[];
  pdfs: string[];
  time: Date;
  last: string;
}

export interface ActivityListResponse {
  data: ActivityListResponseItem[];
  details: { [key: string]: object };
  lastActivityId: string;
}

export interface ContactActivityDetail {
  type: string | number; //  ContactDetailActionType + 's';
  created_at: Date;
  updated_at: Date;
}

export interface Tracker {
  disconnected_at: Date;
  duration: number;
  end: number;
  full_watched: boolean;
  gap: Array<Array<number>>;
  material_last: number;
  notified: boolean;
  start: number;
  type: string;
  _id: string;
  video: string;
  videoDuration?: number;
}

export interface TimeLineTracker {
  mediaTracker: Tracker;
  type: string; // ActivityTrackerType + 's'
  duration: number;
}

export type ActionDataType =
  | 'automation'
  | 'follow_up'
  | 'appointment'
  | 'task'
  | 'deal';

export interface ContactActivityActionV2 {
  type: ContactDetailActionType; // type of main data like email, text, note, task ...
  actionId: string; // id of main data like email, text, note, task ...
  action: ContactActivityDetail & any;
  trackerType?: ActivityTrackerType;
  trackerDetail?: Tracker;
  activityOverView: {
    content: string; // data that is needed to show the activity item title (icon and type and time)
    created_at: Date;
    type?: string;
    time: Date;
    receivers?: string[]; // receivers list for email / text case
    user?: any;
  };
  materials?: {
    videos: any[];
    images: any[];
    pdfs: any[];
  };
  includeMaterials?: number;
  status: string;
  messageId?: string;
}
export interface ContactActivityDetailV2 {
  activities: any[];
  detail: ContactActivityDetail & object;
  trackers: {
    email: any[];
    video: any[];
    pdf: any[];
    image: any[];
  };
}
