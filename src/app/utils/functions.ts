import * as _ from 'lodash';
import { PACKAGE_LEVEL } from '@constants/variable.constants';
import { Contact } from '@models/contact.model';
import { Alias } from '@utils/data.types';
import { DateFormatEnum } from '@utils/enum';
import { environment } from '@environments/environment';
import moment from 'moment-timezone';

export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/gim;
  if (email == '' || !re.test(email)) {
    return false;
  }
  return true;
}

export function convertToStringArray(input: string | string[]): string[] {
  if (typeof input === 'string') {
    // If input is a string, convert it to a string array with a single element
    return [input];
  } else {
    // If input is already a string array, return it as is
    return input;
  }
}

export function areAllStringFieldsNullOrEmpty(obj: {
  [key: string]: any;
}): boolean {
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].trim() !== '') {
      return false;
    } else if (obj[key] instanceof Array) {
      return false;
    }
  }
  return true;
}

export function sortStringArray(
  array: any[],
  field: string,
  ascending = true
): any[] {
  if (array.length > 0) {
    const searchDirection = ascending ? 'asc' : 'desc';
    if (field === 'title') {
      array = _.orderBy(
        array,
        [(e) => (e?.title || '').toLowerCase()],
        [searchDirection]
      );
    } else if (field === 'subject') {
      array = _.orderBy(
        array,
        [(e) => (e?.subject || '').toLowerCase()],
        [searchDirection]
      );
    } else if (field === 'contacts') {
      array = _.orderBy(
        array,
        [
          (e) =>
            e.contacts && e.contacts.length > 0
              ? (e.contacts[0].first_name === '' &&
                e.contacts[0].last_name === ''
                  ? 'Unnamed Contact'
                  : e.contacts[0].first_name + ' ' + e.contacts[0].last_name
                ).toLowerCase()
              : ''
        ],
        [searchDirection]
      );
    } else {
      array = _.orderBy(array, [field], [searchDirection]);
    }
    return array;
  }
  return [];
}

export function sortDateArray(
  array: any[],
  field: string,
  ascending = true
): any[] {
  if (array.length > 0) {
    const searchDirection = ascending ? 'asc' : 'desc';
    if (field === 'inquired') {
      array = _.orderBy(array, (o) => new Date(o['created_at']), [
        searchDirection
      ]);
    } else if (field === 'proposed') {
      array = _.orderBy(array, (o) => new Date(o['proposed_at'][0]), [
        searchDirection
      ]);
    } else if (field === 'schedule') {
      array = _.orderBy(
        array,
        (o) => (o['confirmed_at'] ? new Date(o['confirmed_at']) : new Date()),
        [searchDirection]
      );
    }
    array = _.orderBy(array, (o) => new Date(o[field]), [searchDirection]);
    return array;
  }
  return [];
}

export function sortObjectArray(
  array: any[],
  field: string,
  ascending = true
): any[] {
  if (array.length > 0) {
    const searchDirection = ascending ? 'asc' : 'desc';
    if (field === 'organizer') {
      array = _.orderBy(
        array,
        [(e) => (e?.user.user_name || '').toLowerCase()],
        [searchDirection]
      );
    } else if (field === 'leader') {
      array = _.orderBy(
        array,
        [(e) => (e?.leader.user_name || '').toLowerCase()],
        [searchDirection]
      );
    } else {
      array = _.orderBy(array, [field], [searchDirection]);
    }
    return array;
  }
  return [];
}

export function getUserLevel(level): string {
  if (level) {
    return level.toUpperCase();
  }
  // return PACKAGE_LEVEL.LITE.package;
  return PACKAGE_LEVEL.GROWTH.package;
  // return PACKAGE_LEVEL.ELITE.package;
  // return PACKAGE_LEVEL.CUSTOM.package;
}

export function getContactHTML(contact: Contact): string {
  if (contact) {
    const html = `
      <div class="contact-member">
      <div class="main-info">
          <div class="picture">
            ${contact.avatarName}
          </div>
          <div class="full-name">
            ${contact.fullName}
          </div>
      </div>
    </div>
    `;
    return html;
  } else {
    return '';
  }
}

