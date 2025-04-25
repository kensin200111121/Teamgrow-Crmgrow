import { Deserializable } from '@models/deserialize.model';

export class AgentFilter implements Deserializable {
  _id: string;
  user: string;
  state = '';
  exclude_brokerage: string;
  period: string;
  max = 0;
  min = 0;
  count = 1;
  created_at: string;
  updated_at: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get time_frame(): number {
    return this.period === 'lastyear'? 12: 6;    
  }

  set time_frame(val) {
    this.period = parseInt(val.toString()) === 6 ? 'lastsixmonths' : 'lastyear';
  }

  get listing_type() {
    let val = 0;
    if (this.period === 'lastsixmonths') {
        if (this.min == 12) val = 0;
        else if (this.min == 6) val = 1;
        else val = 2;        
    } else { // lastyear
        if (this.min == 24) val = 0;
        else if (this.min == 13) val = 1;
        else val = 2;
    }
    return val;
  }

  set listing_type(val) {
    switch (parseInt(val.toString())) {
      case 0:
        this.min = this.time_frame === 6 ? 12 : 24;
        this.max = null;
        break;
      case 1:
        this.min = this.time_frame === 6 ? 6 : 13;
        this.max = this.time_frame === 6 ? 12 : 24;
        break;
      default: // 2 or other value
        this.min = null;
        this.max = this.time_frame === 6 ? 5 : 12;
        break;      
    }
  }
}
