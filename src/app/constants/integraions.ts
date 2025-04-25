export const PROFILE_INTEGRAIONS = [
  {
    id: 'gmail',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '/assets/img/onboarding/image 2.jpg',
    type: 'Email',
    title: 'Google Mail',
    icon: 'img/google_email.png',
    description: 'integration_gmail_desc',
    isConnected: false,
    popular: true,
    authorizedInfo: [],
    aliasList: [],
    guide: []
  },
  {
    id: 'outlook',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Email',
    title: 'Microsoft 365 Mail',
    icon: 'img/365_mail.png',
    description: 'integration_outlook_desc',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    aliasList: [],
    guide: []
  },
  {
    id: 'smtp_mail',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Email',
    title: 'SMTP Mail',
    icon: 'img/smtp.png',
    description: 'integration_smtp_desc',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    aliasList: [],
    guide: []
  },
  {
    id: 'google_calendar',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Calendar',
    title: 'Google Calendar',
    icon: 'img/google_calendar.svg',
    description: 'integration_google_calendar',
    isConnected: false,
    popular: true,
    authorizedInfo: [],
    isMultiple: true,
    guide: []
  },
  {
    id: 'outlook_calendar',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Calendar',
    title: 'Outlook Calendar',
    icon: 'img/outlook_calendar.svg',
    description: 'integration_outlook_calendar',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    isMultiple: true,
    guide: []
  },
  {
    id: 'dialer',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Dialer',
    icon: 'img/dialer.svg',
    description: 'integration_dialer',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    disableDisconnect: true,
    guide: []
  }
];