const NOTIFICATIONS = {
  team_invited: `{who} has invited you to the community {team}`,
  team_accept: `{who} has accepted your invitation to the community {team}`,
  team_reject: `{who} has rejected your invitation to the community {team}`,
  team_requested: `{who} has sent join request to the community {team}`,
  join_accept: `{who} has accepted your community join request for the community {team}`,
  join_reject: `{who} has rejected your community join request for the community {team}`,
  team_remove: `{team} has removed by owner {who}`,
  team_member_remove: `You have been removed from the community {team} by {who}`,
  team_role_change:
    'Your role has been changed in the community {team} by {who}',
  share_automation:
    '{who} has shared the automation {detail} in the community {team}',
  stop_share_automation:
    '{who} has removed the automation {detail} from the community {team}',
  share_template:
    '{who} has shared the template {detail} in the community {team}',
  stop_share_template:
    '{who} has removed the template {detail} from the community {team}',
  contact_shared:
    '{who} has shared the contact {detail} in the community {team}',
  stop_share_contact:
    '{who} has remove the contact {detail} from the community {team}',
  share_material: '{who} has shared {detail} in the community {team}',
  stop_share_material: '{who} has removed {detail} in the community {team}',
  material_track: '{who} has watched {material} {detail}',
  unsubscribe: '{who} has unsubscribed the emails from you.',
  open_email: '{who} has opened email from you.',
  click_link: '{who} has clicked the link from your email.',
  transfer_contact:
    '{who} has transferred the contact {detail} from the community {team}',
  share_contact:
    '{who} has shared the contact {detail} from the community {team}',
  clone_contact:
    '{who} has cloned the contact {detail} from the community {team}',
  share_pipeline:
    '{who} has shared the pipeline {detail} from the community {team}'
};

