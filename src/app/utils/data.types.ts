import { Contact2I, Contact } from '@models/contact.model';
import { Label } from '@models/label.model';
import { Personality } from '@app/models/personality.model';
export interface PageMenuItem {
  icon: string;
  label: string;
  id: string;
}
export interface TabItem {
  icon: string;
  label: string;
  id: string;
  badge?: number;
  feature?: string;
}

export interface TabOption {
  label: string;
  value: string;
}

export interface ActionItem {
  label: string;
  icon?: string;
  type: string;
  items?: { class: string; label: string; command: string }[];
  status?: boolean;
  spliter?: boolean;
  command?: string;
  loadingLabel?: string;
}
export interface LabelItem {
  label: Label;
  contacts: Contact[];
}
export interface ContactGroup {
  contacts: any[];
  result: any;
  ignored: boolean;
  checked?: boolean;
  updated?: boolean;
}

export interface Contact2IGroup {
  contacts: Contact2I[];
  result: Contact2I;
  ignored: boolean;
  checked: boolean;
  updated: boolean;
  automation_id?: string;
}
export interface Alias {
  email: string;
  name: string;
  verified?: boolean;
  primary?: boolean;
  is_default?: boolean;
}

export type DateRange = { startDate: Date; endDate: Date };

export type DealGroup = {
  deals: any[];
  selection: any[];
  unique_contacts: any[];
  saving: boolean;
  completed: boolean;
};

export type TemplateToken = {
  id: number;
  name: string;
  value: string;
  match_field: string;
  default: boolean;
};
export interface FieldAnalyticsDataOption {
  name: string;
  exist: boolean;
}
export interface FieldAnalyticsData {
  and: boolean;
  fields: FieldAnalyticsDataOption[];
  count?: number;
  id: string;
}

export interface ActivityAnalyticsReqOption {
  activities: string[];
  range: number;
  id: string;
}

export interface ActivityAnalyticsReq {
  options: ActivityAnalyticsReqOption[];
}

export interface ActivityAnalyticsData {
  types: string[];
  result?: any;
  error?: string;
  range: number;
  id: string;
}

export interface AutomationAnalyticsReq {
  range: number;
  id: string;
}

export interface RateAnalyticsReq {
  count: number;
  id: string;
}

export interface TwilioAccount {
  authToken: string;
  accountSid: string;
  sender: string;
}

export interface StarterBrand {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  isoCountry: string;
}

export interface StandardBrand {
  companyName: string;
  companyEmail: string;
  businessName: string;
  businessProfileUrl: string;
  businessWebsite: string;
  businessRegion: string;
  businessType: string;
  businessIdentifier: string;
  businessIdentity: string;
  businessIndustry: string;
  businessNumber: string;
  firstMemberPosition: string;
  firstMemberFirstName: string;
  firstMemberLastName: string;
  firstMemberPhone: string;
  firstMemberEmail: string;
  firstMemberBusinessTitle: string;
  secondMemberPosition: string;
  secondMemberFirstName: string;
  secondMemberLastName: string;
  secondMemberPhone: string;
  secondMemberEmail: string;
  secondMemberBusinessTitle: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  isoCountry: string;
}

export interface BrandCampaign {
  description: string;
  messageFlow: string;
  messages: string[];
}

export interface StarterBrandRes {
  brandType: string;
  businessInfo: string;
  customerProfile: string;
  endUser: string;
  attachedUser: string;
  address: string;
  addressDocument: string;
  attachedDocument: string;
  bundle: string;
  attachedBundle: string;
  brand: string;
  endSoleUser: string;
  attachedEndSoleUser: string;
  service: string;
  attachedService: string;
  status: string;
  identityStatus: string;
  campaignStatus: string;
}

export interface StandardBrandRes {
  brandType: string;
  businessInfo: string;
  customerProfile: string;
  authorizedUser1: string;
  authorizedUser2: string;
  attachedBusiness: string;
  attachedUser1: string;
  attachedUser2: string;
  address: string;
  addressDocument: string;
  attachedDocument: string;
  bundle: string;
  attachedBundle: string;
  brand: string;
  status: string;
  identityStatus: string;
  campaignStatus: string;
  attachedService: string;
}

export interface StarterBrandStatus {
  sid: string;
  status: string;
  identityStatus: string;
  failureReason: string;
  campaignStatus?: string;
}

export interface PermissionItem {
  options: any;
  id: string;
  value: boolean;
}

export interface PermissionSetting {
  id: string;
  options: PermissionItem[];
}

export interface ComparisonData {
  id: string;
  person: Personality;
  resultContent: string;
}