export const GARBAGE_INTEGRAIONS = [
  {
    id: 'zapier',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Zapier',
    icon: 'img/zapier.svg',
    description: 'integration_zapier',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    disableDisconnect: true,
    guide: [
      'Please generate the api key in this dialog.',
      'Login your Zapier account.',
      'Please create try to create new Zap.',
      'When you select the Zap Tigger and Zap Action, you can select the crmgrow and put the above api key.',
      'Whenever you create new Zap, you can continue the above process.'
    ]
  },
  {
    id: 'agent_fire',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Agent Fire',
    icon: 'img/agentfire.png',
    description: 'integration_agentfire',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    disableDisconnect: true,
    guide: [
      'Please generate the api key in this dialog',
      'Go & Login your agentfire account by clicking "Open target" button',
      'By clicking hamburgur menu and go to Lead Manager/Connect a CRM page',
      'Please click add button here. When you add new CRM, you can select the CRMGrow.',
      'And then you can paste the api key that is generated step 1 here.'
    ]
  },
  {
    id: 'calendly',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Calendly',
    icon: 'img/calendly.svg',
    description: 'integration_calendly',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    guide: [
      'Go and Login your personal calendly account',
      'You can find the Integrations & apps in sidebar. Please click it to visit the Integrations page',
      'You can see the Personal Access Token section/card. Here, you can create new token.',
      'You need to copy this token and paste it into the above input box in this dialog',
      'Finally, Please click the "confirm" button. If information is correct, it will be connected successfully.'
    ]
  },
  {
    id: 'zoom',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Zoom',
    icon: 'img/zoom.svg',
    description: 'integration_zoom',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    guide: [
      'Please generate the api key from CRMGrow in this dialog',
      'And then open the zapier template that you are going to use for your business from above list',
      'You can see the Connect CRMGrow button in the CRMGrow action. By clicking this, open the sign in popup.',
      'Please paste the generated api key in step 1 to the api key input in this popup',
      'Finally, please click done and test your integration.'
    ]
  },
  {
    id: 'download_crmgrow',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Download crmgrow',
    icon: 'img/download_crmgrow.svg',
    description:
      'Create HD recordings using your camera, screen, or a combination of camera and screen. This gives you the freedom to record and create content anywhere and stored within your crmgrow account.',
    button: 'Download',
    hasSpecial: 'download',
    popular: false,
    authorizedInfo: [],
    guide: []
  },
  {
    id: 'chrome_extension',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Chrome Extension',
    icon: 'img/chrome_extension.svg',
    description: 'integration_extension',
    button: 'Install',
    hasSpecial: 'install',
    popular: false,
    authorizedInfo: [],
    guide: []
  }
];
export const GARBAGE_INTEGRATIONS = [
  {
    id: 'zapier',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Zapier',
    icon: 'img/zapier.svg',
    description: 'integration_zapier',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    disableDisconnect: true,
    guide: [
      'Please generate the api key in this dialog.',
      'Login your Zapier account.',
      'Please create try to create new Zap.',
      'When you select the Zap Tigger and Zap Action, you can select the crmgrow and put the above api key.',
      'Whenever you create new Zap, you can continue the above process.'
    ]
  },
  {
    id: 'agent_fire',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Agent Fire',
    icon: 'img/agentfire.png',
    description: 'integration_agentfire',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    disableDisconnect: true,
    guide: [
      'Please generate the api key in this dialog',
      'Go & Login your agentfire account by clicking "Open target" button',
      'By clicking hamburgur menu and go to Lead Manager/Connect a CRM page',
      'Please click add button here. When you add new CRM, you can select the CRMGrow.',
      'And then you can paste the api key that is generated step 1 here.'
    ]
  },
  {
    id: 'calendly',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Calendly',
    icon: 'img/calendly.svg',
    description: 'integration_calendly',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    guide: [
      'Go and Login your personal calendly account',
      'You can find the Integrations & apps in sidebar. Please click it to visit the Integrations page',
      'You can see the Personal Access Token section/card. Here, you can create new token.',
      'You need to copy this token and paste it into the above input box in this dialog',
      'Finally, Please click the "confirm" button. If information is correct, it will be connected successfully.'
    ]
  },
  {
    id: 'zoom',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Zoom',
    icon: 'img/zoom.svg',
    description: 'integration_zoom',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    guide: [
      'Please generate the api key from CRMGrow in this dialog',
      'And then open the zapier template that you are going to use for your business from above list',
      'You can see the Connect CRMGrow button in the CRMGrow action. By clicking this, open the sign in popup.',
      'Please paste the generated api key in step 1 to the api key input in this popup',
      'Finally, please click done and test your integration.'
    ]
  },
  {
    id: 'download_crmgrow',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Download crmgrow',
    icon: 'img/download_crmgrow.svg',
    description:
      'Create HD recordings using your camera, screen, or a combination of camera and screen. This gives you the freedom to record and create content anywhere and stored within your crmgrow account.',
    button: 'Download',
    hasSpecial: 'download',
    popular: false,
    authorizedInfo: [],
    guide: []
  },
  {
    id: 'chrome_extension',
    summary: '',
    video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
    image: '',
    type: 'Tools',
    title: 'Chrome Extension',
    icon: 'img/chrome_extension.svg',
    description: 'integration_extension',
    button: 'Install',
    hasSpecial: 'install',
    popular: false,
    authorizedInfo: [],
    guide: []
  }
];

export const PROFILE_INTEGRATIONS = [
  {
    id: 'gmail',
    type: 'email',
    isConnected: false,
    popular: true,
    authorizedInfo: [],
    aliasList: [],
    guide: []
  },
  {
    id: 'outlook',
    type: 'email',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    aliasList: []
  },
  {
    id: 'smtp_mail',
    type: 'email',
    description: 'integration_smtp_desc',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    aliasList: [],
    guide: []
  },
  {
    id: 'google_calendar',
    summary: '',
    type: 'calendar',
    isConnected: false,
    popular: true,
    authorizedInfo: [],
    isMultiple: true,
    guide: []
  },
  {
    id: 'outlook_calendar',
    type: 'calendar',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    guide: []
  },
  {
    id: 'dialer',
    type: 'dialer',
    isConnected: false,
    popular: false,
    authorizedInfo: [],
    guide: []
  }
];
