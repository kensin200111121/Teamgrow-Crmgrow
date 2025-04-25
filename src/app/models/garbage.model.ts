import {
  StandardBrandRes,
  StarterBrandRes,
  TemplateToken
} from '@utils/data.types';
import { Deserializable } from '@models/deserialize.model';
import { SmartCode } from '@models/smart-code.model';

interface CaptureFields {
  [name: string]: {
    display: boolean;
    required: boolean;
  };
}

export type OnboardStepStatusType = 'pending' | 'skipped' | 'completed';

export class Garbage implements Deserializable {
  _id: string;
  user: string;
  canned_message: {
    sms: string;
    email: string;
  };
  edited_video: string[];
  edited_pdf: string[];
  edited_image: string[];
  edited_automation: string[];
  edited_label: string[];
  desktop_notification = {
    material: false,
    email: false,
    link_clicked: false,
    text_replied: false,
    follow_up: false,
    lead_capture: false,
    unsubscription: false,
    resubscription: false,
    reminder_scheduler: false
  };
  email_notification = {
    material: true,
    email: true,
    link_clicked: false,
    text_replied: false,
    follow_up: true,
    lead_capture: false,
    unsubscription: true,
    resubscription: true,
    reminder_scheduler: false
  };
  text_notification = {
    material: true,
    email: false,
    link_clicked: false,
    text_replied: false,
    follow_up: false,
    lead_capture: false,
    unsubscription: false,
    resubscription: false,
    reminder_scheduler: false
  };
  reminder_before = 30;
  reminder_scheduler = 30;
  capture_dialog = false;
  capture_delay = 0;
  capture_videos: any[];
  capture_images: any[];
  capture_pdfs: any[];
  capture_form: string;
  capture_forms: any;
  capture_field: any;
  index_page: string;
  logo: string;
  material_theme = 'theme2';
  auto_follow_up = {
    enabled: false,
    period: 0,
    content: ''
  };
  auto_resend = {
    enabled: false,
    period: 24,
    sms_canned_message: '',
    email_canned_message: ''
  };
  auto_follow_up2 = {
    enabled: false,
    period: 0,
    content: ''
  };
  auto_resend2 = {
    enabled: false,
    period: 24,
    sms_canned_message: '',
    email_canned_message: ''
  };
  material_themes: any;
  tag_automation: any;
  highlights: [];
  brands: [];
  intro_video: string;
  onboarding_status: {
    email: OnboardStepStatusType;
    calendar: OnboardStepStatusType;
    contacts: OnboardStepStatusType;
    dialer: OnboardStepStatusType;
  };
  calendar_info: {
    is_enabled: boolean;
    start_time: string;
    end_time: string;
  };
  calendly: {
    id: string;
    token: string;
    email: string;
    link: string;
  };
  additional_fields: {
    id: string;
    type: string;
    name: string;
    placeholder: string;
    format: string;
    status: boolean;
    options: { value: string; label: string }[];
  }[] = [];
  template_tokens: TemplateToken[] = [];
  access_token = '';
  zoom: {
    email: string;
  };
  smart_codes: any;
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
    business_day: {
      sun: boolean;
      mon: boolean;
      tue: boolean;
      wed: boolean;
      thu: boolean;
      fri: boolean;
      sat: boolean;
    };
  };
  business_time: {
    is_enabled: boolean;
    start_time: string;
    end_time: string;
  };
  business_day: {
    sun: boolean;
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
  };
  confirm_message: {
    automation_business_hour: boolean;
    email_out_of_business_hour: boolean;
    email_mass_overflow: boolean;
    text_out_of_business_hour: boolean;
  };
  call_labels: string[] = [];
  csv_templates = [];
  is_read = false;
  rate_options: any[] = [];
  twilio_capacity = 3000;
  twilio_sub_account: {
    is_enabled: boolean;
    sid: string;
    auth_token: string;
  };
  twilio_brand_info: StandardBrandRes | StarterBrandRes;
  twilio_campaign_draft: {
    description: string;
    messageFlow: string;
    messages: string[];
  };

  permission_settings = [];
  is_notification_read = false;
  api_key: string;
  features = {};

  constructor() {
    this.onboarding_status = {
      email: 'pending',
      calendar: 'pending',
      contacts: 'pending',
      dialer: 'pending'
    };
  }

  deserialize(input: any): this {
    Object.entries(input).forEach(([key, value]) => {
      if (!value && typeof this[key] === 'object') {
        input[key] = this[key];
        return;
      }
    });

    Object.assign(this, input);

    this.onboarding_status = {
      email: input.onboarding_status?.email || 'pending',
      calendar: input.onboarding_status?.calendar || 'pending',
      contacts: input.onboarding_status?.contacts || 'pending',
      dialer: input.onboarding_status?.dialer || 'pending'
    };

    return this;
  }

  notification_fields = [
    'material',
    'email',
    'link_clicked',
    'text_replied',
    'follow_up',
    'lead_capture',
    'unsubscription',
    'reminder_scheduler'
  ];

  get entire_desktop_notification(): number {
    if (!this.desktop_notification) {
      return -1;
    }
    let all_checked = true;
    let some_checked = false;
    this.notification_fields.forEach((e) => {
      all_checked = all_checked && this.desktop_notification[e];
      some_checked = some_checked || this.desktop_notification[e];
    });
    return all_checked ? 1 : some_checked ? 0 : -1;
  }
  get entire_text_notification(): number {
    if (!this.text_notification) {
      return -1;
    }
    let all_checked = true;
    let some_checked = false;
    this.notification_fields.forEach((e) => {
      all_checked = all_checked && this.text_notification[e];
      some_checked = some_checked || this.text_notification[e];
    });
    return all_checked ? 1 : some_checked ? 0 : -1;
  }
  get entire_email_notification(): number {
    if (!this.email_notification) {
      return -1;
    }
    let all_checked = true;
    let some_checked = false;
    this.notification_fields.forEach((e) => {
      all_checked = all_checked && this.email_notification[e];
      some_checked = some_checked || this.email_notification[e];
    });
    return all_checked ? 1 : some_checked ? 0 : -1;
  }
}
