export const AUTH = {
  SIGNIN: 'user/login',
  SIGNUP: 'user',
  FORGOT_PASSWORD: 'user/forgot-password',
  RESET_PASSWORD: 'user/reset-password',
  SOCIAL_SIGNIN: 'user/social-login',
  SOCIAL_SIGNUP: 'user/social-signup',
  OAUTH_REQUEST: 'user/signup-',
  OUTLOOK_PROFILE_REQUEST: 'user/social-outlook?code=',
  GOOGLE_PROFILE_REQUEST: 'user/social-gmail?code=',
  LOG_OUT: 'user/logout',
  CHECK_EMAIL: 'user/check',
  CHECK_NICKNAME: 'user/search-nickname',
  CHECK_PHONE: 'user/search-phone',
  EXTENSIONUPGRADE: 'user/extension-upgrade-web'
};
export const USER = {
  PROFILE: 'user/me',
  SAVE_ACCESS: 'user/access',
  WAVV_ID: 'user/wavv_id',
  EMAIL_ALIAS: 'user/email-alias',
  CREATE_ALIAS: 'user/create-alias',
  REQUEST_ALIAS_VERIFY: 'user/request-alias-verify',
  VERIFY_ALIAS: 'user/verify-alias',
  REMOVE_ALIAS: 'user/remove-alias',
  EDIT_ALIAS: 'user/edit-alias',
  PAYMENT: 'payment/',
  UPDATE_PROFILE: 'user/me',
  UPDATE_WAVV_NUMBER: 'user/wavv-number',
  UPDATE_PAYMENT: 'payment/',
  CANCEL_PAYMENT: 'payment/cancel',
  PROCEED_INVOICE: 'payment/proceed-invoice',
  RESUME_ACCOUNT: 'user/resume',
  RENEW_ACCOUNT: 'user/renew',
  CARDS: 'payment/cards',
  ADD_CARD: 'payment/add-card',
  SET_PRIMARY_CARD: 'payment/set-primary-card',
  GET_PRIMARY_CARD: 'payment/get-primary-card',
  DELETE_CARD: 'payment/delete-card',
  UPDATE_CARD: 'payment/update-card',
  GET_INVOICE: 'payment/transactions',
  UPDATE_PASSWORD: 'user/new-password',
  CREATE_PASSWORD: 'user/create-password',
  SYNC_GMAIL: 'user/sync-gmail',
  SYNC_OUTLOOK: 'user/sync-outlook',
  SYNC_ZOOM: 'user/sync-zoom/',
  CALENDAR_SYNC_GMAIL: 'user/sync-google-calendar',
  CALENDAR_SYNC_OUTLOOK: 'user/sync-outlook-calendar',
  AUTH_GOOGLE: 'user/authorize-gmail',
  AUTH_OUTLOOK: 'user/authorize-outlook',
  AUTH_GOOGLE_CALENDAR: 'user/authorize-google-calendar',
  AUTH_OUTLOOK_CALENDAR: 'user/authorize-outlook-calendar',
  AUTH_ZOOM: 'user/authorize-zoom',
  SET_ANOTHER_MAIL: 'user/another-con',
  ENABLE_DESKTOP_NOTIFICATION: 'user/desktop-notification',
  LOAD_AFFILIATE: 'affiliate',
  CREATE_AFFILIATE: 'affiliate',
  LOAD_REFERRALS: 'affiliate/referrals/',
  UPDATE_GARBAGE: 'garbage',
  CONNECT_SMTP: 'integration/connect-smtp',
  VERIFY_SMTP: 'integration/verify-smtp',
  VERIFY_SMTP_CODE: 'integration/verify-smtp-code',
  DISCONNECT_MAIL: 'user/discon-email',
  DISCONNECT_CALENDAR: 'user/discon-calendar',
  CANCEL_ACCOUNT: 'user/cancel-account',
  SLEEP_ACCOUNT: 'user/sleep-account',
  UPDATE_PACKAGE: 'user/update-package',
  CHECK_DOWNGRADE: 'user/check-downgrade',
  INFO: 'user/',
  LOAD_SUB_ACCOUNTS: 'user/easy-sub-accounts',
  GET_SUB_ACCOUNT: 'user/sub-accounts',
  SUB_ACCOUNT: 'user/sub-account/',
  CHANGE_SUB_ACCOUNT: 'user/switch-account',
  RECALL_SUB_ACCOUNT: 'user/recall-account',
  MERGE_SUB_ACCOUNT: 'user/merge-account',
  //BUY_SUB_ACCOUNT: 'user/buy-account',  that is for old logic , it should be deleted later.
  NEW_SUB_ACCOUNT: 'user/new-account',
  UPDATE_DRAFT: 'user/update-draft',
  SCHEDULE: 'user/schedule-demo',
  SCHEDULED_ONE: 'user/scheduled-demo',
  STATISTICS: 'user/statistics',
  SYNC_SMTP: 'user/sync-smtp',
  AUTHORIZE_SMTP: 'user/authorize-smtp',
  AUTHORIZE_SMTP_CODE: 'user/authorize-smtp-code',
  BULK_REMOVE_TOKEN: 'garbage/bulk-remove-token',
  ADD_NICK_NAME: 'user/add-nick',
  SYNC_GOOGLE_CONTACT: 'user/sync-google-contact',
  AUTH_GOOGLE_CONTACT: 'user/auth-google-contact',
  ADD_PAYMENT_SUB_ACCOUNT: 'user/add-payment-sub-account',
  UPDATE_MY_LINK: 'user/update-my-link',
  REPORT: 'user/reports',
  LOAD_TEAM_INFO: 'user/team-info',
  VERIFY_CONNECTION_STATUS: 'user/verify-connection-status',
};
export const GUEST = {
  LOAD: 'guest/load',
  CREATE: 'guest',
  DELETE: 'guest/',
  EDIT: 'guest/'
};
export const GARBAGE = {
  SET: 'garbage',
  UPLOAD_INTRO_VIDEO: 'garbage/intro_video',
  LOAD_DEFAULT: 'garbage/load-default',
  SMART_CODES: 'garbage/smart-codes',
  PERMISSION_SETTINGS: 'garbage/team-settings'
};
export const FILE = {
  UPLOAD_IMAGE: 'file/upload?resize=true'
};
export const NOTE = {
  CREATE: 'note/v2/create',
  BULK_CREATE: 'note/v2/bulk-create',
  DELETE: 'note/',
  UPDATE: 'note/v2/'
};
export const TASK = {
  CREATE: 'follow/',
  BULK_CREATE: 'follow/create',
  UPDATE: 'follow/',
  COMPLETE: 'follow/completed',
  UNCOMPLETE: 'follow/uncompleted',
  LEAVE_COMMENT: 'follow/leave-comment',
  BULK_UPDATE: 'follow/update',
  BULK_COMPLETE: 'follow/checked',
  BULK_ARCHIVE: 'follow/archived',
  TODAY: 'follow/date?due_date=today',
  TOMORROW: 'follow/date?due_date=tomorrow',
  NEXT_WEEK: 'follow/date?due_date=next_week',
  FUTURE: 'follow/date?due_date=future',
  OVERDUE: 'follow/date?due_date=overdue',
  LOAD: 'follow/load/',
  SELECT: 'follow/select-all',
  GET_AUTOLIST: 'follow/get-autolist'
};
export const ACTIVITY = {
  CREATE: 'activity',
  LOAD: 'activity/get',
  // LOAD: 'activity/',
  REMOVE_ALL: 'activity/remove-all',
  REMOVE: 'activity/remove',
  UPDATE: 'activity/update'
};
export const CONTACT = {
  CREATE: 'contact',
  LOAD_ALL: 'contact',
  LOAD_PAGE: 'contact/last/',
  LOAD_PAGE_WITH_TYPE: 'contact/load-contacts/',
  GET_CONTACTS_COUNT: 'contact/get-contacts-count/',

  LOAD_PENDING_CONTACTS: 'contact/pending-contacts',
  ADVANCE_SERACH: 'contact/advance-search',
  PENDING_CONTACT_ADVANCE_SERACH: 'contact/pending-advance-search',
  ADVANCE_SELECT: 'contact/advance-search/select',
  SEARCH_BY_CUSTOM: 'contact/search-by-custom',
  NORMAL_SEARCH: 'contact/search',
  QUICK_SEARCH: 'contact/search-easy',
  LOAD_BY_EMAIL: 'contact/load-by-emails',
  FIELD_COUNT: 'contact/field-count',
  SELECT_ALL: 'contact/get-all',
  LOAD_BY_IDS: 'contact/get',
  FILTER: 'contact/filter',
  UPDATE_DETAIL: 'contact/',
  READ: 'contact/get-detail/',
  READ_ACTIVITIES: 'contact/get-activities/',
  EXPORT: 'contact/export-csv',
  BULK_DELETE: 'contact/remove',
  BULK_UPDATE: 'contact/bulk-update',
  LATEST_CONTACTS: 'video/latest-sent',
  UPDATE: 'contact/update-contact',
  MERGE: 'contact/contact-merge',
  BULK_CREATE: 'contact/bulk-create',
  CHECK_EMAIL: 'contact/check-email',
  CHECK_PHONE: 'contact/check-phone',
  SHARE_CONTACT: 'contact/share-contact',
  STOP_SHARE: 'contact/stop-share',
  LOAD_NOTES: 'contact/load-notes/',
  LOAD_TIMELINE: 'contact/get-timeline/',
  LOAD_TASKS: 'contact/get-tasks/',
  REMOVE_FROM_TASK: 'contact/remove-task',
  MERGE_ADDITIONAL_FIELDS: 'contact/merge-additional-fields',
  LOAD_ADDITIONAL_FIELDS_CONFLICT_CONTACTS_PAGINATION:
    'contact/load-additional-fields-conflict-contacts-pagination',
  UNLOCK: 'contact/unlock',
  GET_COUNT: 'contact/count',
  ASSIGN_BUCKET: 'contact/assign-bucket',

  /* New Contact Endpoint for refactoring */
  LOAD_GROUP_ACTIVITIES: 'contact/load-activities/',
  LOAD_LAST_GROUP_ACTIVITY: 'contact/load-last-activity/',

  LOAD_MORE_ACTIVITIES: 'contact/get-contact-activities/',
  LOAD_ACTIONS: 'contact/get-contact-actions/',
  GET_ACTION_TOTAL_COUNT: 'contact/get-total-count-contact-actions/',

  LOAD_CONTACT_ACTIVITY_DETAIL: 'contact/get-contact-activity-detail/',
  LOAD_PROPERTIES: 'contact/load-properties/',
  DETAIL: 'contact/detail/',
  SET_PRIMARY_EMAIL: 'contact/set-primary-email/',
  SET_PRIMARY_PHONE: 'contact/set-primary-phone/',
  SET_PRIMARY_ADDRESS: 'contact/set-primary-address/',
  ACCEPT_SHARING: 'contact/accept-sharing',
  DECLINE_SHARING: 'contact/decline-sharing',
  ACCEPT_MOVE: 'contact/move-accept',
  DECLINE_MOVE: 'contact/move-decline'
};
export const VIDEO = {
  CREATE: 'video/create',
  READ: 'video/',
  UPDATE: 'video/',
  DOWNLOAD: 'video/download/',
  UPDATE_VIDEO_DETAIL: 'video/detail/',
  UPDATE_CONVERTING: 'video/converting/',
  UPDATE_ADMIN: 'video/update-admin',
  DELETE: 'video/',
  LOAD: 'video',
  LOAD_CONVERTING_STATUS: 'video/convert-status',
  ANALYTICS: 'video/analytics/',
  INIT_RECORD: 'video/init-record?source=web',
  UPLOAD_CHUNK: 'video/upload-chunk/',
  COMPLETE_RECORD: 'video/complete-record',
  UPLOAD_CHUNK2: 'video/upload-split/',
  UPLOAD_SINGLE: 'video/upload-single/',
  MERGE_FILES: 'video/merge-chunks',
  EMBED_INFO: 'video/embed-info'
};
export const PDF = {
  CREATE: 'pdf/create',
  READ: 'pdf/',
  ANALYTICS: 'pdf/analytics/',
  UPDATE: 'pdf/',
  UPDATE_ADMIN: 'pdf/update-admin',
  DELETE: 'pdf/',
  LOAD: 'pdf'
};
export const IMAGE = {
  CREATE: 'image/create',
  READ: 'image/',
  ANALYTICS: 'image/analytics/',
  UPDATE: 'image/',
  UPDATE_ADMIN: 'image/update-admin',
  DELETE: 'image/',
  LOAD: 'image'
};
export const TEMPLATE = {
  CREATE: 'template/create',
  DOWNLOAD: 'template/createTemplate',
  READ: 'template/',
  UPDATE: 'template/',
  DELETE: 'template/',
  BULK_REMOVE: 'template/remove',
  LOAD: 'template/list/',
  SEARCH: 'template/search',
  OWNSEARCH: 'template/search-own',
  LOAD_OWN: 'template/load-own',
  LOAD_LIBRARY: 'template/load-library',
  LOAD_ALL: 'template/',
  MOVE_FILES: 'template/move',
  REMOVE_FOLDER: 'template/remove-folder',
  REMOVE_FOLDERS: 'template/remove-folders',
  DOWNLOAD_FOLDER: 'template/download-folder',
  BULK_DOWNLOAD: 'template/bulk-download'
};
export const TEAM = {
  LOAD: 'team/load',
  LOAD_LEADERS: 'team/load-leaders',
  LOAD_INVITED: 'team/load-invited',
  LOAD_REQUESTED: 'team/load-requested',
  CREATE: 'team',
  READ: 'team/',
  UPDATE: 'team/',
  DELETE: 'team/',
  SEARCH_TEAM: 'team/search-team',
  SEARCH_LEADER: 'team/search-leader',
  INVITE_USERS: 'team/bulk-invite/',
  CANCEL_INVITE: 'team/cancel-invite/',
  CANCEL_REQUEST: 'team/cancel-request/',
  SHARE_TEAM_MATERIALS: 'team/share-team-materials',
  SHARE_VIDEOS: 'team/share-videos',
  SHARE_PDFS: 'team/share-pdfs',
  SHARE_IMAGES: 'team/share-images',
  SHARE_MATERIALS: 'team/share-materials',
  SHARE_FOLDERS: 'team/share-folders',
  LOAD_SHARE_CONTACTS: 'team/shared-contacts',
  LOAD_SHARE_MATERIALS: 'team/material/',
  LOAD_SHARE_AUTOMATIONS: 'team/automation/',
  LOAD_SHARE_TEMPLATES: 'team/template/',
  SHARE_TEMPLATES: 'team/share-templates',
  SHARE_AUTOMATIONS: 'team/share-automations',
  ACCEPT_INVITATION: 'team/accept/',
  DECLINE_INVITATION: 'team/decline/',
  SEARCH_TEAM_BY_USER: 'team/user/',
  JOIN_REQUEST: 'team/request',
  ACCEPT_REQUEST: 'team/admin-accept',
  DECLINE_REQUEST: 'team/admin-decline',
  UPDATE_TEAM: 'team/update',
  REMOVE_VIDEO: 'team/remove-videos/',
  REMOVE_PDF: 'team/remove-pdfs/',
  REMOVE_IMAGE: 'team/remove-images/',
  REMOVE_FOLDER: 'team/remove-folder/',
  REMOVE_TEMPLATE: 'team/remove-templates/',
  REMOVE_AUTOMATION: 'team/remove-automations/',
  SEARCH_CONTACT: 'team/search-contact',
  ALL_SHARED_CONTACT: 'team/get-all/',
  REQUEST_CALL: 'team-call/request-call/',
  INQUIRY: 'team-call/nth-call/',
  CALL: 'team-call/call/',
  PLANNED: 'team-call/call-planned/',
  FINISHED: 'team-call/call-finished/',
  REJECT_CALL: 'team-call/reject-call/',
  ACCEPT_CALL: 'team-call/accept-call/',
  UPDATE_CALL: 'team-call/call/',
  DELETE_CALL: 'team-call/call/',
  TEAM_CALL_LOAD: 'team-call/load-call',
  UNSHARE_FOLDERS: 'team/unshare-folders',
  UNSHARE_TEMPLATES: 'team/unshare-templates',
  UNSHARE_AUTOMATIONS: 'team/unshare-automations',
  STOP_SHARE: 'team/stop-share',
  STOP_SHARES: 'team/stop-shares',
  LEAVE: 'team/leave/',
  removeMemberItems: 'team/removeMemberItems/',
  UNSHARE_MATERIALS: 'team/unshare-materials'
};
export const AUTOMATION = {
  SEARCH: 'automation/search',
  LOAD_PAGE: 'automation/list/',
  LOAD_ALL: 'automation/',
  CONTACTS: 'automation/assigned-contacts/',
  CONTACT_DETAIL: 'automation/contact-detail',
  DELETE: 'automation/remove/',
  READ: 'automation/get-detail',
  UPDATE: 'automation/',
  CREATE: 'automation',
  DOWNLOAD: 'automation/download',
  BULK_DOWNLOAD: 'automation/bulk-download',
  GET_TITLES: 'automation/get-titles',
  GET_ALL_TITLES: 'automation/get-all-titles',
  ASSIGN: 'timeline/create',
  ASSIGN_NEW: 'timeline/create_new',
  CANCEL: 'automation-line/cancel/',
  CANCEL_DEAL: 'automation-line/cancel-deal/',
  GET_COUNT: 'timeline/counts',
  LOAD_TIMELINES: 'timeline/load',
  LOAD_OWN: 'automation/list/own',
  LOAD_LIBRARY: 'automation/load-library',
  SEARCH_CONTACT: 'automation/search-contact',
  SEARCH_DEAL: 'automation/search-deal',
  MOVE_FILES: 'automation/move',
  REMOVE_FOLDER: 'automation/remove-folder',
  REMOVE_FOLDERS: 'automation/remove-folders',
  DOWNLOAD_FOLDER: 'automation/download-folder',
  BULK_REMOVE: 'automation/remove',
  SELECT_ALL: 'automation/select-all/',
  SELECT_ALL_DEALS: 'automation/select-all-deals/',
  BULK_CANCEL: 'automation-line/bulk-cancel',
  GET_ACTION_TIMELINES: 'timeline/get-action',
  GET_AUTOMATION_LINE: 'automation-line/',
  UPDATE_ACTION_TIMELINES: 'timeline/update-action',
  ADD_ACTION_TIMELINES: 'timeline/add-action',
  REMOVE_ACTION_TIMELINES: 'timeline/remove-action',
  UPLOAD_AUDIO: 'automation/upload-audio',
  GET_AUTOMATION_LINES: 'automation-line/get',
  GET_CONTACTS_AUTOMATION: 'automation/contacts-automation',
  UPDATE_TIMELINE_STATUS: 'timeline/update-status',
  PROCESS_TIMELINE: 'automation-line/process',
  GET_PARENT_FOLDER: 'automation/parent-folder/',
  GET_TIMELINES: '/get-timelines',
  GET_ACTIVE_COUNTS: 'automation/get-active-counts',
  LOAD_AUTOMATION_TIMELINES: 'timeline/get-automation-timelines'
};
export const FOLDER = {
  GET_ALL_PARENTS: 'folder/getAllParents'
};
export const APPOINTMENT = {
  LOAD_CALENDARS: 'appointment/calendar',
  GET_EVENT: 'appointment',
  UPDATE_EVENT: 'appointment/',
  DELETE_EVENT: 'appointment/delete',
  ACCEPT: 'appointment/accept',
  DECLINE: 'appointment/decline',
  DETAIL: 'appointment/detail',
  REMOVE_CONTACT: 'appointment/delete-contact'
};
export const THEME = {
  GET_THEME: 'theme/',
  SET_THEME: 'theme/set-video',
  NEWSLETTERS: 'theme/newsletters',
  STANDARD_TEMPLATES: 'theme/get-templates',
  STANDARD_TEMPLATE: 'theme/get-template',
  BULK_REMOVE: 'theme/bulk-remove'
};
export const LABEL = {
  CREATE: 'label',
  PUT: 'label/',
  GET: 'label',
  LOAD: 'label/load',
  LOAD_WITH_CONTACTS: 'label/load-with-contacts',
  BULK_CREATE: 'label/bulk-create',
  DELETE: 'label/',
  MULTI_DELETE: 'label/delete',
  MERGE: 'label/merge',
  CHANGE_ORDER: 'label/order',
  LOAD_CONTACTS: 'label/contacts',
  SHARED_LABELS: 'label/shared-contacts'
};

