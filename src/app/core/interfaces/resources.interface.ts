import { ITrigger } from '@app/types/trigger';
import {
  MaterialType,
  AutomationType,
  TemplateType,
  PipelineType
} from '@core/enums/resources.enum';

export interface FilterParam<ResourceType> {
  folder?: string;
  type?: ResourceType;
  teamOptions?: string[];
  userOptions?: string[];
  typeOptions?: string[];
  search?: string;
  loadType?: string;
  team_id?: string;
}

export interface FolderItemInfo {
  folder: string;
  itemId: string;
  itemType: string;
}
export interface PageCountItem {
  id: number;
  label: string;
}

export interface FilterTypeItem<ResourceType> {
  id: ResourceType;
  label: string;
}

export interface SortTypeItem {
  id: string;
  label: string;
}

export interface BulkActionItem {
  label: string;
  type: string;
  command: string;
  spliter?: boolean;
  icon?: string;
  loading?: boolean;
  loadingLabel?: string;
  status?: boolean;
}

export interface TeamInfo {
  _id: string;
  name?: string;
}

export interface SharedInfo {
  [key: string]: TeamInfo;
}

export interface OwnerInfo {
  _id: string;
  user_name: string;
}

export interface IMaterialItem {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  preview: string;
  type: string;
  material_theme: string;
  capture_form?: any;
  enabled_capture: boolean;
  view_mode: string;
  priority: number;
  duration: number;
  sent: number;
  views: number;
  contacts: number;

  recording: boolean;
  uploaded: boolean;
  converted: string;
  bucket?: string;
  url?: string;
  key?: string;
  material_type: MaterialType;
  item_type: MaterialType;
  is_download?: boolean;
  team_id?: TeamInfo;
  shared_with?: SharedInfo[];
  owner: OwnerInfo;
  role: string;
  user: string;
  created_at: Date;
  rootFolder?: boolean;
  team?: string;
  downloads?: number;
  status?: {
    converted?: { status: boolean };
    stream?: { status: boolean };
    merged?: { status: boolean };
  };

  teamId?: string;
}

export class MaterialItem implements IMaterialItem {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  preview: string;
  type: string;
  material_theme: string;
  capture_form?: any;
  forms?: any;
  enabled_capture: boolean;
  view_mode: string;
  priority: number;
  duration: number;
  sent: number;
  views: number;
  contacts: number;
  recording: boolean;
  uploaded: boolean;
  converted: string;
  bucket?: string;
  url?: string;
  key?: string;
  material_type: MaterialType;
  item_type: MaterialType;
  is_download?: boolean;
  team_id?: TeamInfo;
  shared_with?: SharedInfo[];
  owner: OwnerInfo;
  role: string;
  user: string;
  created_at: Date;
  updated_at: Date;

  rootFolder?: boolean;
  team?: string;
  downloads?: number;
  status?: {
    converted?: { status: boolean };
    stream?: { status: boolean };
    merged?: { status: boolean };
  };

  constructor(item: IMaterialItem) {
    this._id = item._id;
    this.title = item.title;
    this.description = item.description;
    this.thumbnail = item.thumbnail;
    this.preview = item.preview;
    this.type = item.type;
    this.material_theme = item.material_theme;
    this.capture_form = item.capture_form;
    this.enabled_capture = item.enabled_capture;
    this.view_mode = item.view_mode;
    this.priority = item.priority;
    this.duration = item.duration;
    this.sent = item.sent;
    this.views = item.views;
    this.contacts = item.contacts;
    this.recording = item.recording;
    this.uploaded = item.uploaded;
    this.converted = item.converted;
    this.bucket = item.bucket;
    this.url = item.url;
    this.key = item.key;
    this.material_type = item.material_type;
    this.item_type = item.item_type;
    this.is_download = item.is_download;
    this.team_id = item.team_id;
    this.shared_with = item.shared_with;
    this.owner = item.owner;
    this.created_at = item.created_at;
    this.role = item.role;
    this.user = item.user;
    this.team = item.team;
    this.rootFolder = item.rootFolder;
    this.downloads = item.downloads;
    this.status = item?.status;
  }

