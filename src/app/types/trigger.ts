enum TRIGGER_TYPE {
  DEAL_STAGE_CHANGE = 'deal_stage_updated',
  CONTACT_TAG_ADDED = 'contact_tags_added',
  CONTACT_STATUS_CHANGED = 'contact_status_updated',
  CONTACT_VIEWS_MEDIA = 'material_viewed',
  CONTACT_FORM_COMPLETE = 'form_submitted'
}
export interface ITrigger {
  type: TRIGGER_TYPE | null;
  detail: {
    pipeline?: string;
    stage?: string;
    tags?: string[];
    status?: string;
    form_id?: string;
    conditions?: any[];
    id?: string;
    type?: string;
    amount?: number;
  };
}
