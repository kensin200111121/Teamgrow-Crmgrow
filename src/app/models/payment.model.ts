import { Deserializable } from '@models/deserialize.model';

export class Payment implements Deserializable {
  email: string;
  card_name: string;
  customer_id: string;
  card: string;
  card_id: string;
  plan_id: string;
  token: string;
  subscription: string;
  fingerprint: string;
  card_brand: string;
  bill_amount: string;
  exp_year: string;
  exp_month: string;
  referral: string;
  active: boolean;
  last4: string;
  updated_at: Date;
  created_at: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
