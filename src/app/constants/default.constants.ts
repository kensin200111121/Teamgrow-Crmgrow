// import {  } from '@utils/data.types';

import {
  ActivityAnalyticsReqOption,
  AutomationAnalyticsReq,
  FieldAnalyticsData,
  RateAnalyticsReq
} from '@utils/data.types';

export const AnalyticsSearchOptions: (
  | FieldAnalyticsData
  | ActivityAnalyticsReqOption
  | AutomationAnalyticsReq
  | RateAnalyticsReq
)[] = [
  {
    id: 'missing_email',
    and: true,
    fields: [
      {
        name: 'email',
        exist: false
      },
      {
        name: 'cell_phone',
        exist: true
      }
    ]
  },
  {
    id: 'missing_phone',
    and: true,
    fields: [
      {
        name: 'cell_phone',
        exist: false
      },
      {
        name: 'email',
        exist: true
      }
    ]
  },
  {
    id: 'missing_email_phone',
    and: true,
    fields: [
      {
        name: 'email',
        exist: false
      },
      {
        name: 'cell_phone',
        exist: false
      }
    ]
  },
  {
    activities: ['emails', 'texts'],
    id: 'recent_communicated',
    range: 30
  },
  {
    activities: ['video_trackers'],
    id: 'recent_video_tracked',
    range: 30
  },
  {
    id: 'on_automation',
    range: 30
  },
  {
    id: 'recent_off_automation',
    range: 30
  },
  {
    id: 'never_automated',
    range: 30
  },
  {
    id: 'one_star',
    count: 1
  },
  {
    id: 'two_star',
    count: 2
  },
  {
    id: 'three_star',
    count: 3
  },
  {
    id: 'four_star',
    count: 4
  },
  {
    id: 'five_star',
    count: 5
  },
  {
    id: 'zero_star',
    count: 0
  }
];

export const AnalyticsSearchOptionCategories = {
  missing_email: 'Contact health',
  missing_phone: 'Contact health',
  missing_email_phone: 'Contact health',
  recent_communicated: 'Communication',
  recent_video_tracked: 'Communication',
  on_automation: 'Automation',
  recent_off_automation: 'Automation',
  never_automated: 'Automation',
  one_star: 'Rating',
  two_star: 'Rating',
  three_star: 'Rating',
  four_star: 'Rating',
  five_star: 'Rating',
  zero_star: 'Rating'
};
