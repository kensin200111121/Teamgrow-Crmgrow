import * as Quill from 'quill';
import * as _ from 'lodash';
import moment from 'moment-timezone';
import { environment } from '@environments/environment';
import { User } from '@models/user.model';
import { Contact } from '@models/contact.model';
import { TemplateToken } from '@utils/data.types';
import {
  DEFAULT_TIME_ZONE,
  TIMES,
  WIN_TIMEZONE
} from '@constants/variable.constants';
import { parsePhoneNumber } from 'awesome-phonenumber';
import { Conversation } from './models/conversation.model';

const InlineBlock = Quill.import('blots/inline');
const Embed = Quill.import('blots/embed');
const BlockEmbed = Quill.import('blots/block/embed');
const Delta = Quill.import('delta');
const Parchment = Quill.import('parchment');
const Block = Quill.import('blots/block');
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = ['0.75em', '1.5em', '2em'];
Quill.register(SizeStyle, true);
const FontStyle = Quill.import('attributors/style/font');
Quill.register(FontStyle, true);

export const numPad = (input: string | number) => {
  const num: number = parseInt(input + '');
  if (num < 10) {
    return '0' + num;
  }
  return num + '';
};

export const TelFormat = {
  numericOnly: true,
  blocks: [0, 3, 3, 4],
  delimiters: ['(', ') ', '-']
};

export const ByteToSize = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const AppendArray = (arr1, arr2) => {
  if (!(arr1 && arr1.length)) {
    return arr2;
  } else if (!(arr2 && arr2.length)) {
    return arr1;
  } else {
    return arr1.concat(arr2);
  }
};

export const PullArray = (arr1, arr2) => {
  if (!arr1 || !arr1.length) {
    return [];
  } else if (!arr2 || !arr2.length) {
    return arr1;
  } else {
    const diff = [];
    arr1.forEach((e) => {
      if (arr2.indexOf(e) === -1) {
        diff.push(e);
      }
    });
    return diff;
  }
};

export const GetTime = (start: string, end: string) => {
  if (start && start !== '' && end && end !== '') {
    const startArr = start.split(':');
    const endArr = end.split(':');
    const startHour = parseInt(startArr[0], 10);
    const startMin = parseInt(startArr[1], 10);
    const endHour = parseInt(endArr[0], 10);
    const endMin = parseInt(endArr[1], 10);
    return { startHour, startMin, endHour, endMin };
  } else {
    return { startHour: 0, startMin: 0, endHour: 23, endMin: 59 };
  }
};

export const promptForFiles = (): Promise<FileList> => {
  return new Promise<FileList>((resolve, reject) => {
    // make file input element in memory
    const fileInput: HTMLInputElement = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    // fileInput['capture'] = 'camera';
    fileInput.addEventListener('error', (event) => {
      reject(event.error);
    });
    fileInput.addEventListener('change', (event) => {
      resolve(fileInput.files);
    });
    // prompt for video file
    fileInput.click();
  });
};

export const listToTree = (list, rootId = 'a_10000', type = 'contact') => {
  const map = {},
    roots = [];
  let node, i;
  let startRef;
  for (i = 0; i < list.length; i += 1) {
    map[list[i].ref] = i; // initialize the map
    list[i].children = [];
    list[i].isFirst = false;
    // initialize the children
  }

  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (type === 'contact') {
      if (node.parent_ref !== rootId) {
        const parentRef =
          node.parent_ref != 'a_10000' ? node.parent_ref : startRef;
        if (
          list[map[parentRef]] &&
          list[map[parentRef]]['status'] === 'disabled'
        ) {
          node['status'] = 'disabled';
        }
        if (list[map[parentRef]] && list[map[parentRef]].children) {
          if (node.status === 'active') {
            node.isFirst = true;
            list[map[parentRef]].children.forEach((element) => {
              element.isFirst = false;
            });
            list[map[parentRef]].children.unshift(node);
          } else {
            if (list[map[parentRef]].children.length == 0) node.isFirst = true;
            list[map[parentRef]].children.push(node);
          }
        } else {
          roots.push(node);
        }
      } else {
        startRef = node.ref;
        if (roots.length === 0) {
          roots.push(node);
        } else {
          list[map[node.parent_ref]].children.push(node);
        }
        //
      }
    } else if (type === 'deal') {
      if (node.parent_ref !== rootId) {
        const parentRef =
          node.parent_ref != 'a_10000' ? node.parent_ref : startRef;
        if (
          list[map[parentRef]] &&
          list[map[parentRef]]['status'] === 'disabled'
        ) {
          node['status'] = 'disabled';
        }
        if (list[map[parentRef]] && list[map[parentRef]].children) {
          if (node.status === 'active') {
            node.isFirst = true;
            list[map[parentRef]].children.forEach((element) => {
              element.isFirst = false;
            });
            list[map[parentRef]].children.unshift(node);
          } else {
            if (list[map[parentRef]].children.length == 0) node.isFirst = true;
            list[map[parentRef]].children.push(node);
          }
        } else {
          roots.push(node);
        }
      } else {
        startRef = node.ref;
        roots.push(node);
      }
    }
  }
  return roots;
};

