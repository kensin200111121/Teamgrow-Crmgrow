import { Deserializable } from '@models/deserialize.model';

export class Conversation implements Deserializable {
  _id: string;
  first_name: string;
  last_name: string;
  cell_phone: string;
  last_text: any;
  last_received_text?: any;
  activity: any;
  label?: string;
  additional_field?: object;
  email?: string;

  deserialize(input: any): this {
    if (!input.last_received_text) {
      // if there is no last_received_text value, init with invalid text object (type: 0) for the sorting
      if (input.last_text?.type) {
        input.last_received_text = { ...input.last_text };
      } else {
        input.last_received_text = { created_at: 0, type: 0, status: 1 };
      }
    }
    return Object.assign(this, input);
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

  get isPending(): boolean {
    return (
      !this.last_text?.type &&
      this.activity &&
      this.activity.status !== 'completed'
    );
  }

  get isFailed(): boolean {
    return !this.last_text?.type && !this.activity;
  }

  get isUnread(): boolean {
    return this.last_received_text?.type && !this.last_received_text?.status;
  }

  set unread(val: boolean) {
    if (!val) {
      if (this.last_received_text) {
        this.last_received_text.type = 1;
        this.last_received_text.status = 1;
        this.last_received_text.created_at = new Date();
      } else {
        this.last_received_text = {
          type: 0,
          status: 1,
          created_at: new Date()
        };
      }
    }
  }
}
