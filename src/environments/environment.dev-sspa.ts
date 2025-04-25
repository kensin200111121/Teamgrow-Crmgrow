export const environment = {
  isSspa: true,
  production: false,
  // api: 'https://stg-api.crmgrow.com/app/',
  // automation_api: 'https://dev-automation.crmgrow.com/app/',
  // server: 'https://dev-api.crmgrow.com',
  // front: 'https://dev-app.crmgrow.com',
  // website: 'https://dev-material.crmgrow.com',
  api: 'http://localhost:3000/app/',
  // api: 'https://dev-api.crmgrow.com/app/',
  automation_api: 'http://localhost:3003/app/',
  // automation_api: 'https://dev-automation.crmgrow.com/app/',
  // api: 'https://dev-api.crmgrow.com/api/',
  //server: 'https://stg-api.crmgrow.com',
  server: 'http://localhost:3000',
  //server: 'https://dev-api.crmgrow.com',
  front: 'http://localhost:4200',
  // website: 'https://stg-api.crmgrow.com',
  website: 'http://localhost:3003',
  domain: {
    base: 'gst.dev',
    server: 'api.crmgrow.com',
    frontend: 'dev-app.crmgrow.com',
    scheduler: 'scheduler1.crmgrow.com'
  },
  pageBuilder: 'https://pages.vortexstage.gst.dev',
  pageBuilderAPI: 'https://production.builder.convrrt.com',
  ClientId: {
    Google:
      '630484366982-m6e66b06vlo0g6ebg9h2q5t7nrk2rimr.apps.googleusercontent.com',
    Outlook: '495c34a1-c12c-4932-b134-7f3c3ec491d6'
  },
  RedirectUri: {
    Outlook: 'http://localhost:4200/login'
  },
  API_KEY: {
    Youtube: 'AIzaSyBSFbYGvju9pcvRgB1-skml8uocN71z4HI',
    RECAPTCHA_SITE_KEY: '6Ld7A3sqAAAAAGtkiZLRm_F5aM9blg5MgTIGB7Xn',
    Notification:
      'BE_FojfPS_0FbZGafCaHBpaZldJ91dkeXA6zGtQiM3R4A0oNOW76ejjEA2bRqAomwbIqGbCDsEjK_1VyCX_496o',
    Vimeo:
      'YWUxOTM0NGQwNzUwMWU2MTRkMDhkNjJhODYxNmJlMjRlNGYxYTkxOTpnK0FZWnk2OWsyOU90WFUzMHdYQ3lpSnFGYnNRQk1Gd0p5b0hQZ1NmaDV1aUYwVlNvTjBSZDhWYnV1cEREZzhwR3ZDMThkWWo3UE1zb29JdVNIY0lFcnNQZzNTU3g5am52dnRkRjBMNlFES1o3cFFDVENsVEkzZm45MlBTQUVvdA=='
  },
  THIRD_PARTY: {
    GTM_ID: 'GTM-W55F6VL'
  },
  STRIPE_KEY:
    'pk_test_51MdrEqDzvdh5jXRdJ6wFIfrn2Y9KZNj0unUSq0cMosOsUvDMg0G4V5IMwfOq9gWD0tfaAffLtMkDirqxZBomGPQE0019vAFJqQ',
  DESKTOP_APP_LINK: {
    WIN: 'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/crmrecorder+Setup+0.1.4.exe',
    MAC: 'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/crmrecorder-0.1.4.dmg'
  },
  VORTEX_BASE: 'https://vortexstage3.gst.dev/',
  VORTEX_IDENTITY_BASE: 'https://stage.identity-server.k8sd.gst.dev/api/',
  Vortex_Scheduler: 'scheduler1.crmgrow.com',
  AGENTFIRE:
    'https://andrey.thesparksite.com/wp-admin/admin.php?page=external-service',
  SENTRY_DSN: '',
  envMode: 'dev' // 'dev', 'stage', 'prod'
};
