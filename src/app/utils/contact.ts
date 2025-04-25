import { parsePhoneNumber } from 'awesome-phonenumber';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { validateDate, validateEmail, validateUrl } from '@app/helper';
import { Contact, Contact2I } from '@models/contact.model';
import { contactTableFields } from '@utils/data';
import { Contact2IGroup } from '@utils/data.types';
import { FieldTypeEnum, MergeType } from '@utils/enum';
import { formatDate, groupBy } from '@utils/functions';
import * as _ from 'lodash';

/**
 * @DccResponse - DuplicateCsvContactRepsonse
 */
type DccResponse = {
  items: string[];
  groups: Contact2IGroup[];
  contacts: Contact2I[];
};

function mergeType(contacts: Contact2I[]): MergeType {
  let contactCount = 0;
  for (const contact of contacts) {
    if (contact._id) {
      contactCount++;
    }
  }
  if (contactCount > 1) {
    return MergeType.CONTACT;
  } else if (contactCount === 1) {
    return MergeType.CONTACT_CSV;
  }
  return MergeType.CSV;
}

function getPrimaryContact(contacts: Contact2I[]): Contact2I {
  const type = mergeType(contacts);
  if (type === MergeType.CSV) {
    return contacts[0];
  } else {
    return contacts.find((c) => c._id && c._id != null);
  }
}

export function autoMergeContacts(
  contacts: Contact2I[],
  fields: string[]
): Contact2I {
  const type = mergeType(contacts);
  let primary;
  if (type === MergeType.CSV) {
    primary = contacts[0];
  } else {
    primary = contacts.find((contact) => contact._id);
  }
  const result = new Contact2I().deserialize(primary);
  for (const field of fields) {
    for (const contact of contacts.filter(
      (contact) => contact.id !== primary.id
    )) {
      if (
        field !== 'notes' &&
        field !== 'tags' &&
        result[field] &&
        result[field] !== ''
      ) {
        break;
      }
      const emails = [];
      const phones = [];
      if (field === 'secondary_email') {
        result[field] = contact['email'] || contact['secondary_email'];
        if (result[field] === result['email']) {
          result[field] = '';
        } else {
          if (!emails.includes(result[field])) {
            emails.push(result[field]);
          }
        }
      } else if (field === 'secondary_phone') {
        result[field] = contact['cell_phone'] || contact['secondary_phone'];
        if (result[field] === result['cell_phone']) {
          result[field] = '';
        } else {
          if (!phones.includes(result[field])) {
            phones.push(result[field]);
          }
        }
      } else if ((field === 'notes' || field === 'tags') && contact[field]) {
        const values = [];
        if (Array.isArray(contact[field])) {
          values.push(...contact[field]);
        } else {
          values.push(contact[field]);
        }
        values.forEach((item) => {
          if (!result[field].includes(item)) {
            result[field].push(item);
          }
        });
      } else {
        result[field] = result[field] || contact[field];
      }
      result['emails'] = emails;
      result['phones'] = phones;
    }
  }
  return result;
}

/**
 * Group by email or phone
 * {e1, p1}, {e1}, {p1} are same group.
 * if there is no {e1, p1}, {e1} and {p1} would be different group
 * In return value,
 * items are key string array value (that are used)
 * groups: duplicated contact group to be used in the logic { result: contact, contacts: contact[], checked, updated, ignored }
 * contacts: not duplicated contacts
 * @param contacts
 * @returns: { items: key[], contacts: [], groups: [] }
 */
export function checkDuplicatedContact(contacts: Contact2I[]): DccResponse {
  const items: string[] = []; // unique emails array that is existed in contacts
  const contactGroups: Contact2IGroup[] = []; // duplicated contact groups
  const contactsToUpload = []; // contacts array that is not duplicated
  const allContacts = [];
  contacts.forEach((e) => {
    e['key'] = (e.email || '') + '{}' + (e.cell_phone || '');
    e['crm_contact'] = e['_id'] ? true : false;
  });
  const grouped = _.groupBy(contacts, 'key');
  const keys = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));
  // email_phone, email1_phone1, ....
  const checkedKeys = [];
  const emailGroupContactsArray = new Map();
  for (const _key of keys) {
    const { foundKeys, key } = findSameGroupKey(checkedKeys, _key);
    checkedKeys.push(key);
    if (foundKeys.length) {
      const value = [];
      for (let i = 0; i < foundKeys.length; i++) {
        value.push(...grouped[foundKeys[i]]);
      }
      value.push(...grouped[_key]);
      emailGroupContactsArray.set(foundKeys[0], value);
    } else {
      emailGroupContactsArray.set(_key, grouped[_key]);
    }
    allContacts.push(grouped[_key]);
  }
  emailGroupContactsArray.forEach((value, key, map) => {
    if (key && key !== null && key !== '' && value.length > 1) {
      items.push(key);
      const result = getPrimaryContact(value);
      const csvContact = value.find((e) => !e._id);
      const group: Contact2IGroup = {
        contacts: value,
        result: result,
        checked: false,
        updated: false,
        ignored: false,
        automation_id: csvContact?.['automation_id'] || ''
      };
      contactGroups.push(group);
    } else {
      contactsToUpload.push(...value);
    }
  });
  const response: DccResponse = {
    items: [],
    groups: [],
    contacts: []
  };
  response.items = items;
  response.groups = contactGroups;
  response.contacts = contactsToUpload;
  return response;
}

function findSameGroupKey(
  keyList: { key: string; email: string; phone: string }[],
  key: string
): { foundKeys: string[]; key: { key: string; email: string; phone: string } } {
  const keyComponents = key.split('{}');
  const email = keyComponents[0] || '';
  const phone = keyComponents[1] || '';
  const foundAll = keyList.filter(
    (e) => (email && e.email == email) || (phone && e.phone === phone)
  );
  const foundKeys = foundAll.map((e) => e.key);
  return {
    foundKeys,
    key: {
      key,
      email,
      phone
    }
  };
}

