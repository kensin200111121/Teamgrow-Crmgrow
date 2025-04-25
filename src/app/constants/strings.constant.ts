export const Strings = {
  NETWORK_ERROR_TITLE: 'Network Connection Error',
  NETWORK_ERROR_CONTENT:
    'Please check your network status or backend would be down.',
  LOGIN: 'Signing in failed.',
  AUTHENTICATION: 'Authentication failed.',
  TOKEN_ERROR: 'Authorization failed.',
  SIGNIN_ERROR: 'Sign in failed!',
  SIGNUP_ERROR: 'Sign up failed!',
  REQUEST_OAUTH_URL: 'Request Oauth URL!',
  SOCIAL_SIGNIN_ERROR: 'Social sign in is failed!',
  SOCIAL_SIGNUP_ERROR: 'Social sign up is failed!',
  REQUEST_SUCCESS: 'Your request was successful!',
  RESET_PASSWORD_SUCCESS: 'Password reset was successful!',
  DISABLED_NAVIGATION:
    'Please finish your current call before moving to this section.'
};

export const ERROR_STRINGS = {
  PRO: {
    limit_contacts: `You've exceeded maximum contact limit. Reduce the number of contacts to {{PRO}} or less if you are downgrading to Pro.`,
    limit_materials: `You've exceeded the maximum material limit. Reduce the amount of materials you have to {{PRO}} or less if you are downgrading to Pro.`,
    limit_automations: `You've exceeded the maximum active running automation limit. Reduce the amount of active automations to {{PRO}} or less if you are downgrading to Pro.`,
    limit_assistants: `You have exceeded the maximum assistant limit. Please remove assistants so you have just {{PRO}} if you are downgrading to Pro.`,
    limit_calendars: `You have exceeded the maximum calendar limit. Please remove calendars down to one calendar if downgrading to Pro.`,
    remove_multi_profile: 'Please remove sub-profiles in your account.',
    limit_scheduler: `You have exceeded the maxium scheduler event limit. Please remove scheduler events so you have just {{PRO}} if you are downgrading to Pro`,
    limit_agents: `You have exceeded the maxium agent filter limit. Please remove agent filters so you have just {{PRO}} if you are downgrading to Pro`
  },
  LITE: {
    limit_contacts: `You've exceeded maximum contact limit. Reduce the number of contacts to {{LITE}} or less if you are downgrading to Lite.`,
    limit_materials: `You've exceeded the maximum material limit. Reduce the amount of materials you have to {{LITE}} or less if you are downgrading to Lite.`,
    remove_automations: `Please remove automation which you've created in your account.`,
    remove_assistants: 'Please remove the exiting assistants in your account.',
    remove_calendars: `Please remove calendars in your account.`,
    remove_teams: 'Please remove teams in your account.',
    remove_multi_profile: 'Please remove sub-profiles in your account.',
    sms: `Yon won't text in Lite plan. Are you sure to downgrade?`,
    remove_scheduler: 'Please remove scheduler events in your account.',
    remove_agents: 'Please remove agent filters in your account.'
  }
};
