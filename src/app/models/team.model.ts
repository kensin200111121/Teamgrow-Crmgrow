import { Deserializable } from '@models/deserialize.model';
import * as _ from 'lodash';
export class Team implements Deserializable {
  _id: string;
  owner: any[];
  name: string;
  picture: string;
  description: string;
  email: string;
  cell_phone: string;
  highlights: string[];
  brands: string[];
  members: any[];
  invites: any[];
  requests: any[];
  referrals: any[];
  editors: any[];
  videos: string[];
  pdfs: string[];
  images: string[];
  folders: string[];
  automations: string[];
  email_templates: string[];
  contacts: any[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
  team_setting: any;
  is_internal: boolean;
  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get memberCount(): number {
    return this.editors.length + this.members.length;
  }
  get materialCount(): number {
    return this.videos.length + this.pdfs.length + this.images.length;
  }

  public isActive(id: string): boolean {
    if (this.owner && this.owner.length) {
      if (typeof this.owner[0] === 'string') {
        if (this.owner.indexOf(id) !== -1) {
          return true;
        }
      } else {
        const pos = _.findIndex(this.owner, (e) => e._id === id);
        if (pos !== -1) {
          return true;
        }
      }
    }
    if (this.editors && this.editors.length) {
      if (typeof this.editors[0] === 'string') {
        if (this.editors.indexOf(id) !== -1) {
          return true;
        }
      } else {
        const pos = _.findIndex(this.editors, (e) => e._id === id);
        if (pos !== -1) {
          return true;
        }
      }
    }
    return false;
  }
}
