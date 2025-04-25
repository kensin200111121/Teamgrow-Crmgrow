export const PACKAGE = {
  ELITE: {
    contact_info: {
      is_limit: false
    },
    material_info: {
      is_limit: false,
      is_enabled: true,
      record_max_duration: 60000000
    },
    automation_info: {
      is_limit: true,
      is_enabled: true,
      max_count: 2000
    },
    calendar_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 4
    },
    text_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 1000
    },
    assistant_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 2
    },
    team_info: {
      owner_enabled: true,
      is_limit: true,
      max_count: 2
    },
    pipe_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 20
    },
    scheduler_info: {
      is_limit: false,
      is_enabled: true
    },
    landing_page_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 3
    },
    support_info: {
      feature_request: true
    },
    agent_vending_info: {
      is_limit: true,
      is_enabled: true,
      max_count: 2
    },
    capture_enabled: true,
    link_track_enabled: true
  },
  PRO: {
    contact_info: {
      is_limit: true,
      max_count: 5000
    },
    material_info: {
      is_limit: true,
      is_enabled: true,
      upload_max_count: 100,
      record_max_duration: 7200000
    },
    automation_info: {
      is_limit: true,
      is_enabled: true,
      max_count: 300
    },
    calendar_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 1
    },
    text_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 250
    },
    assistant_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 1
    },
    team_info: {
      owner_enabled: true,
      is_limit: true,
      max_count: 1
    },
    pipe_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 10
    },
    scheduler_info: {
      is_limit: true,
      is_enabled: true,
      max_count: 3
    },
    landing_page_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 1
    },
    support_info: {
      feature_request: false
    },
    agent_vending_info: {
      is_limit: true,
      is_enabled: true,
      max_count: 1
    },
    capture_enabled: true,
    link_track_enabled: true
  },
  LITE: {
    contact_info: {
      is_limit: true,
      max_count: 2000
    },
    material_info: {
      is_limit: true,
      is_enabled: true,
      upload_max_count: 10,
      record_max_duration: 600000
    }
  },
  EXT_FREE: {
    contact_info: {
      is_limit: true,
      max_count: 0
    },
    material_info: {
      is_limit: true,
      is_enabled: true,
      upload_max_count: 10,
      record_max_duration: 600000
    },
    material_track_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 1
    },
    ext_email_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 1
    }
  },
  EXT_PAID: {
    contact_info: {
      is_limit: true,
      max_count: 0
    },
    material_info: {
      is_limit: true,
      is_enabled: true,
      upload_max_count: 100,
      record_max_duration: 7200000
    }
  },
  VORTEX_FREE: {
    automation_info: {
      is_limit: true,
      is_enabled: false
    },
    text_info: {
      is_enabled: false,
      is_limit: true
    },
    pipe_info: {
      is_enabled: false,
      is_limit: true
    },
    material_info: {
      is_limit: true,
      is_enabled: false
    },
    material_track_info: {
      is_enabled: false,
      is_limit: true
    },
    dialer_info: {
      is_enabled: false
    },
    ext_email_info: {
      is_enabled: false
    },
    landing_page_info: {
      is_enabled: false
    },
    calendar_info: {
      is_enabled: true,
      is_limit: false
    },
    team_info: {
      is_enabled: false,
      owner_enabled: false,
      is_limit: true
    }
  },
  GROWTH: {
    text_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 0
    },
    automation_info: {
      is_limit: true,
      is_enabled: true,
      max_count: 2000
    },
    pipe_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 10
    },
    material_info: {
      is_limit: true,
      is_enabled: true,
      upload_max_count: 100,
      record_max_duration: 600000000
    },
    calendar_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 10
    },
    landing_page_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 2
    },
    scheduler_info: {
      is_limit: true,
      is_enabled: true,
      max_count: 10
    },
    organization_info: {
      is_enabled: true,
      is_limit: true,
      is_owner: true
    },
    team_info: {
      owner_enabled: true,
      is_limit: true,
      max_count: 10
    },
    assistant_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 1
    },
    affiliate: {
      is_enabled: false
    }
  },

  GROWTH_PLUS_TEXT: {
    text_info: {
      is_enabled: true,
      is_limit: true,
      max_count: 300
    }
  },

  BASIC: {
    automation_info: {
      is_limit: true,
      is_enabled: false
    },
    calendar_info: {
      is_enabled: false,
      is_limit: true
    },
    text_info: {
      is_enabled: false,
      is_limit: true
    },
    assistant_info: {
      is_enabled: false,
      is_limit: true
    },
    team_info: {
      owner_enabled: false,
      is_limit: true
    },
    pipe_info: {
      is_enabled: false,
      is_limit: true
    },
    scheduler_info: {
      is_enabled: false,
      is_limit: true
    },
    support_info: {
      feature_request: false
    },
    agent_vending_info: {
      is_enabled: false,
      is_limit: true
    },
    sub_account_info: {
      is_enabled: false,
      is_limit: true,
      max_count: 0
    },
    organization_info: {
      is_enabled: false,
      is_limit: true,
      max_count: 0,
      is_owner: false
    },
    material_track_info: {
      is_enabled: true,
      is_limit: false
    },
    ext_email_info: {
      is_enabled: true,
      is_limit: false
    },
    capture_enabled: false,
    link_track_enabled: false
  }
};