export const MAILLIST = {
  CREATE: 'mail-list',
  GET: 'mail-list/',
  DELETE: 'mail-list/',
  UPDATE: 'mail-list/',
  ADD_CONTACTS: 'mail-list/add-contacts',
  REMOVE_CONTACTS: 'mail-list/remove-contacts',
  BULK_REMOVE: 'mail-list/delete',
  LOAD_CONTACTS: 'mail-list/contacts',
  SELECT_ALL_CONTACTS: 'mail-list/get-all/'
};

export const CAMPAIGN = {
  CREATE: 'campaign',
  GET: 'campaign/',
  EDIT: 'campaign/',
  LOAD_AWAITCAMPAIGN: 'campaign/await-campaign',
  LOAD_SESSION: 'campaign/sessions',
  LOAD_ACTIVIES: 'campaign/activities',
  REMOVE_SESSION: 'campaign/remove-session',
  REMOVE_CONTACT: 'campaign/remove-contact',
  DAY_STATUS: 'campaign/day-status',
  DRAFT: 'campaign/save-draft',
  PUBLISH: 'campaign/publish',
  REMOVE: 'campaign/remove',
  LOAD_DRAFT: 'campaign/load-draft',
  LOAD_CONTACTS: 'campaign/load-contacts',
  BULK_REMOVE: 'campaign/bulk-remove',
  LOAD_OWN: 'campaign/load-own'
};