  get captureFormCount(): number {
    return Object.keys(this.capture_form || {}).length;
  }

  get firstCaptureForm(): string {
    return Object.keys(this.capture_form || {})[0] || '';
  }

  get isDownloadable(): boolean {
    if (!this.is_download) {
      return false;
    }
    if (!this.url) {
      return true;
    }
    if (
      this.url.indexOf('youtube.com') == -1 &&
      this.url.indexOf('vimeo.com') == -1
    ) {
      return true;
    } else {
      return false;
    }
  }

  get sharedTeamInfo(): string {
    if (!this.shared_with?.length) {
      return;
    }
    return this.shared_with[0][this._id]?.name;
  }

  get sharedTeamCount(): number {
    if (!this.shared_with?.length) {
      return;
    }
    return this.shared_with.length;
  }

  get downloadInfo(): string {
    if (!this.team_id) {
      return;
    }
    return this.team_id.name;
  }

  get hasTeamAction(): boolean {
    if (this.team) {
      return false;
    }
    return true;
  }
}

export interface IAutomationItem {
  _id: string;
  user: string;
  title: string;
  automations: any[];
  type?: string;
  label?: string;
  contacts: number;
  downloads?: number;
  item_type: AutomationType;
  team_id?: TeamInfo;
  shared_with?: SharedInfo[];
  role: string;
  created_at: Date;
  team: TeamInfo;
  meta: any;
  owner: {
    _id: string;
    user_name: string;
  };
  is_active: boolean;
  trigger?: ITrigger;
}

export class AutomationItem implements IAutomationItem {
  _id: string;
  user: string;
  title: string;
  automations: any[];
  type?: string;
  label?: string;
  contacts: number;
  downloads?: number;
  item_type: AutomationType;
  team_id?: TeamInfo;
  shared_with?: SharedInfo[];
  role: string;
  created_at: Date;
  team: TeamInfo;
  meta: any;
  owner: {
    _id: string;
    user_name: string;
  };
  is_active: boolean;
  trigger?: ITrigger;

  constructor(item: IAutomationItem) {
    this._id = item._id;
    this.title = item.title;
    this.automations = item.automations;
    this.type = item.type;
    this.label = item.label;
    this.contacts = item.contacts;
    this.downloads = item.downloads;
    this.item_type = item.item_type;
    this.team_id = item.team_id;
    this.shared_with = item.shared_with;
    this.user = item.user;
    this.role = item.role;
    this.created_at = item.created_at;
    this.team = item.team;
    this.meta = item.meta;
    this.owner = item.owner;
    this.is_active = item.is_active;
    this.trigger = item.trigger;
  }

  get resource_count(): number {
    return (
      this.meta.images.length + this.meta.pdfs.length + this.meta.videos.length
    );
  }

  get automationLabel(): string {
    if (this.label === 'deal') {
      return 'Pipeline Deal';
    } else if (this.label === 'deal stage') {
      return 'Pipeline Stage';
    }
    return this.label;
  }

  get sharedTeamInfo(): string {
    if (!this.shared_with?.length) {
      return;
    }
    return this.shared_with[0][this._id]?.name;
  }

  get sharedTeamCount(): number {
    if (!this.shared_with?.length) {
      return;
    }
    return this.shared_with.length;
  }

  get hasTeamAction(): boolean {
    if (this.team) {
      return false;
    }
    return true;
  }
}

export interface ITemplateItem {
  _id: string;
  title: string;
  subject: string;
  content: string;
  default: boolean;
  type: TemplateType;
  item_type: TemplateType;
  team_id?: TeamInfo;
  shared_with?: SharedInfo[];
  owner: OwnerInfo;
  team_info: TeamInfo;
  downloads: number;
  role: string;
  user: string;
  created_at: Date;
  rootFolder?: boolean;
  team?: string;
  meta: any;
  image_ids: string[];
  pdf_ids: string[];
  video_ids: string[];
}