export function generateDealArray(contacts: any[], stageId?: any): any[] {
  const deals = [];
  const contactsGroupByDeal = groupBy(contacts, (contact) => contact.deal);
  let index = 1;
  contactsGroupByDeal.forEach((value, key) => {
    if (key && key !== '' && value.length) {
      const primary = new Contact().deserialize(value[0]);
      const contacts = value.map((e) => new Contact().deserialize(e));
      const deal = {
        id: index + '',
        title: key,
        contacts: contacts,
        primary_contact: primary,
        deal_stage: stageId
      };
      deals.push(deal);
      index += 1;
    }
  });
  return deals;
}

/**
 * Convert the General number to International Number
 * @param phoneNumber: Local number or international number
 * @returns: International Format number
 */
export function getInternationalPhone(phoneNumber: string, code: string): any {
  const phoneUtil = PhoneNumberUtil.getInstance();
  if (phoneNumber) {
    try {
      const formatted = phoneUtil.format(
        phoneUtil.parse(phoneNumber, code),
        PhoneNumberFormat.E164
      );
      return formatted;
    } catch (err) {
      return '';
    }
  }
  return '';
}

export function getPhoneNumberPlaceHolder(countryCode: string): any {
  const phoneUtil = PhoneNumberUtil.getInstance();
  try {
    return phoneUtil.format(
      phoneUtil.getExampleNumber(countryCode),
      PhoneNumberFormat.NATIONAL
    );
  } catch (e) {
    return e;
  }
}

export function getContact2IObj(
  origin: any,
  data: any,
  selectedCountry?: any
): Contact2I {
  const phoneUtil = PhoneNumberUtil.getInstance();
  if (data.tags) {
    if (data.tags instanceof Array) {
      origin.tags = data.tags;
    } else {
      origin.tags = data.tags.split(',');
    }
  }
  if (data.notes) {
    if (data.notes instanceof Array) {
      origin.notes = data.notes;
    } else {
      origin.notes = [data.notes];
    }
  }
  if (data.label && data.label._id) {
    origin['label_id'] = data.label._id;
    origin.label = data.label.name;
  }
  if (data.cell_phone && phoneNumberValidator(data.cell_phone)) {
    let code = '';
    if (data.cell_phone.includes('+')) {
      const tel = phoneUtil.parse(data.cell_phone);
      origin['cell_phone'] = phoneUtil.format(tel, PhoneNumberFormat.E164);
    } else {
      code = selectedCountry['iso2'] ?? 'US';
      origin['cell_phone'] = getInternationalPhone(data.cell_phone, code);
    }
  }
  const contact2I = new Contact2I().deserialize(origin);
  if (contact2I._id) {
    contact2I.id = contact2I._id;
  }
  if (
    contact2I.additional_field &&
    Object.keys(contact2I.additional_field).length > 0
  ) {
    Object.keys(contact2I.additional_field).forEach((field) => {
      contact2I[field] = contact2I.additional_field[field];
    });
  }
  return contact2I;
}

function phoneNumberValidator(value) {
  if (!value) {
    return false;
  }
  let number;
  try {
    number = PhoneNumberUtil.getInstance().parse(
      value.number,
      value.countryCode
    );
  } catch (e) {
    return false;
  }
  if (
    !PhoneNumberUtil.getInstance().isValidNumberForRegion(
      number,
      value.countryCode
    )
  ) {
    return false;
  }
  return true;
}

export function formatContact(data): any {
  for (const key in data) {
    if (key === 'id') {
    } else if (key === 'notes' || key === 'tags') {
      if (data[key] == undefined) {
        delete data[key];
      } else if (!Array.isArray(data[key])) {
        const tags = data[key].split(',');
        data[key] = tags;
      }
    } else {
      if (key === undefined) {
        delete data[key];
      } else {
        if (Array.isArray(data[key])) {
          if (data[key].length < 1) {
            delete data[key];
          }
        } else {
          if (data[key] === '' || data[key] === null) {
            delete data[key];
          }
        }
      }
    }
  }
  return data;
}

export function contactHeaderOrder(a: string, b: string): number {
  const aIndex = contactTableFields.findIndex((field) => field.value === a);
  const bIndex = contactTableFields.findIndex((field) => field.value === b);
  return aIndex - bIndex;
}

export function validateCustomField(field: any, value: any): boolean {
  if (!value || value === '') {
    return true;
  }
  if (!field || field == null) {
    return true;
  }
  switch (field.type) {
    case FieldTypeEnum.DATE:
      if (typeof value === 'object') {
        if (value instanceof Date) {
          return value && value !== null;
        }
        const _value = `${value.month}/${value.day}/${value.year}`;
        value = _value;
      }
      return validateDate(value);
    case FieldTypeEnum.EMAIL:
      return validateEmail(value);
    case FieldTypeEnum.LINK:
      return validateUrl(value);
    case FieldTypeEnum.PHONE:
      return parsePhoneNumber(value).valid;
    default:
      return true;
  }
}

export function formatValue(value): any {
  if (value && value instanceof Date) {
    return formatDate(
      value.getDate(),
      value.getMonth() + 1,
      value.getFullYear()
    );
  } else if (value instanceof Array) {
    return value.join(', ');
  } else if (value instanceof Object) {
    let valueString = '';
    Object.keys(value).forEach((key) => {
      if (!valueString) {
        valueString += key;
      } else {
        valueString += `, ${key}`;
      }
    });
    return valueString;
  }
  return value;
}