export const SEND = {
  VIDEO_EMAIL: 'video/bulk-email',
  VIDEO_GMAIL: 'video/bulk-gmail',
  VIDEO_OUTLOOK: 'video/bulk-outlook',
  PDF_EMAIL: 'pdf/bulk-email',
  PDF_GMAIL: 'pdf/bulk-gmail',
  PDF_OUTLOOK: 'pdf/bulk-outlook',
  IMAGE_EMAIL: 'image/bulk-email',
  IMAGE_GMAIL: 'image/bulk-gmail',
  IMAGE_OUTLOOK: 'image/bulk-outlook',
  VIDEO_TEXT: 'video/bulk-text',
  PDF_TEXT: 'pdf/bulk-text',
  IMAGE_TEXT: 'image/bulk-text',
  EMAIL: 'email/bulk-email',
  GMAIL: 'email/bulk-gmail',
  OUTLOOK: 'email/bulk-outlook',
  TEXT: '',
  SHARE: 'email/share-platform',
  SEND_EMAIL: 'email/send-email'
};

export const DRAFT = {
  CREATE: 'draft/create',
  GET: 'draft',
  UPDATE: 'draft/',
  REMOVE: 'draft/'
};

export const TAG = {
  ALL: 'tag/getAll',
  TEAM: 'tag/getAllForTeam',
  SHARED_TAGS: 'tag/shared-tags',
  GET: 'tag/load',
  CREATE: 'tag',
  UPDATE: 'tag/update',
  DELETE: 'tag/delete',
  MULTI_DELETE: 'tag/multi-delete',
  MERGE: 'tag/merge',
  LOAD_ALL_CONTACTS: 'tag/load-all-contacts',
  LOAD_CONTACTS: 'tag/load-contacts',
  LOAD_SOURCES: 'contact/sources',
  LOAD_COMPANIES: 'contact/brokerage'
};
export const DEALSTAGE = {
  GET: 'deal-stage',
  GETSEARCH: 'deal-stage/search',
  ADD: 'deal-stage/add',
  DELETE: 'deal-stage/remove',
  EDIT: 'deal-stage/',
  CHANGE_ORDER: 'deal-stage/change-order',
  EASY_LOAD: 'deal-stage/easy-load',
  WITHCONTACT: 'deal-stage/with-contact',
  LOAD: 'deal-stage/load',
  INIT: 'deal-stage/init',
  LOAD_MORE: 'deal-stage/load-more',
  SEARCH_DEALS: 'deal-stage/search-deals'
};

