import { Component, OnInit } from '@angular/core';
import { UserService } from '@services/user.service';
import { ContactService } from '@services/contact.service';

const DEFAULT_OPTIONS = [
  {
    id: 'has_email',
    type: 'field',
    value: {
      and: true,
      fields: [{ name: 'email', exist: true }]
    }
  },
  {
    id: 'has_phone',
    type: 'field',
    value: {
      and: true,
      fields: [{ name: 'cell_phone', exist: true }]
    }
  },
  {
    id: 'has_communicated',
    type: 'activity',
    value: {
      types: ['emails', 'texts'],
      range: 30
    }
  },
  {
    id: 'has_on_automation',
    type: 'automation',
    value: {
      type: 'current',
      range: 30
    }
  }
];

@Component({
  selector: 'app-rates-setting',
  templateUrl: './rates-setting.component.html',
  styleUrls: ['./rates-setting.component.scss']
})
export class RatesSettingComponent implements OnInit {
  rateIndexes: string[] = ['2nd', '3rd', '4th', '5th'];
  optionList = [
    {
      id: 'has_email',
      type: 'field',
      value: {
        and: true,
        fields: [{ name: 'email', exist: true }]
      }
    },
    {
      id: 'has_phone',
      type: 'field',
      value: {
        and: true,
        fields: [{ name: 'cell_phone', exist: true }]
      }
    },
    {
      id: 'has_communicated',
      type: 'activity',
      value: {
        types: ['emails', 'texts'],
        range: 30
      }
    },
    {
      id: 'has_video_tracked',
      type: 'activity',
      value: {
        types: ['video_trackers'],
        range: 30
      }
    },
    {
      id: 'has_recent_off_automation',
      type: 'automation',
      value: {
        type: 'current_recent',
        range: 30
      }
    },
    {
      id: 'has_on_automation',
      type: 'automation',
      value: {
        type: 'current',
        range: 30
      }
    }
  ];

  options: any[] = DEFAULT_OPTIONS;
  saving = false;

  constructor(
    private userService: UserService,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.userService.garbage$.subscribe((garbage) => {
      if (garbage?._id && garbage?.rate_options?.length) {
        this.options = garbage.rate_options;
      }
    });
  }

  saveOptions(): void {
    this.saving = true;
    this.userService
      .updateGarbage({
        rate_options: this.options
      })
      .subscribe(() => {
        this.contactService.calculateRates().subscribe(() => {
          this.saving = false;
        });
      });
  }
}