export function getNotificationDetail(notification): string {
  let creator = '';
  if (notification.creator) {
    creator = `<span class="creator">${notification.creator.user_name}</span>`;
  } else {
    creator = 'Someone';
  }
  let team = '<a>Unknown Community</a>';
  let contact;
  let detail;
  let material;
  let content = '';
  switch (notification.criteria) {
    case 'bulk_sms':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }
      if (notification.status === 'sent') {
        content = `Texting to ${creator} is failed.`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status.failed.length;
          const succeed = notification.deliver_status.succeed.length;
          if (!failed) {
            detail = 'All are delivered successfully';
          } else {
            detail = `${failed} of ${failed + succeed} texts are failed.`;
          }
        }
        content = `Bulk Texting is completed. ${detail}`;
      } else if (notification.status === 'delivered') {
        content = 'Text is delivered successfully.';
      } else if (notification.status === 'undelivered') {
        content = 'Text is failed.';
      } else {
        content = 'Bulk Texting is pending now.';
      }
      break;
    case 'bulk_text':
      if (notification.status === 'pending') {
        content = `Texting result checking is progressing. Texting is failed for ${notification.deliver_status?.failed?.length} contacts`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          const total = notification.contact?.length;
          if (!failed) {
            detail = `All of ${total} texts are sent successfully.`;
          } else {
            detail = `${failed} of ${total} texts are failed.`;
          }
        }
        content = `Texting result checking is completed. ${detail}`;
      } else {
        content = 'Bulk text sending is pending now';
      }
      break;
    case 'send_text':
      if (notification.status === 'pending') {
        content = `Texting result checking is progressing. Texting is failed for ${notification.deliver_status?.failed?.length} contacts`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          if (!failed) {
            detail = `Text is sent successfully.`;
          } else {
            detail = `Text is failed.`;
          }
        }
        content = `Texting result checking is completed. ${detail}`;
      } else {
        content = 'Text sending is pending now';
      }
      break;
    case 'assign_automation':
      if (notification.status === 'pending') {
        const total = notification.contact?.length;
        content = `Automation is assigning to ${total} contacts.`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          const total = notification.contact?.length;
          if (!failed) {
            detail = `All of ${total} automations are assigned successfully.`;
          } else {
            detail = `${failed} of ${total} automation assignings are failed.`;
          }
        }
        content = `Automation bulk assigning is completed. ${detail}`;
      } else {
        content = 'Automation bulk assigning is pending now.';
      }
      break;
    case 'automation_completed':
      const title = notification.detail?.title || '';
      if (notification.contact && notification.contact.length) {
        const contact = new Contact().deserialize(notification.contact[0]);
        content = `Contact automation${
          title ? '(' + title + ')' : ''
        } which is assigned to <a>${contact.fullName}</a> are completed.`;
      } else if (notification.deal && notification.deal.length) {
        const deal = notification.deal[0];
        content = `Deal automation${
          title ? '(' + title + ')' : ''
        } which is assigned to <a>deal: ${deal.title}</a> are completed.`;
      } else {
        content = notification.content;
      }
      break;
    case 'bulk_email':
      if (notification.status === 'pending') {
        content = `Bulk emailing is progressing. Emailing is failed for ${notification.deliver_status?.failed?.length} contacts`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          const total = notification.contact?.length;
          if (!failed) {
            detail = `All of ${total} emails are sent successfully.`;
          } else {
            detail = `${failed} of ${total} emails are failed.`;
          }
        }
        content = `Emailing is completed. ${detail}`;
      } else {
        content = 'Bulk Emailing sending is pending now';
      }
      break;
    case 'send_email':
      if (notification.status === 'pending') {
        content = `Emailing is progressing. Emailing is failed for ${notification.deliver_status?.failed?.length} contacts`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          if (!failed) {
            detail = `Email is sent successfully.`;
          } else {
            detail = `Email is failed.`;
          }
        }
        content = `Emailing is completed. ${detail}`;
      } else {
        content = 'Emailing sending is pending now';
      }
      break;
    case 'team_invited':
    case 'team_accept':
    case 'team_reject':
    case 'team_requested':
    case 'join_accept':
    case 'join_reject':
    case 'team_remove':
    case 'team_member_remove':
    case 'team_role_change':
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else if (notification.content) {
        return notification.content;
      }
      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      content = content.replace('{team}', team);
      break;
    case 'share_pipeline':
      if (
        notification.action &&
        notification.action.pipeline &&
        notification.action.pipeline.length
      ) {
        detail = `<a>${notification.action.pipeline[0].title}</a>`;
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Pipeline</a>';
      }
      content = NOTIFICATIONS[notification.criteria];
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Community</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'share_automation':
    case 'stop_share_automation':
      if (
        notification.action &&
        notification.action.automation &&
        notification.action.automation.length
      ) {
        detail = `<a>${notification.action.automation[0].title}</a>`;
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Automation</a>';
      }
      content = NOTIFICATIONS[notification.criteria];
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Community</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'share_template':
    case 'stop_share_template':
      if (
        notification.action &&
        notification.action.template &&
        notification.action.template.length
      ) {
        detail = `<a>${notification.action.template[0].title}</a>`;
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Template</a>';
      }
      content = NOTIFICATIONS[notification.criteria];
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Community</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'share_material':
    case 'stop_share_material':
      if (
        notification.action &&
        notification.action.object &&
        notification.action[notification.action.object] &&
        notification.action[notification.action.object].length
      ) {
        detail = `the ${notification.action.object} <a>${
          notification.action[notification.action.object][0].title
        }</a>`;
      } else if (
        notification.action.video.length ||
        notification.action.pdf.length ||
        notification.action.image.length
      ) {
        const videos = [];
        const pdfs = [];
        const images = [];
        const contents = [];
        let noEmptyCount = 0;
        notification.action.video.forEach((e) =>
          videos.push(`<a>${e.title}</a>`)
        );
        notification.action.pdf.forEach((e) => pdfs.push(`<a>${e.title}</a>`));
        notification.action.image.forEach((e) =>
          images.push(`<a>${e.title}</a>`)
        );
        if (notification.action.video.length) {
          noEmptyCount++;
          contents.push(`the videos ${videos.join(',')}`);
        }
        if (notification.action.pdf.length) {
          noEmptyCount++;
          contents.push(`the pdfs ${pdfs.join(',')}`);
        }
        if (notification.action.image.length) {
          noEmptyCount++;
          contents.push(`the images ${images.join(',')}`);
        }
        if (noEmptyCount > 1) {
          detail = `the materials ${[...videos, ...pdfs, ...images].join(',')}`;
        } else {
          detail = contents;
        }
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Material</a>';
      }
      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Community</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'contact_shared':
    case 'stop_share_contact':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        detail = `<a>${contact.fullName}</a>`;
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Contact</a>';
      }
      content = NOTIFICATIONS[notification.criteria];
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Community</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'open_email':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      break;
    case 'click_link':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      break;
    case 'unsubscribe':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      break;
    case 'material_track':
      if (
        notification.action &&
        notification.action.object &&
        notification.action[notification.action.object] &&
        notification.action[notification.action.object].length
      ) {
        material = `the ${notification.action.object} <a>${
          notification.action[notification.action.object][0].title
        }</a>`;
      } else {
        content = NOTIFICATIONS[notification.criteria] || '';
        content = content.replace('{who}', 'Someone');
        content = content.replace('{detail}', '');
        content = content.replace('{material}', 'your material');
      }
      if (notification.action && notification.video_tracker) {
        const duration = Math.round(notification.video_tracker.duration / 1000);
        detail = `for ${getDuration(duration * 1000)}`;
      } else {
        detail = '';
      }
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      content = content.replace('{material}', material);
      content = content.replace('{detail}', detail);
      break;
    case 'dialer_call':
      if (notification && notification.contact && notification.contact.length) {
        content = 'Called to ' + notification.contact.length + ' contact(s)';
      } else {
        content = 'Called to someone';
      }
      break;
    default:
      content = notification.content;
      break;
  }
  return content;
}