export const DEAL = {
  GET: 'deal/',
  GET_DEALS: 'deal/get-deals',
  BULK_DELETE: 'deal/bulk-remove',
  ONLY_DEAL: 'deal/only/',
  MOVE: 'deal/move-deal',
  ADD_NOTE: 'deal/v2/add-note',
  EDIT_NOTE: 'deal/v2/edit-note',
  REMOVE_NOTE: 'deal/remove-note',
  SEND_EMAIL: 'deal/send-email',
  GET_EMAILS: 'deal/get-email',
  GET_NOTES: 'deal/get-note',
  ADD_FOLLOWUP: 'deal/add-follow',
  EDIT_FOLLOWUP: 'deal/update-follow',
  COMPLETE_FOLLOWUP: 'deal/complete-follow',
  REMOVE_FOLLOWUP: 'deal/remove-follow',
  GET_FOLLOWUP: 'deal/get-follow',
  GET_ACTIVITY: 'deal/get-activity',
  ADD_APPOINTMENT: 'deal/create-appointment',
  GET_APPOINTMENT: 'deal/get-appointments',
  UPDATE_APPOINTMENT: 'deal/update-appointment',
  REMOVE_APPOINTMENT: 'deal/remove-appointment',
  ADD_GROUP_CALL: 'deal/create-team-call',
  GET_GROUP_CALL: 'deal/get-team-calls',
  UPDAGE_GROUP_CALL: '',
  REMOVE_GROUP_CALL: '',
  SEND_TEXT: 'deal/send-text',
  UPDATE_CONTACT: 'deal/update-contact/',
  MATERIAL_ACTIVITY: 'deal/material-activity/',
  LOAD_TASKS: 'deal/get-tasks/',
  GET_TIMELINES: 'deal/get-timelines/',
  GET_All_TIMELINES: 'deal/get-all-timelines',
  BULK_CREATE: 'deal/bulk-create',
  BULK_CREATE_CSV: 'deal/bulk-create-csv',
  SET_PRIMARY_CONTACT: 'deal/set-primary-contact',
  GET_SIBLINGS: 'deal/siblings/',
  GET_COUNT: 'deal/count/',
  DEAL_STAGE_CONTACTS: 'deal/contacts-by-stage'
};

