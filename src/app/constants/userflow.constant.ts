import { environment } from '@environments/environment';

const SOURCE = environment.isSspa ? 'vortex' : 'crmgrow';

const WELCOME_DIALOG = {
  vortex: '80698dbc-bf1d-4d6c-99a5-90031ad870ec',
  crmgrow: '3e3d4a71-d310-45e9-97f7-1cc9f6e52fec'
};

const CHECKLIST = {
  vortex: 'f897c3b6-831a-427d-8377-490c71e6c496',
  crmgrow: '73d17b2f-c330-4a92-8156-8cf922b5e47c'
};

export const WELCOME_DIALGO_FLOW_ID = WELCOME_DIALOG[SOURCE];
export const CHECKLIST_FLOW_ID = CHECKLIST[SOURCE];