export class TemplateItem implements ITemplateItem {
  _id: string;
  title: string;
  subject: string;
  content: string;
  default: boolean;
  type: TemplateType;
  item_type: TemplateType;
  team_id?: TeamInfo;
  shared_with?: SharedInfo[];
  owner: OwnerInfo;
  team_info: TeamInfo;
  downloads: number;
  role: string;
  user: string;
  created_at: Date;
  rootFolder?: boolean;
  team?: string;
  meta: any;
  image_ids: string[];
  pdf_ids: string[];
  video_ids: string[];

  constructor(item: ITemplateItem) {
    this._id = item._id;
    this.title = item.title;
    this.subject = item.subject;
    this.content = item.content;
    this.default = item.default;
    this.type = item.type;
    this.item_type = item.item_type;
    this.team_id = item.team_id;
    this.shared_with = item.shared_with;
    this.owner = item.owner;
    this.team_info = item.team_info;
    this.role = item.role;
    this.user = item.user;
    this.downloads = item.downloads;
    this.created_at = item.created_at;
    this.rootFolder = item.rootFolder;
    this.team = item.team;
    this.meta = item.meta;
    this.image_ids = item.image_ids;
    this.pdf_ids = item.pdf_ids;
    this.video_ids = item.video_ids;
  }

  get resource_count(): number {
    return (
      this.image_ids?.length + this.pdf_ids?.length + this.video_ids?.length
    );
  }

  get sharedTeamInfo(): string {
    if (!this.shared_with?.length) {
      return;
    }
    return this.shared_with[0][this._id]?.name;
  }

  get sharedTeamCount(): number {
    if (!this.shared_with?.length) {
      return;
    }
    return this.shared_with.length;
  }

  get downloadInfo(): string {
    if (!this.team_id) {
      return;
    }
    return this.team_id.name;
  }

  get hasTeamAction(): boolean {
    if (this.team) {
      return false;
    }
    return true;
  }
}

export interface FolderItem {
  _id: string;
  title: string;
  item_type: MaterialType | AutomationType | TemplateType;
  role: string;
  user: string;
  description: string;
  thumbnail: string;
  preview: string;
}

export interface FolderTreeItem {
  folderId: string;
  folderName: string;
}

export type ResourceListItem<T> = FolderItem | T;

export interface ResourceResponse<ResourceItem> {
  status: boolean;
  data: FolderHistoryData<ResourceItem>;
}
export interface FolderHistoryData<ResourceItem> {
  results: ResourceListItem<ResourceItem>[];
  prevFolder?: string;
  team?: TeamInfo;
  currentFolder: any;
  folderTree?: FolderTreeItem[];
}

export interface FolderResponse {
  status: boolean;
  data: FolderResponseData;
}

export interface FolderResponseData {
  results: FolderItem[];
  prevFolder: FolderItem;
}

export interface StoredResources<Item> {
  [folder: string]: FolderHistoryData<Item>;
}

export interface CheckRequestItem {
  _id: string;
  type: string; // folder | file
}

export interface CheckRequest {
  materials?: CheckRequestItem[];
  automations?: CheckRequestItem[];
  templates?: CheckRequestItem[];
  pipeline?: CheckRequestItem[];
}

export interface ShareRequest {
  team_ids: string[];
  materials?: CheckRequestItem[];
  automations?: CheckRequestItem[];
  templates?: CheckRequestItem[];
  pipelines?: CheckRequestItem[];
}

export interface DownloadRequest {
  team: string;
  materials?: CheckRequestItem[];
  automations?: CheckRequestItem[];
  templates?: CheckRequestItem[];
  stages?: any;
}

export interface StopShareRequest {
  team_ids?: string[];
  materials?: CheckRequestItem[];
  automations?: CheckRequestItem[];
  templates?: CheckRequestItem[];
  pipelines?: CheckRequestItem[];
}

export interface CheckResponseItem {
  _id: string;
  title?: string;
  name?: string;
  preview?: string;
}

export interface CheckingResponse {
  status: boolean;
  is_root?: boolean;
  data: {
    videos?: CheckResponseItem[];
    pdfs?: CheckResponseItem[];
    images?: CheckResponseItem[];
    dealStages?: CheckResponseItem[];
    titles?: CheckResponseItem[];
    templates?: CheckResponseItem[];
    automationIdsToShare?: string[];
    automationIds?: string[];
    folders?: string[];
    downloadedItems: CheckResponseItem[];
    unsharedItems: CheckResponseItem[];
    limited?: boolean;
  };
  error?: string;
}