export const MATERIAL = {
  EMAIL: 'material/bulk-email',
  BULK_TEXT: 'material/bulk-text',
  VIDEO_TEXT: 'video/bulk-text',
  PDF_TEXT: 'pdf/bulk-text',
  IMAGE_TEXT: 'image/bulk-text',
  LOAD: 'material/load',
  LOAD_OWN: 'material/load-own',
  LOAD_LIBRARY_FOLDER_LIST: 'material/load-library-folder-list',
  LOAD_LIBRARY: 'material/load-library',
  BULK_REMOVE: 'material/remove',
  CREATE_FOLDER: 'material/folder',
  UPDATE_FOLDER: 'material/folder/',
  REMOVE_FOLDER: 'material/remove-folder',
  DOWNLOAD_FOLDER: 'material/download-folder',
  BULK_DOWNLOAD: 'material/bulk-download',
  UPDATE_FOLDERS: 'material/update-folders',
  REMOVE_FOLDERS: 'material/remove-folders',
  MOVE_FILES: 'material/move-material',
  LEAD_CAPTURE: 'material/lead-capture',
  UPDATE_MATERIAL_THEME: 'material/update-material-theme',
  UPDATE_MATERIAL_VIEW_MODE: 'material/update-material-view-mode',
  ANALYTICS_ON_TYPE: 'material/analyticsOnType/',
  ACTIVITIES: 'material/activities'
};