export const rebuildListToTree = (list) => {
  const map = {};
  const roots = [];
  let root = null;
  for (const node of list) {
    map[node.ref] = node;
    node.children = [];
  }

  for (const node of list) {
    if (node.parent_ref !== '0') {
      const parent = map[node.parent_ref];
      if (parent) {
        if (parent.status === 'disabled') {
          node.status = 'disabled';
        }
        parent.children.push(node);
      }
    } else {
      root = node;
    }
  }

  if (root === null) {
    return roots;
  }

  for (const node of list) {
    const parent = map[node.parent_ref];
    const isCompleted = !isUncompleted(node);
    if (parent && isCompleted) {
      const index = parent.children.indexOf(node.ref);
      if (index >= 0) {
        parent.children.splice(index, 1);
      }
    }
  }

  while (true) {
    // if (root.children.length == 1) {
    //   const child = root.children[0];
    //   if (root.status === 'completed' && child.status === 'completed')
    //     root = child;
    //   else
    //     break;
    // }
    // else
    //   break;
    if (root.status === 'completed') {
      let nextChild = null;
      for (const child of root.children) {
        if (child.status === 'completed') {
          nextChild = child;
        }
      }
      if (nextChild) {
        root = nextChild;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  if (isUncompleted(root)) {
    roots.push(root);
  }

  return roots;
};

function isUncompleted(node): any {
  if (node.status === 'active' || node.status === 'pending') {
    return true;
  }

  for (const child of node.children) {
    if (isUncompleted(child) === true) {
      return true;
    }
  }
  return false;
}
export const loadBase64 = (file: Blob): Promise<any> => {
  const fileReader = new FileReader();
  return new Promise<any>((resolve, reject) => {
    fileReader.addEventListener('error', reject);
    fileReader.addEventListener('load', () => {
      resolve(fileReader.result);
    });
    fileReader.readAsDataURL(file);
  });
};

export class SignatureBlot extends Embed {
  static blotName = 'emailSignature';
  static tagName = 'div';
  static className = 'email-signature';
  static create(data) {
    const node = super.create(data.value);
    node.setAttribute('data-value', data.value);
    node.innerHTML = data.value;
    return node;
  }

  static value(domNode) {
    return domNode.getAttribute('data-value');
  }
}
export class MaterialBlot extends Embed {
  static tagName = 'a';
  static className = 'material-object';
  static blotName = 'materialLink';
  static create(data) {
    const node = super.create();
    const type = data?.type || data?.material_type || 'video';
    node.setAttribute('data-type', type);
    const url = `{{${data?._id}}}`;
    node.setAttribute('href', url);
    node.setAttribute('contenteditable', false);
    const img = document.createElement('img');
    img.setAttribute('src', data?.preview);
    img.alt = 'Preview image went something wrong. Please click here';
    img.width = 320;
    img.height = 176;
    node.appendChild(img);
    if (!data || !data._id) {
      const span = document.createElement('span');
      span.classList.add('crm-material-warning');
      span.style.display = 'none';
      span.innerHTML = 'THIS VIDEO IS INVALID. PLEASE REMOVE AND UPDATE';
      node.appendChild(span);
    }
    return node;
  }

  static value(domNode) {
    const type = domNode.getAttribute('data-type') || 'video';
    const href = domNode.getAttribute('href');
    const _id = href.replace(/{{|}}/g, '');
    let preview = '';
    const previewImg = domNode.querySelector('img');
    if (previewImg) {
      preview = previewImg.src;
    }
    return {
      _id,
      preview,
      material_type: type
    };
  }
}

Quill.register(MaterialBlot, true);

export class LandingPageBlot extends Embed {
  static tagName = 'a';
  static className = 'landing-page-object';
  static blotName = 'landingPageLink';
  static create(data) {
    const node = super.create();
    const type = data?.type || data?.material_type || 'video';
    node.setAttribute('data-type', type);
    const url = `{{${data?._id}}}`;
    node.setAttribute('href', url);
    node.setAttribute('contenteditable', false);
    const img = document.createElement('img');
    img.setAttribute('src', data?.preview);
    img.alt = 'Preview image went something wrong. Please click here';
    img.width = 320;
    img.height = 176;
    node.appendChild(img);

    if (!data || !data._id) {
      const span = document.createElement('span');
      span.classList.add('crm-material-warning');
      span.style.display = 'none';
      span.innerHTML = 'THIS VIDEO IS INVALID. PLEASE REMOVE AND UPDATE';
      node.appendChild(span);
    }
    return node;
  }

  static value(domNode) {
    const type = domNode.getAttribute('data-type') || 'video';
    const href = domNode.getAttribute('href');
    const _id = href.replace(/{{|}}/g, '');
    let preview = '';
    const previewImg = domNode.querySelector('img');
    if (previewImg) {
      preview = previewImg.src;
    }
    return {
      _id,
      preview,
      material_type: type
    };
  }
}

Quill.register(LandingPageBlot, true);
// Quill.register(SignatureBlot, true);

export class AudioNoteBlot extends BlockEmbed {
  static tagName = 'div';
  static className = 'audio-note';
  static blotName = 'audioNote';
  static create(data) {
    if (!data) {
      return;
    }
    const node = super.create();
    node.setAttribute('contenteditable', false);
    node.innerHTML = `
      <strong>Audio Note</strong>
      ${
        data.created_at
          ? `<em class="audio-note-date">${data.created_at}</em>`
          : ''
      }
      ${
        data.content ? `<span class="audio-content">${data.content}</span>` : ''
      }
    `;
    return node;
  }
  static value(domNode) {
    const contentDom = domNode.querySelector('.audio-content');
    const dateDom = domNode.querySelector('.audio-note-date');
    let content = '';
    let date = '';
    if (contentDom) {
      content = contentDom.innerText;
    }
    if (dateDom) {
      date = dateDom.innerText;
    }
    return {
      content,
      created_at: date
    };
  }
}
Quill.register(AudioNoteBlot, true);
Block.tagName = 'DIV';
Quill.register(Block, true);

const pixelLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TAB_MULTIPLIER = 3;
export class IndentAttributor extends (Parchment.Attributor.Style as {
  new (formatName: any, styleProperty: any, attributorOptions: any): any;
}) {
  add(node, value) {
    if (value === '+1' || value === '-1') {
      const indent = this.value(node) || 0;
      value = value === '+1' ? indent + 1 : indent - 1;
    }
    if (value <= 0) {
      this.remove(node);
      return true;
    } else {
      return super.add(node, `${value * TAB_MULTIPLIER}em`);
    }
  }

  value(node) {
    var value = (parseFloat(super.value(node)) || 0) / TAB_MULTIPLIER || 0;
    return parseInt(value + '');
  }
}

export const IndentStyle = new IndentAttributor('indent', 'margin-left', {
  scope: Parchment.Scope.BLOCK,
  whitelist: pixelLevels.map((value) => `${value * TAB_MULTIPLIER}em`)
});
Quill.register({ 'formats/indent': IndentStyle }, true);

export function toInteger(value: any): number {
  return parseInt(`${value}`, 10);
}

export function toString(value: any): string {
  return value !== undefined && value !== null ? `${value}` : '';
}

export function getValueInRange(value: number, max: number, min = 0): number {
  return Math.max(Math.min(value, max), min);
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return !isNaN(toInteger(value));
}

export function isInteger(value: any): value is number {
  return (
    typeof value === 'number' && isFinite(value) && Math.floor(value) === value
  );
}

export function isDefined(value: any): boolean {
  return value !== undefined && value !== null;
}

export function padNumber(value: number): any {
  if (isNumber(value)) {
    return `0${value}`.slice(-2);
  } else {
    return '';
  }
}

export function regExpEscape(text): any {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export function hasClassName(element: any, className: string): boolean {
  return (
    element &&
    element.className &&
    element.className.split &&
    element.className.split(/\s+/).indexOf(className) >= 0
  );
}

if (typeof Element !== 'undefined' && !Element.prototype.closest) {
  // Polyfill for ie10+

  if (!Element.prototype.matches) {
    // IE uses the non-standard name: msMatchesSelector
    Element.prototype.matches =
      (Element.prototype as any).msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;
  }

  Element.prototype.closest = function (s: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let el = this;
    if (!document.documentElement.contains(el)) {
      return null;
    }
    do {
      if (el.matches(s)) {
        return el;
      }
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

export function closest(element: HTMLElement, selector): HTMLElement {
  if (!selector) {
    return null;
  }

  return element.closest(selector);
}

export function adjustPhoneNumber(str): any {
  const result = str.replace(/[^0-9]/g, '');
  if (str[0] === '+') {
    return `+${result}`;
  } else {
    return result;
  }
}

export function validateDate(dateString: string): boolean {
  const regex_yyyymmdd =
    /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/gim;
  const regex_mmddyyyy =
    /^(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d$/gim;
  const regex_ddmmyyyy =
    /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/gim;
  if (
    dateString !== '' &&
    (regex_yyyymmdd.test(dateString) ||
      regex_mmddyyyy.test(dateString) ||
      regex_ddmmyyyy.test(dateString))
  ) {
    return true;
  }
  return false;
}

export function validateUrl(url: string): boolean {
  const regex =
    /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:\/?#[\]@!\$&'\(\)\*\+,;=.]+$/gim;
  if (url === '' || !regex.test(url)) {
    return false;
  }
  return true;
}

export function validateEmail(email): boolean {
  const re = /^[a-zA-Z0-9'._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/gim;
  if (email === '' || !re.test(email)) {
    return false;
  }
  return true;
}

export function specialCharacter(str): boolean {
  const regex = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  if (!regex.test(str)) {
    return false;
  }
  return true;
}

export function matchUSPhoneNumber(phoneNumberString: string): string {
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  let phoneNumber = '';
  if (match) {
    phoneNumber = '(' + match[2] + ') ' + match[3] + '-' + match[4];
  }
  return phoneNumber;
}

export function isValidPhone(val: string): boolean {
  if (!val) {
    return true;
  } else {
    if (parsePhoneNumber(val).valid) {
      return true;
    }
  }
  return false;
}

export function getCurrentTimezone(): string {
  const oft = new Date().getTimezoneOffset();
  const offset = Math.abs(oft);
  const hour = Math.floor(offset / 60);
  const min = offset % 60;
  const symbol = oft > 0 ? '-' : '+';
  const hour_s = numPad(hour);
  const min_s = numPad(min);
  return symbol + hour_s + ':' + min_s;
}

export function offsetToTz(oft: number): string {
  const offset = Math.abs(oft);
  const hour = Math.floor(offset / 60);
  const min = offset % 60;
  const symbol = oft > 0 ? '-' : '+';
  const hour_s = numPad(hour);
  const min_s = numPad(min);
  return symbol + hour_s + ':' + min_s;
}

/**
 * Convert the time to specific timezone string
 * @param date : Date Object (year, month, day)
 * @param time : time String (hh:mm:ss.mmm)
 * @param timezone : timezone object(tz_name, zone)
 */
export function convertTimetoTz(
  date: any,
  time: string,
  timezone: any
): string {
  let dateTime = '';
  if (timezone.tz_name) {
    const dateStr = `${date.year}-${date.month}-${date.day} ${time}`;
    dateTime = moment.tz(dateStr, timezone.tz_name).format();
  } else {
    dateTime = `${date.year}-${numPad(date.month)}-${numPad(date.day)}T${time}${
      timezone.zone
    }`;
  }
  return dateTime;
}

export function convertTimetoObj(dateTime: string, timezone: any): any {
  try {
    let date = moment(dateTime);
    if (timezone.tz_name) {
      date = date.tz(timezone.tz_name);
    } else {
      date = date.utcOffset(timezone.zone);
    }
    const year = date.get('year');
    const month = date.get('month') + 1;
    const day = date.get('date');
    const hour = date.get('hour');
    const min = date.get('minute');
    const sec = date.get('second');
    return {
      year,
      month,
      day,
      time: `${numPad(hour)}:${numPad(min)}:${numPad(sec)}.000`
    };
  } catch (err) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      time: '00:00:00.000'
    };
  }
}

export function searchReg(content: string, target: string): boolean {
  try {
    const contentStr = content || '';
    const targetStr = target || '';
    const words = _.uniqBy(
      targetStr.split(' ').sort((a, b) => (a.length > b.length ? -1 : 1)),
      (e) => e.toLowerCase()
    );
    const reg = new RegExp(words.join('|'), 'gi');
    if (!targetStr || !words.length) {
      return true;
    }
    if (
      _.uniqBy(contentStr.match(reg), (e) => e.toLowerCase()).length ===
      words.length
    ) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function between(min: number, max: number): number {
  return Math.floor((max - min) * Math.random()) + min;
}

export const dataUrlToFile = (dataurl, filename) => {
  const arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]);
  let n: number = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

export function replaceToken(
  user: User,
  contact: Contact | Conversation,
  tokens: TemplateToken[],
  content: string,
  labelName = '',
  additionalFields: any = [],
  time_zone: string = DEFAULT_TIME_ZONE
): string {
  if (!contact) return content || '';
  if (!content) content = '';
  let result = content
    .replace(/{user_name}/gi, user?.user_name || 'Undefined')
    .replace(/{user_email}/gi, user?.connected_email || 'Undefined')
    .replace(/{user_phone}/gi, user?.cell_phone || 'Undefined')
    .replace(/{user_company}/gi, user?.company || 'Undefined')
    .replace(
      /{contact_first_name}/gi,
      contact?.first_name || '{contact_first_name}'
    )
    .replace(
      /{contact_last_name}/gi,
      contact?.last_name || '{contact_last_name}'
    )
    .replace(/{contact_email}/gi, contact?.email || '{contact_email}')
    .replace(/{contact_phone}/gi, contact?.cell_phone || '{contact_phone}')
    .replace(/{my_name}/gi, user?.user_name || 'Undefined')
    .replace(/{my_first_name}/gi, user?.user_name?.split(' ')?.[0] || '')
    .replace(/{my_email}/gi, user?.connected_email || 'Undefined')
    .replace(/{my_phone}/gi, user?.cell_phone || 'Undefined')
    .replace(/{my_company}/gi, user?.company || 'Undefined')
    .replace(/{label}/gi, labelName || 'Undefined');
  tokens.forEach((token) => {
    const regex = new RegExp(`\\{${token.name}\\}`, 'gi');
    let value = '';
    if (token.value !== '') {
      value = token.value;
    } else {
      const key = Object.keys(additionalFields).find(
        (key) => additionalFields[key]?.name === token.match_field
      );
      const customField = additionalFields[key];
      if (customField) {
        value = contact?.additional_field
          ? contact.additional_field[token.match_field]
          : '';
        if (customField.type === 'date') {
          value = moment.tz(value, time_zone).format('YYYY-MM-DD');
        }
      } else {
        if (token.match_field === 'deal') {
          value = token.name;
        } else {
          value = contact ? contact[token.match_field] : '';
        }
      }
    }
    result = result.replace(regex, value);
  });
  return result;
}

export function parseKeyValuePairsFromMsg(message: string) {
  // Regular expression pattern to match values inside {{}}
  const pattern = /{{(.*?)}}/g;

  // Match all occurrences of values inside {{}}
  const matches = message.match(pattern);

  // Parse key-value pairs from matches
  if (matches) {
    const keyValuePairs = matches.map((match) => {
      const [, key, value] = match.match(/{{(.*?):(.*?)}}/) || [];
      return { key, value };
    });
    return keyValuePairs.filter((pair) =>
      ['video', 'image', 'pdf'].includes(pair.key)
    );
  }
  return [];
}

export const getNextBusinessDate = (businessDays, time_zone) => {
  let today = moment();
  let weekday = moment.tz(today, time_zone).format('ddd').toLowerCase();
  let count = 0;
  while (!businessDays[weekday] && count < 7) {
    count++;
    today = moment().add(count, 'days');
    weekday = moment.tz(today, time_zone).format('ddd').toLowerCase();
  }
  return today;
};

export const getFormattedTime = (time) => {
  const index = TIMES.findIndex((item) => item.id === time);
  if (index >= 0) {
    return TIMES[index].text;
  }
  return time;
};

export const getUnformattedTime = (time) => {
  const index = TIMES.findIndex((item) => item.text === time);
  if (index >= 0) {
    return TIMES[index].id;
  }
  return time;
};

export const getNameFromTZ = (tz_name) => {
  for (const region of WIN_TIMEZONE) {
    const index = region.timezones.findIndex(
      (item) => item.tz_name === tz_name
    );
    if (index >= 0) {
      return region.timezones[index]['name'];
    }
  }
  return WIN_TIMEZONE[0].timezones[0]['name'];
};

export const getZoneFromTimeZone = (tz_name) => {
  for (const region of WIN_TIMEZONE) {
    const index = region.timezones.findIndex(
      (item) => item.tz_name === tz_name
    );
    if (index >= 0) {
      if (region.timezones[index]['zone']) {
        return region.timezones[index]['zone'];
      } else {
        return WIN_TIMEZONE[0].timezones[0]['zone'];
      }
    }
  }
  return WIN_TIMEZONE[0].timezones[0]['zone'];
};

export const initSignatureTemplate = (user) => {
  let email_signature = '';
  if (user['picture_profile']) {
    const picture_profile = user['picture_profile'].includes('-resize')
      ? user['picture_profile']
      : `${user['picture_profile']}-resize`;
    const companyString =
      user.source === 'vortex' ? '' : '<div>eXp Realty, LLC<br></div>';
    email_signature =
      '<div>' +
      user.user_name +
      '<br></div>' +
      companyString +
      '<div>' +
      user.email +
      '<br></div><div>' +
      user.cell_phone +
      '<br></div>' +
      "<div><img src='" +
      picture_profile +
      "' alt='' " +
      "style='width: 100px; height: 100px; border-radius: 50%; object-fit: cover;' /></div>";
  } else {
    const companyString =
      user.source === 'vortex' ? '' : '<div>eXp Realty, LLC<br></div>';
    email_signature =
      '<div>' +
      user.user_name +
      '<br></div>' +
      companyString +
      '<div>' +
      user.email +
      '<br></div><div>' +
      user.cell_phone +
      '<br></div>' +
      '<div></div>';
  }
  return email_signature;
};

export const getUserTimezone = (user: User, isDefault = true) => {
  if (user.time_zone_info) {
    try {
      return (
        JSON.parse(user.time_zone_info)?.tz_name ||
        (isDefault ? DEFAULT_TIME_ZONE : moment.tz.guess())
      );
    } catch (err) {
      return (
        user.time_zone_info ||
        (isDefault ? DEFAULT_TIME_ZONE : moment.tz.guess())
      );
    }
  } else {
    return isDefault ? DEFAULT_TIME_ZONE : moment.tz.guess();
  }
};

export function insertMomentIntoSortedArray(
  array: string[],
  newDate: string
): string[] {
  if (array.length === 0) {
    return [newDate];
  }

  let left = 0;
  let right = array.length - 1;

  // Binary search for the correct insertion point
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (
      moment(array[mid], 'HH:mm:[00.000]').isBefore(
        moment(newDate, 'HH:mm:[00.000]')
      )
    ) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Insert the new moment at the found position
  array.splice(left, 0, newDate);

  return array;
}

export const getTokenIds = (templateTokens = [], content = '') => {
  if (content === '') return [];
  if (!templateTokens?.length) return [];
  const result = [];
  templateTokens.forEach((token) => {
    if (content.includes(token.name)) {
      result.push(token.id);
    }
  });
  return result;
};

export const sortEdges = (edges) => {
  const edgesEnum = edges.reduce((data, e) => {
    const source = e.source;
    if (data[source]) {
      data[source].push(e);
    } else {
      data[source] = [e];
    }
    return data;
  }, {});

  let sortedEdges = [];

  let nextSourceNodes = [];
  let currentSourceNodes = ['a_10000'];
  while (currentSourceNodes.length) {
    for (let i = 0; i < currentSourceNodes.length; i++) {
      const connectedEdges = edgesEnum[currentSourceNodes[i]] || [];
      sortedEdges = [...sortedEdges, ...connectedEdges];
      connectedEdges.forEach((e) => {
        const target = e.target;
        nextSourceNodes.push(target);
      });
    }
    currentSourceNodes = [...nextSourceNodes];
    nextSourceNodes = [];
  }

  return sortedEdges;
};