export interface RelatedResourceResponse {
  status: boolean;
  is_root?: boolean;
  data: {
    videos?: CheckResponseItem[];
    pdfs?: CheckResponseItem[];
    images?: CheckResponseItem[];
    automations?: CheckResponseItem[];
  };
  error?: string;
}

export interface EmbedInfo {
  status: boolean;
  data: {
    videoKey: string;
    userKey: string;
  };
}

export interface IPipelineItem {
  _id: string;
  item_type: PipelineType;
  title: string;
  created_at: Date;
  has_automation: boolean;
  is_active: boolean;
  move_assign: number;
  no_automation: boolean;
  updated_at: Date;
  user: string;
  team: string;
  team_info: TeamInfo;
  downloads: number;
  owner: OwnerInfo;
}

export class PipelineItem implements IPipelineItem {
  _id: string;
  item_type: PipelineType;
  title: string;
  created_at: Date;
  has_automation: boolean;
  is_active: boolean;
  move_assign: number;
  no_automation: boolean;
  updated_at: Date;
  user: string;
  team: string;
  team_info: TeamInfo;
  downloads: number;
  owner: OwnerInfo;

  constructor(item: IPipelineItem) {
    this._id = item._id;
    this.item_type = item.item_type;
    this.title = item.title;
    this.created_at = item.created_at;
    this.has_automation = item.has_automation;
    this.is_active = item.is_active;
    this.move_assign = item.move_assign;
    this.no_automation = item.no_automation;
    this.updated_at = item.updated_at;
    this.user = item.user;
    this.team = item.team;
    this.team_info = item.team_info;
    this.downloads = item.downloads;
    this.owner = item.owner;
  }

  // get sharedTeamInfo(): string {
  //   if (!this.shared_with?.length) {
  //     return;
  //   }
  //   return this.shared_with[0][this._id]?.name;
  // }

  // get sharedTeamCount(): number {
  //   if (!this.shared_with?.length) {
  //     return;
  //   }
  //   return this.shared_with.length;
  // }

  get hasTeamAction(): boolean {
    if (this.team) {
      return false;
    }
    return true;
  }
}

/**
 * Material Navigate Models
 */

export type MaterialListType = 'Own' | 'Library';

export interface APIFolderItem {
  _id: string;
  rootFolder: boolean;
  folders: string[];
  title?: string; // its field is null on root folder case
  team?: TeamInfo;
  role: string;
}

export interface APIFolderTreeResponse {
  prevFolder: string;
  results: APIFolderItem[];
  currentFolder: APIFolderItem;
}

export interface MaterialTreeNode {
  id: string;
  name: string;
  hasChild?: boolean;
  children?: MaterialTreeNode[];
  isLoading?: boolean;
  parentId?: string;
  teamId?: string;
  role?: string;
}

export interface LandingPage {
  _id: string;
  background_color: string;
  content: string;
  description: string;
  form_settings: Array<{ [key in string]: number }>;
  form_type: number;
  forms: Array<{
    _id: string;
    name: string;
    tags: string[] | null;
    automation: Array<{ _id: string; title: string }>;
  }>;
  headline: string;
  is_published: boolean;
  material: string;
  material_type: 'video' | 'pdf' | 'image';
  name: string;
  theme: string;
  user: string;
  created_at: Date;
  updated_at: Date;
}

export interface LandingPageDetail {
  _id: string;
  background_color: string;
  content: string;
  description: string;
  form_settings: Array<{ [key in string]: number }>;
  form_type: number;
  forms: Array<{
    _id: string;
    name: string;
    tags: string[] | null;
    automation: Array<{ _id: string; title: string }>;
  }>;
  headline: string;
  is_published: boolean;
  material: {
    _id: string;
    title: string;
    preview: string;
    site_image: string;
    thumbnail: string;
  };
  material_type: 'video' | 'pdf' | 'image';
  name: string;
  theme: string;
  user: string;
  created_at: Date;
  updated_at: Date;
}
