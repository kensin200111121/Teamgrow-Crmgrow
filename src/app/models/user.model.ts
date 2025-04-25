import { Alias } from '@utils/data.types';
import { Deserializable } from '@models/deserialize.model';

export class User implements Deserializable {
  _id?: string = '';
  user_name?: string = '';
  nick_name?: string = '';
  email?: string = '';
  cell_phone?: string = '';
  phone?: {
    number?: string;
    internationalNumber?: string;
    nationalNumber?: string;
    countryCode?: string;
    areaCode?: string;
    dialCode?: string;
  } = {};
  payment?: string = '';
  time_zone_info?: string = '';
  location: string;
  email_signature?: string = '';
  proxy_number?: string = '';
  proxy_number_id?: string = '';
  twilio_number?: string = '';
  twilio_number_id?: string = '';
  dialer_token?: string = '';
  twilio_number_scope?: string = 'primary';
  proxy_phone?: {
    number?: string;
    is_released: false;
  } = { is_released: false };
  picture_profile: string;
  learn_more: string;
  role: string;
  outlook_refresh_token: string;
  google_refresh_token: string;
  yahoo_refresh_token: string;
  other_emailer: any;
  connected_email_type: string;
  connected_email: string;
  connected_email_id?: string;
  calendar_connected = false;
  primary_connected = false;
  daily_report = false;
  weekly_report = false;
  admin_notification = 0;
  desktop_notification = false;
  desktop_notification_subscription: string;
  text_notification = false;
  assistant_info?: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  contact_info?: {
    is_limit: boolean;
    max_count: number;
  };
  text_info?: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
    count: number;
    additional_credit?: {
      amount: number;
      updated_at: Date;
    };
    subaccount_used_count?: number;
  };
  email_info?: {
    mass_enable: boolean;
    is_limit: boolean;
    max_count: number;
    count: number;
  };
  automation_info?: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  material_info?: {
    is_enabled: boolean;
    is_limit: boolean;
    upload_max_count: number;
    record_max_duration: number;
  };
  team_info?: {
    is_enabled: boolean;
    owner_enabled: boolean;
  };
  pipe_info: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  calendar_info?: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  dialer_info?: {
    is_enabled: boolean;
  };
  organization_info?: {
    is_owner: boolean;
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  organization?: string;
  capture_enabled: boolean;
  email_verified: boolean;
  welcome_email = false;
  is_trial = false;
  is_free = false;
  subscription?: {
    is_failed: false;
    updated_at: Date;
    is_suspended: false;
    suspended_at: Date;
    attempt_count: 0;
    period: 'month';
  };
  package_level: string;
  user_version: number;
  expired_at: Date;
  created_at: Date;
  updated_at: Date;
  last_logged: Date;
  del: boolean;
  sub_domain: string;
  wavv_number?: string = '';
  social_link?: {
    facebook: string;
    twitter: string;
    linkedin: string;
  } = {
    facebook: '',
    twitter: '',
    linkedin: ''
  };
  job = 'other';
  company = 'Other';
  affiliate?: {
    id?: string;
    link?: string;
    paypal?: string;
  };
  hasPassword?: boolean;
  calendar_list?: {
    connected_email: string;
    connected_calendar_type: string;
    google_refresh_token?: string;
    outlook_refresh_token?: string;
    id?: string;
  }[];
  campaign_info?: {
    is_enabled: boolean;
  };
  is_primary: boolean;
  primary_account: any;
  email_draft: {
    subject: string;
    content: string;
  };
  text_draft: {
    content: string;
  };
  sub_accounts: any[] = [];
  sub_account_info: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  campaign_smtp_connected = false;
  login_enabled: boolean;
  master_enabled: boolean;
  billing_access_enabled: boolean;
  team_stay_enabled = true;
  scheduler_info: {
    is_enabled: boolean;
    connected_email: string;
    calendar_id: string;
    conflict_calendar_list: any[];
  };
  landing_page_info: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  onboard: {
    watched_modal: boolean;
    profile: boolean;
    connect_email: boolean;
    created_contact: boolean;
    upload_video: boolean;
    send_video: boolean;
    sms_service: boolean;
    connect_calendar: boolean;
    dialer_checked: boolean;
    tour: boolean;
    material_download: boolean;
    automation_download: boolean;
    template_download: boolean;
    complete: boolean;
  };
  support_info: {
    feature_request: boolean;
  };
  builder_version: string;
  smtp_info: {
    host: string;
    user: string;
    pass: string;
    secure: boolean;
    port: number;
    email: string;
    smtp_connected: boolean;
    verification_code: string;
    daily_limit: number;
    start_time: string;
    end_time: string;
  };
  email_alias: Alias[] = [];
  assignee_info: {
    is_enabled: boolean;
    is_editable: boolean;
  };
  notification_info: {
    seenBy: string;
    lastId: string;
  };
  can_restore_seat: boolean;
  agent_vending_info: {
    is_enabled: boolean;
    is_limit: boolean;
    max_count: number;
  };
  source: string;
  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get avatarName(): string {
    const names = this.user_name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    } else {
      return names[0][0];
    }
  }
}

export class Account extends User {
  is_seat = false;
  seat_count = 1;
}

export type Assignee = {
  _id: string;
  user_name?: string;
};