export function getDuration(value): string {
  let input = 0;
  try {
    input = parseInt(value);
  } catch (err) {
    return '';
  }
  if (isNaN(input)) {
    return '';
  }
  if (input < 0) {
    input = 0;
  }
  const dateObj = new Date(input);
  const hours = dateObj.getUTCHours();
  const hourString = hours.toString();
  const minutes = dateObj.getUTCMinutes().toString();
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  if (hours) {
    const timeString =
      hourString + ':' + minutes.padStart(2, '0') + ':' + seconds;
    return timeString;
  } else {
    return minutes + ':' + seconds;
  }
}

export function isEmptyHtml(html): boolean {
  const a = document.createElement('div');
  a.innerHTML = html;
  if (a.getElementsByTagName('img').length || (a.innerText || '').trim()) {
    return false;
  } else {
    return true;
  }
}

export function groupBy<K, V>(
  array: V[],
  grouper: (item: V) => K
): Map<K, V[]> {
  return array.reduce((store, item) => {
    const key = grouper(item);
    if (!store.has(key)) {
      store.set(key, [item]);
    } else {
      store.get(key).push(item);
    }
    return store;
  }, new Map<K, V[]>());
}

export function generatePassword(passwordLength: number): string {
  const numberChars = '0123456789';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const allChars = numberChars + upperChars + lowerChars;
  let randPasswordArray = Array(passwordLength);
  randPasswordArray[0] = numberChars;
  randPasswordArray[1] = upperChars;
  randPasswordArray[2] = lowerChars;
  randPasswordArray = randPasswordArray.fill(allChars, 3);
  return shuffleArray(
    randPasswordArray.map(function (x) {
      return x[Math.floor(Math.random() * x.length)];
    })
  ).join('');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function getRandomInt(min?: number, max?: number): number {
  if (!min) min = 0;
  if (!max) max = 1;
  return Math.floor(Math.random() * (max - min)) + min;
}

export function formatDate(
  day: number,
  month: number,
  year: number,
  format?: string
): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yyyy = String(year);
  format = format || DateFormatEnum.MMDDYYYY;

  let formattedDate = '';
  switch (format) {
    case DateFormatEnum.DD_MM_YYYY:
      formattedDate = `${dd}-${mm}-${yyyy}`;
      break;
    case DateFormatEnum.MM_DD_YYYY:
      formattedDate = `${mm}-${dd}-${yyyy}`;
      break;
    case DateFormatEnum.YYYY_MM_DD:
      formattedDate = `${yyyy}-${mm}-${dd}`;
      break;
    case DateFormatEnum.DDMMYYYY:
      formattedDate = `${dd}/${mm}/${yyyy}`;
      break;
    case DateFormatEnum.MMDDYYYY:
      formattedDate = `${mm}/${dd}/${yyyy}`;
      break;
    case DateFormatEnum.YYYYMMDD:
      formattedDate = `${yyyy}/${mm}/${dd}`;
      break;
    default:
      formattedDate = `${dd}-${mm}-${yyyy}`;
  }
  return formattedDate;
}

