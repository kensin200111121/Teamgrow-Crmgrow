import { Component, OnInit } from '@angular/core';
import { LabelService } from '@services/label.service';

@Component({
  selector: 'app-analytics-contacts-added',
  templateUrl: './analytics-contacts-added.component.html',
  styleUrls: ['./analytics-contacts-added.component.scss']
})
export class AnalyticsContactsAddedComponent implements OnInit {
  selectedWeekly = 0;
  weekly = ['2 WEEK BEFORE', '1 WEEK BEFORE', 'THIS WEEK'];
  selectedMonthly = 0;
  monthly = ['2 MONTH BEFORE', '1 MONTH BEFORE', 'THIS MONTH'];
  topExpanded = true;
  labels = [];
  contacts = [
    {
      last_name: 'Jones',
      email: 'brenda.jones@yahoo.com',
      user: ['5e9a0285efb6b2a3449245da'],
      shared_members: [],
      cell_phone: '+13125639654',
      country: 'US',
      tags: ['watchedvideos', 'expcon', 'cold'],
      _id: '5ea3c0046225871364c6a279',
      tag: [],
      first_name: 'Brenda ',
      address: '698 E Milwaukee Ave',
      city: 'Anderson',
      state: '',
      zip: '29621',
      label: '5f16d58d0af09220208b6e0a',
      brokerage: 'Century 21',
      source: 'Referral',
      created_at: '2020-04-25T04:43:48.555Z',
      updated_at: '2020-11-18T03:22:42.320Z',
      __v: 0,
      last_activity: {
        send_type: 0,
        _id: '5f875bad645c91426d637964',
        content: 'added note',
        contacts: '5ea3c0046225871364c6a279',
        user: '5e9a0285efb6b2a3449245da',
        type: 'notes',
        notes: '5f875bad645c91426d637963',
        created_at: '2020-10-14T20:12:29.368Z',
        updated_at: '2020-10-14T20:12:29.368Z',
        __v: 0
      }
    },
    {
      last_name: 'King',
      email: 'cait.kingggg@yahoo.com',
      user: ['5e9a0285efb6b2a3449245da'],
      shared_members: [],
      cell_phone: '+15893197530',
      country: 'US',
      tags: ['warm', 'openhouse', 'topproducer'],
      _id: '5ea3c0046225871364c6a27c',
      tag: [],
      first_name: 'Cait',
      address: '91234 S Green St',
      city: 'Chicago',
      state: '',
      zip: '60632',
      label: '5f16d58d0af09220208b6e0b',
      brokerage: 'Next Home Realty',
      source: 'Openhouse',
      created_at: '2020-04-25T04:43:48.704Z',
      updated_at: '2020-11-18T03:22:42.320Z',
      __v: 0,
      last_activity: {
        send_type: 0,
        _id: '5fa31acd82a98b427ad55d04',
        content: 'completed follow up',
        contacts: '5ea3c0046225871364c6a27c',
        user: '5e9a0285efb6b2a3449245da',
        type: 'follow_ups',
        follow_ups: '5f875bbd645c91426d637965',
        created_at: '2020-11-04T21:19:09.058Z',
        updated_at: '2020-11-04T21:19:09.058Z',
        __v: 0
      }
    },
    {
      last_name: 'Murphy ',
      email: 'clay.murphyyy@gmail.com',
      user: ['5e9a0285efb6b2a3449245da'],
      shared_members: [],
      cell_phone: '+17599440283',
      country: 'US',
      tags: ['warm', 'openhouse', 'topproducer'],
      _id: '5ea3c0056225871364c6a29c',
      tag: [],
      first_name: 'Clay',
      address: '442 W Elm St',
      city: 'San Jose',
      state: '',
      zip: '95111',
      label: '5f16d58d0af09220208b6e0e',
      brokerage: "Sotheby's International",
      source: 'Did deal together',
      created_at: '2020-04-25T04:43:49.831Z',
      updated_at: '2020-11-18T03:22:42.320Z',
      __v: 0,
      last_activity: {
        send_type: 0,
        _id: '5ea3c0066225871364c6a334',
        content: 'added note',
        contacts: '5ea3c0056225871364c6a29c',
        user: '5e9a0285efb6b2a3449245da',
        type: 'notes',
        notes: '5ea3c0066225871364c6a2ee',
        created_at: '2020-04-25T04:43:50.364Z',
        updated_at: '2020-04-25T04:43:50.364Z',
        __v: 0
      }
    },
    {
      last_name: 'Murphy ',
      email: 'clay.murphyyy@gmail.com',
      user: ['5e9a0285efb6b2a3449245da'],
      shared_members: [],
      cell_phone: '+17599440283',
      country: 'US',
      tags: ['warm', 'openhouse', 'topproducer'],
      _id: '5ea3c0056225871364c6a29c',
      tag: [],
      first_name: 'Clay',
      address: '442 W Elm St',
      city: 'San Jose',
      state: '',
      zip: '95111',
      label: '5f16d58d0af09220208b6e0e',
      brokerage: "Sotheby's International",
      source: 'Did deal together',
      created_at: '2020-04-25T04:43:49.831Z',
      updated_at: '2020-11-18T03:22:42.320Z',
      __v: 0,
      last_activity: {
        send_type: 0,
        _id: '5ea3c0066225871364c6a334',
        content: 'added note',
        contacts: '5ea3c0056225871364c6a29c',
        user: '5e9a0285efb6b2a3449245da',
        type: 'notes',
        notes: '5ea3c0066225871364c6a2ee',
        created_at: '2020-04-25T04:43:50.364Z',
        updated_at: '2020-04-25T04:43:50.364Z',
        __v: 0
      }
    },
    {
      last_name: 'Morgan',
      email: 'cora.morgan@gmail.com',
      user: ['5e9a0285efb6b2a3449245da'],
      shared_members: [],
      cell_phone: '+15835860947',
      country: 'US',
      tags: ['watchedvideos', 'expcon', 'cold'],
      _id: '5ea3c0056225871364c6a28a',
      tag: [],
      first_name: 'Cora',
      address: '442 W Elm St',
      city: 'San Antonio',
      state: '',
      zip: '78204',
      label: '5f16d58d0af09220208b6e0a',
      brokerage: 'Realty One Group ',
      source: 'met on vacation',
      created_at: '2020-04-25T04:43:49.158Z',
      updated_at: '2020-11-18T03:22:42.320Z',
      __v: 0,
      last_activity: {
        send_type: 0,
        _id: '5ef22e7e8e2e8201ad8d5772',
        content: 'added follow up',
        contacts: '5ea3c0056225871364c6a28a',
        user: '5e9a0285efb6b2a3449245da',
        type: 'follow_ups',
        follow_ups: '5ef22e7e8e2e8201ad8d5761',
        created_at: '2020-06-23T16:31:58.809Z',
        updated_at: '2020-06-23T16:31:58.809Z',
        __v: 0
      }
    },
    {
      last_name: 'Mallory',
      email: 'ed.mallory@telcentris.com',
      user: ['5e9a0285efb6b2a3449245da'],
      shared_members: [],
      cell_phone: '+18584424039',
      country: 'US',
      tags: ['unsubscribed'],
      _id: '5fac7f9defb7843b33ed1afc',
      first_name: 'Ed',
      recruiting_stage: 'Initial Contact Made',
      label: '5fac7f86efb7843b33ed1af8',
      created_at: '2020-11-12T00:19:41.093Z',
      updated_at: '2020-11-18T03:22:42.320Z',
      __v: 0,
      last_activity: {
        send_type: 0,
        _id: '5fac805aefb7843b33ed1b05',
        content: 'unsubscribed sms',
        contacts: '5fac7f9defb7843b33ed1afc',
        user: '5e9a0285efb6b2a3449245da',
        type: 'sms_trackers',
        created_at: '2020-11-12T00:22:50.069Z',
        updated_at: '2020-11-12T00:22:50.069Z',
        __v: 0
      }
    }
  ];
  constructor(private labelService: LabelService) {}

  ngOnInit(): void {
    this.getLabels();
  }

  beforeWeek(): void {
    this.selectedWeekly--;
  }

  nextWeek(): void {
    this.selectedWeekly++;
  }

  beforeMonth(): void {
    this.selectedMonthly--;
  }

  nextMonth(): void {
    this.selectedMonthly++;
  }

  changeExpanded(): void {
    this.topExpanded = !this.topExpanded;
  }

  getAvatarName(contact): any {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name && !contact.last_name) {
      return contact.first_name[0];
    } else if (!contact.first_name && contact.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }

  getLabels(): any {
    // this.isLoading = true;
    this.labelService.getLabels().subscribe(async (res: any) => {
      this.labels = res.sort((a, b) => {
        return a.priority - b.priority;
      });
    });
  }
  getLabelById(id): any {
    let retVal = { color: 'white', font_color: 'black' };
    let i;
    for (i = 0; i < this.labels.length; i++) {
      if (this.labels[i]._id === id) {
        retVal = this.labels[i];
      }
    }
    return retVal;
  }
}
