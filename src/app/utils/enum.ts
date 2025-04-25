export const FieldTargetEnum = Object.freeze({
  CONTACT: 'contact',
  LEAD_CAPTURE: 'lead form'
});
export const DateFormatEnum = Object.freeze({
  MM_DD_YYYY: 'MM-DD-YYYY',
  DD_MM_YYYY: 'DD-MM-YYYY',
  YYYY_MM_DD: 'YYYY-MM-DD',
  MMDDYYYY: 'MM/DD/YYYY',
  DDMMYYYY: 'DD/MM/YYYY',
  YYYYMMDD: 'YYYY/MM/DD'
});
export const FieldTypeEnum = Object.freeze({
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  DATE: 'date',
  LINK: 'link',
  DROPDOWN: 'dropdown'
});

export enum FormType {
  CREATE = 'form.create',
  UPDATE = 'form.update',
  VERIFY = 'form.verify'
}

export enum MergeType {
  CONTACT = 'contact',
  CONTACT_CSV = 'contact_csv',
  CSV = 'csv'
}

export enum ContactListType {
  MOVE_PENDING = 'move-pending',
  SHARE_PENDING = 'share-pending',
  SHARED = 'shared'
}