export function initData(
  defaultAlias: Alias,
  aliasList: Alias[] = []
): { list: Alias[]; primary: Alias } {
  if (!aliasList.length) {
    return {
      list: [{ ...defaultAlias, primary: true, is_default: true }],
      primary: { ...defaultAlias, primary: true, is_default: true }
    };
  }
  let hasPrimary = false;
  let primaryAlias = null;
  aliasList.some((e) => {
    if (e.primary) {
      hasPrimary = true;
      primaryAlias = e;
      return true;
    }
  });
  if (hasPrimary) {
    return {
      list: [{ ...defaultAlias, is_default: true }, ...aliasList],
      primary: primaryAlias
    };
  } else {
    return {
      list: [
        { ...defaultAlias, is_default: true, primary: true },
        ...aliasList
      ],
      primary: { ...defaultAlias, is_default: true, primary: true }
    };
  }
}

export const JSONParser = (value: string, defaultValue = null) => {
  try {
    const parsedValue = JSON.parse(value);
    return parsedValue;
  } catch (err) {
    return defaultValue;
  }
};

export const toggle = (array, item) => _.xor(array, [item]);
export const toggleArray = (array, items) => _.xor(array, items);

export const validateDateTime = (value: string) => {
  if (/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3})Z$/.test(value)) {
    return true;
  }
  return false;
};

export const convertIdToUrlOnSMS = (content: string): string => {
  // Regular expressions to match {video:...} and {image:...} and {pdf:...} ,{page:....}
  const videoRegex = /\{\{video:([^}]+)\}\}/g;
  const imageRegex = /\{\{image:([^}]+)\}\}/g;
  const pdfRegex = /\{\{pdf:([^}]+)\}\}/g;
  const pageRegex = /\{\{page:([^}]+)\}\}/g;

  // Function to extract values
  function extractValues(text, regex) {
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  // Extract video and image values
  const videoValues = extractValues(content, videoRegex);
  const pdfValues = extractValues(content, pdfRegex);
  const imageValues = extractValues(content, imageRegex);
  const pageValues = extractValues(content, pageRegex);

  videoValues.forEach((id) => {
    content = content.replace(
      `{{video:${id}}}`,
      `${environment.website}/video/${id}`
    );
  });
  pdfValues.forEach((id) => {
    content = content.replace(
      `{{pdf:${id}}}`,
      `${environment.website}/pdf/${id}`
    );
  });
  imageValues.forEach((id) => {
    content = content.replace(
      `{{image:${id}}}`,
      `${environment.website}/image/${id}`
    );
  });
  pageValues.forEach((id) => {
    content = content.replace(
      `{{page:${id}}}`,
      `${environment.website}/page/${id}`
    );
  });
  return content;
};

/**
 * Get the material ids from the text content that contains the material link
 * @param text: content that contains the material link
 * @returns: materials: [{type, id}]
 */
export const getIdsOnSMS = (text = '') => {
  const videoIds = [];
  const pdfIds = [];
  const imageIds = [];
  const materials = [];

  // const website = '.crmgrow.com';
  const website = environment.website;

  const videoReg = new RegExp(website + '/video/\\w+', 'g');
  const pdfReg = new RegExp(website + '/pdf/\\w+', 'g');
  const imageReg = new RegExp(website + '/image/\\w+', 'g');

  let matches = text.match(videoReg);
  if (matches && matches.length) {
    matches.forEach((e) => {
      const videoId = e.replace(website + '/video/', '');
      videoIds.push(videoId);
      materials.push({ type: 'video', _id: videoId, material_type: 'video' });
    });
  }
  matches = text.match(pdfReg);
  if (matches && matches.length) {
    matches.forEach((e) => {
      const pdfId = e.replace(website + '/pdf/', '');
      pdfIds.push(pdfId);
      materials.push({ type: 'pdf', _id: pdfId, material_type: 'pdf' });
    });
  }
  matches = text.match(imageReg);
  if (matches && matches.length) {
    matches.forEach((e) => {
      const imageId = e.replace(website + '/image/', '');
      imageIds.push(imageId);
      materials.push({ type: 'image', _id: imageId, material_type: 'image' });
    });
  }
  return {
    videoIds,
    imageIds,
    pdfIds,
    materials
  };
};