export const NOTIFICATION = {
  GET: 'notification',
  LOAD_PAGE: 'notification/list/',
  ALL: 'notification/load/all',
  READ_MARK: 'notification/bulk-read',
  UNREAD_MARK: 'notification/bulk-unread',
  DELETE: 'notification/bulk-remove',
  TEXT_DELIVERY: 'notification/get-delivery',
  STATUS: 'notification/status',
  QUEUE_TASK: 'notification/queue-task',
  EMAIL_TASK: 'notification/email-task',
  REMOVE_EMAIL_TASK: 'notification/remove-email-task',
  REMOVE_EMAIL_CONTACT: 'notification/remove-email-contact',
  LOAD_TASK_CONTACTS: 'notification/load-task-contact',
  LOAD_QUEUE_CONTACTS: 'notification/load-queue-contact',
  LOAD_EMAIL_QUEUE: 'notification/queue/emails',
  LOAD_TEXT_QUEUE: 'notification/queue/texts',
  LOAD_AUTOMATION_QUEUE: 'notification/queue/automations',
  LOAD_UNREAD_TEXTS: 'notification/unread-texts',
  TEXT_QUEUE: 'notification/text-task',
  ALL_TASKS: 'notification/all-tasks',
  CHECK_TASKS: 'notification/check-task-count',
  REMOVE_TASK: 'notification/remove-task/',
  UPDATE_TASK: 'notification/update-task/',
  RESCHEDULE_TASK: 'notification/reschedule-task/',
  UPDATET_TASK_STATUS: 'notification/update-task-status/',
  GET_SYSTEM_NOTIFICATION: 'notification/system-notification/'
};

