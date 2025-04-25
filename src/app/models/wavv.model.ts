export interface RinglessMessage {
  id: string;
  name: string;
  createdAt: string;
  seconds: number;
  url: string;
}

export interface RinglessRequest {
  voicemailId: string;
  contacts: string[];
  forwardingNumber: string;
  name?: string;
  scheduledTime?: Date;
}