/**
 * Get the landing page ids from the text content that contains the lansing page link
 * @param text: content that contains the landingPage link
 * @returns: landing page ids
 */
export const getLandingPageIdsOnSMS = (text = '') => {
  const ids = [];
  const website = '.crmgrow.com';
  const pageReg = new RegExp(website + '/page/\\w+', 'g');
  const matches = text.match(pageReg);
  if (matches && matches.length) {
    matches.forEach((e) => {
      const pageId = e.replace(website + '/page/', '');
      ids.push(pageId);
    });
  }
  return ids;
};

export const convertURLToIdOnSMS = (content: string): string => {
  const { videoIds, imageIds, pdfIds } = getIdsOnSMS(content);
  videoIds.forEach((videoId) => {
    content = content.replace(
      `${environment.website}/video/${videoId}`,
      `{{video:${videoId}}}`
    );
  });

  imageIds.forEach((imageId) => {
    content = content.replace(
      `${environment.website}/image/${imageId}`,
      `{{image:${imageId}}}`
    );
  });
  pdfIds.forEach((pdfId) => {
    content = content.replace(
      `${environment.website}/pdf/${pdfId}`,
      `{{pdf:${pdfId}}}`
    );
  });
  return content;
};

/**
 * Get the converted content and material  and landing page ids from the text content
 * @param text: content that contains the landingPage link and material links
 * @returns: landing page and material ids and converted content
 */
export const parseURLToIdsAndPairedUrl = (
  content: string
): {
  content: string;
  videoIds: string[];
  imageIds: string[];
  pdfIds: string[];
  landingPageIds: string[];
} => {
  const { videoIds, imageIds, pdfIds } = getIdsOnSMS(content);
  const landingPageIds = getLandingPageIdsOnSMS(content);
  videoIds.forEach((videoId) => {
    content = content.replace(
      `${environment.website}/video/${videoId}`,
      `{{video:${videoId}}}`
    );
  });
  imageIds.forEach((imageId) => {
    content = content.replace(
      `${environment.website}/image/${imageId}`,
      `{{image:${imageId}}}`
    );
  });
  pdfIds.forEach((pdfId) => {
    content = content.replace(
      `${environment.website}/pdf/${pdfId}`,
      `{{pdf:${pdfId}}}`
    );
  });
  landingPageIds.forEach((pageId) => {
    content = content.replace(
      `${environment.website}/page/${pageId}`,
      `{{page:${pageId}}}`
    );
  });
  return { content, videoIds, imageIds, pdfIds, landingPageIds };
};

export const convertMaterialIdToFullUrl = (
  ids: {
    videoIds: string[];
    imageIds: string[];
    pdfIds: string[];
  },
  content: string
) => {
  const { videoIds, imageIds, pdfIds } = ids;
  videoIds.forEach((videoId) => {
    content = content.replace(
      `{{${videoId}}}`,
      `${environment.website}/video/${videoId}`
    );
  });
  imageIds.forEach((imageId) => {
    content = content.replace(
      `{{${imageId}}}`,
      `${environment.website}/image/${imageId}`
    );
  });
  pdfIds.forEach((pdfId) => {
    content = content.replace(
      `{{${pdfId}}}`,
      `${environment.website}/pdf/${pdfId}`
    );
  });
  return content;
};

export const getDateByTimeZone = (date) => {
  const defaultTimezoneName = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();
  const d = moment(
    moment.tz(date, defaultTimezoneName).format('YYYY-MM-DDTHH:mm:ss') + '.000Z'
  );
  return d;
};

export const getIntervalDate = (date, mode) => {
  const min_date = moment(date).startOf(mode);
  const max_date = min_date.clone().add(1, mode);
  return { min_date, max_date };
};
