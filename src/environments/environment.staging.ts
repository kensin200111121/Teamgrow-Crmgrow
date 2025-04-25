export const environment = {
  isSspa: false,
  production: false,
  api: 'https://stg-api.crmgrow.com/app/',
  automation_api: 'https://stg-automation.crmgrow.com/app/',
  server: 'https://stg-api.crmgrow.com',
  website: 'https://stg-material.crmgrow.com',
  front: 'https://stg-app.crmgrow.com',
  domain: {
    base: 'crmgrow.com',
    server: 'stg-api.crmgrow.com',
    frontend: 'stg-app.crmgrow.com',
    scheduler: 'stg-scheduler.crmgrow.com'
  },
  pageBuilder: 'https://stg-pages.crmgrow.com',
  pageBuilderAPI: 'https://production.builder.convrrt.com',
  ClientId: {
    Google:
      '707307636892-f48ctg0ods8k340j416ksh0b0esm312v.apps.googleusercontent.com',
    Outlook: 'cf34076b-4bb2-4eef-8fdb-a7d7f2376095'
  },
  RedirectUri: {
    Outlook: 'https://stg-app.crmgrow.com/login'
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
  VORTEX_BASE: 'https://vortexstage.gst.dev/',
  VORTEX_IDENTITY_BASE: 'https://stage.identity-server.k8sd.gst.dev/api/',
  Vortex_Scheduler: 'scheduler.theredx.com',
  AGENTFIRE:
    'https://andrey.thesparksite.com/wp-admin/admin.php?page=external-service',
  SENTRY_DSN:
    'https://ea53c7fc6c8a442eb0f3a260be98852c@o4504722907791360.ingest.sentry.io/4505587401490432',
  envMode: 'stage' // 'dev', 'stage', 'prod'
};