export const FILTER = {
  API: 'filter/'
};

export const SMS = {
  GET: 'sms/',
  GET_MESSAGE: 'sms/get-messages',
  MARK_READ: 'sms/mark-read',
  SEARCH_NUMBER: 'sms/search-numbers',
  BUY_NUMBER: 'sms/buy-numbers',
  BUY_CREDIT: 'sms/buy-credit',
  BUY_WAVV_SUBSCRIPTION: 'sms/buy-wavv-subscription',
  LOAD_FILES: 'sms/load-files',
  GET_MESSAGE_OF_COUNT: 'sms/get-messages-count',
  CREATE_SUB_ACCOUNT: 'sms/create-sub-account',
  MOVE_NUMBER: 'sms/move-number',
  CREATE_STARTER_BRAND: 'sms/create-starter-brand',
  UPDATE_STARTER_BRAND: 'sms/starter-brand',
  CREATE_STANDARD_BRAND: 'sms/create-standard-brand',
  CREATE_BRAND_CAMPAIGN: 'sms/create-brand-campaign',
  GET_TWILIO_STATUS: 'sms/get-twilio-brand',
  GET_STARTER_BRAND_STATUS: 'sms/get-starter-brand-status',
  GET_WAVV_STATE: 'sms/get-wavv-state',
  UPDATE_WAVV_SUBSCRIPTION: 'sms/update-subscription',
  SEND_STARTER_BRAND_OTP: 'sms/send-starter-brand-otp',
  CREATE_STARTER_BRAND_MESSAGING: 'sms/create-starter-brand-messaging',
  ATTACH_NUMBER: 'sms/attach-number-to-service'
};

