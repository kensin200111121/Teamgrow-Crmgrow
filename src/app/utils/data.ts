import { USER_FEATURES } from '@app/constants/feature.constants';

export const contactTableFields = [
  {
    value: 'first_name',
    label: 'First Name'
  },
  {
    value: 'last_name',
    label: 'Last Name'
  },
  {
    value: 'email',
    label: 'Primary Email'
  },
  {
    value: 'cell_phone',
    label: 'Primary Phone'
  },
  {
    value: 'secondary_email',
    label: 'Secondary Email'
  },
  {
    value: 'secondary_phone',
    label: 'Secondary Phone'
  },
  {
    value: 'brokerage',
    label: 'Company'
  },
  {
    value: 'website',
    label: 'Website'
  },
  {
    value: 'address',
    label: 'Address'
  },
  {
    value: 'country',
    label: 'Country'
  },
  {
    value: 'state',
    label: 'State'
  },
  {
    value: 'city',
    label: 'City'
  },
  {
    value: 'zip',
    label: 'Zipcode'
  },
  {
    value: 'tags',
    label: 'Tags'
  },
  {
    value: 'source',
    label: 'Source'
  },
  {
    value: 'status',
    label: 'Status'
  },
  {
    value: 'notes',
    label: 'Notes'
  },
  {
    value: 'deal',
    label: 'Pipeline',
    feature: USER_FEATURES.DEAL
  },
  {
    value: 'birthday',
    label: 'Birthday'
  }
];

export const contactMergeFields = [
  {
    value: 'first_name',
    label: 'First Name'
  },
  {
    value: 'last_name',
    label: 'Last Name'
  },
  {
    value: 'email',
    label: 'Primary Email'
  },
  {
    value: 'cell_phone',
    label: 'Primary Phone'
  },
  {
    value: 'secondary_email',
    label: 'Secondary Email'
  },
  {
    value: 'secondary_phone',
    label: 'Secondary Phone'
  },
  {
    value: 'brokerage',
    label: 'Company'
  },
  {
    value: 'website',
    label: 'Website'
  },
  {
    value: 'address',
    label: 'Address'
  },
  {
    value: 'country',
    label: 'Country'
  },
  {
    value: 'state',
    label: 'State'
  },
  {
    value: 'city',
    label: 'City'
  },
  {
    value: 'zip',
    label: 'Zipcode'
  },
  {
    value: 'tags',
    label: 'Tags'
  },
  {
    value: 'source',
    label: 'Source'
  },
  {
    value: 'staus',
    label: 'Status'
  },
  {
    value: 'birthday',
    label: 'Birthday'
  },
  {
    value: 'additional_field',
    label: 'Additional Field'
  }
];

export const contactSingleMergeFields = [
  {
    value: 'first_name',
    label: 'First Name'
  },
  {
    value: 'last_name',
    label: 'Last Name'
  },
  {
    value: 'status',
    label: 'Status'
  },
  {
    value: 'address',
    label: 'Address'
  },
  {
    value: 'website',
    label: 'Website'
  },
  {
    value: 'country',
    label: 'Country'
  },
  {
    value: 'city',
    label: 'City'
  },
  {
    value: 'state',
    label: 'State'
  },
  {
    value: 'zip',
    label: 'Zipcode'
  },
  {
    value: 'brokerage',
    label: 'Company'
  },
  {
    value: 'source',
    label: 'Source'
  },
  {
    value: 'tags',
    label: 'Tags'
  }
];

export const contactTablePropertiseMap = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Primary Email',
  cell_phone: 'Primary Phone',
  secondary_email: 'Secondary Email',
  secondary_phone: 'Secondary Phone',
  brokerage: 'Company',
  website: 'Website',
  address: 'Address',
  country: 'Country',
  state: 'State',
  birthday: 'Birthday',
  city: 'City',
  zip: 'Zipcode',
  tags: 'Tags',
  source: 'Source',
  status: 'Status',
  notes: 'Notes',
  deal: 'Pipeline',
  automation_id: 'Automation',
  emails: 'Emails',
  phones: 'Phones'
};
export const contactTableMainFields = [
  'first_name',
  'last_name',
  'email',
  'cell_phone',
  'secondary_email',
  'secondary_phone'
];

export const contactTableMandatoryFields = [
  'first_name',
  'last_name',
  'email',
  'cell_phone'
];

export const DATE_FORMATS = [
  'MM-DD-YYYY',
  'DD-MM-YYYY',
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY/MM/DD'
];
export const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Date', value: 'date' },
  { label: 'Link', value: 'link' },
  { label: 'Dropdown', value: 'dropdown' }
];

export const FIELDS_OPERATES = {
  number: [
    { label: 'equal', value: '=' },
    { label: 'is bigger than', value: '>=' },
    { label: 'is less than', value: '<=' }
  ],
  date: [
    { label: 'equal', value: '=' },
    { label: 'is bigger than', value: '>=' },
    { label: 'is less than', value: '<=' }
  ],
  text: [
    { label: 'equal', value: '=' },
    { label: 'include', value: 'include' }
  ],
  link: [
    { label: 'equal', value: '=' },
    { label: 'include', value: 'include' }
  ],
  phone: [
    { label: 'equal', value: '=' },
    { label: 'include', value: 'include' }
  ],
  email: [
    { label: 'equal', value: '=' },
    { label: 'include', value: 'include' }
  ],
  dropdown: [
    { label: 'equal', value: '=' },
    { label: 'include', value: 'include' }
  ]
};
