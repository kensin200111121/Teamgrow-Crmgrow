import { Deserializable } from '@models/deserialize.model';

export class Guest implements Deserializable {
  _id: string;
  user: string;
  name: string;
  email: string;
  password: string;
  disabled: boolean;
  last_logged: Date;
  created_at: string;
  updated_at: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get avatarName(): string {
    const names = this.name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    } else {
      return names[0][0];
    }
  }
}