export const INTEGRATION = {
  CHECK_CALENDLY: 'integration/calendly/check-auth',
  DISCONNECT_CALENDLY: 'integration/calendly/disconnect',
  GET_CALENDLY: 'integration/calendly',
  SET_EVENT: 'integration/calendly/set-event',
  GET_JWT_TOKEN: 'integration/jwt-token',
  GET_CRYPTO_TOKEN: 'integration/crypto-token',
  CONNECT_DIALER: 'integration/dialer',
  CREATE_ZOOM: 'integration/zoom-create-meeting',
  CHAT_GPT: 'integration/chat-gpt'
};

export const DIALER = {
  REGISTER: 'phone',
  EDIT: 'phone/',
  GET_RECORDING: 'phone/recording',
  DEAL_DIALER: 'phone/deal',
  LOAD_STATISTICS: 'phone/statistics',
  LOAD_HISTORY: 'phone/logs',
  UPDATE_LOGS: 'phone/update_logs'
};

export const SCHEDULE = {
  EVENT_TYPE: 'scheduler/event-type/',
  SEARCH_BY_LINK: 'scheduler/search-link',
  GET_EVENT: 'scheduler/load-events/',
  ADD_SCHEDULE: 'scheduler/scheduler-event',
  LOAD_CONFLICTS: 'scheduler/load-conflicts'
};

export const ASSETS = {
  LOAD: 'assets/load/',
  UDPATE: 'assets/update',
  CREATE: 'assets/create',
  REPLACE: 'assets/replace',
  DELETE: 'assets/delete',
  UPLOAD: 'assets/upload'
};

export const PIPELINE = {
  GET: 'pipe',
  EDIT: 'pipe/',
  GETALL: 'pipe/load'
};
export const SCHEDULESEND = {
  CREATE: 'task/create',
  REMOVE: 'task/remove',
  REMOVE_CONTACT: 'task/remove-contact',
  MASS_TASKS: 'task/mass-tasks'
  // GET: 'task',
  // GETTASK: 'task/data',
  // GETCOUNT: 'task/counts'
};

export const ANALYTICS = {
  BY_FIELD: 'contact/count-by-fields',
  BY_ACTIVITY: 'contact/count-by-activities',
  BY_AUTOMATION: 'automation/count-by-automation',
  BY_RATE: 'contact/count-by-rates',
  CALCULATE_RATES: 'contact/calculate-rates'
};

export const PERSONALITY = {
  CREATE: 'personality',
  PUT: 'personality/',
  LOAD: 'personality/load',
  DELETE: 'personality/'
};

export const LEADFORM = {
  GET: 'lead-form/',
  GET_DETAIL_WITH_HISTORY: 'lead-form/with-history/',
  GET_HISTORY_COUNT: 'lead-form/response-count/'
};

export const AGENTFILTER = {
  GET: 'agent-filter/'
};

export const EMAIL = {
  GET_GMAIL_MESSAGE: 'email/get-gmail-message/',
  GET_GMAIL_ATTACHMENT: 'email/get-gmail-attachment'
};

export const PAGE_BUILDER = {
  LOAD_TEMPLATES: 'page/templates',
  LOAD_SITES: 'page/sites',
  CREATE_SITE: 'page/sites/create',
  DELETE_SITE: 'page/sites/'
};

export const LANDINGPAGE = {
  CREATE: 'landing-page/',
  GET: 'landing-page/',
  PREVIEW: 'landing-page/preview',
  GET_PUBLISHED: 'landing-page?type=published',
  GET_UNPUBLISHED: 'landing-page?type=unpublished',
  GET_FORM_TRACKS: 'landing-page/form-tracks/',
  GET_MATERIAL_TRACKS: 'landing-page/material-tracks/',
  GET_TRACK_COUNT: 'landing-page/count-of-tracks'
};
export const CUSTOM_FIELD = {
  CREATE: 'custom_field',
  PUT: 'custom_field/',
  GET: 'custom_field/',
  LOAD: 'custom_field/load',
  DELETE: 'custom_field/',
  DELETES: 'custom_field/delete'
};
