import { SspaService } from '../../services/sspa.service';
import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { OverlayService } from '@services/overlay.service';
import { LabelService } from '@services/label.service';
import { environment } from '@environments/environment';
import { Subject, Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { DealsService } from '@services/deals.service';
import { MaterialService } from '@services/material.service';
import { StoreService } from '@services/store.service';
import * as _ from 'lodash';
import { AutomationService } from '@services/automation.service';
import {
  ACTION_CAT,
  AUTOMATION_ICONS,
  BRANCH_COUNT,
  CALENDAR_DURATION,
  CONTACT_PROPERTIES
} from '@constants/variable.constants';
import { Contact } from '@models/contact.model';
import { Deal } from '@models/deal.model';
import { stepRound } from '@variables/customStepCurved';
import { Layout } from '@swimlane/ngx-graph';
import { DagreNodesOnlyLayout } from '@variables/customDagreNodesOnly';
import { Automation } from '@models/automation.model';
import { DialerService } from '@services/dialer.service';
import { HandlerService } from '@services/handler.service';
import {
  convertIdToUrlOnSMS,
  convertMaterialIdToFullUrl,
  validateDateTime
} from '@utils/functions';
import moment from 'moment-timezone';
import { ContactService } from '@services/contact.service';
import { TeamService } from '@services/team.service';
import { v4 as uuidv4 } from 'uuid';
import { HelperService } from '@app/services/helper.service';

@Component({
  selector: 'app-automation-detail-overlay',
  templateUrl: './automation-detail-overlay.component.html',
  styleUrls: ['./automation-detail-overlay.component.scss']
})
export class AutomationDetailOverlayComponent implements OnInit {
  @Input('fullDataSource') fullNode;
  @Input('automationType') automationType = 'contact';
  @Input('type') type;
  @Input('disableOverlay') disableOverlay = false;
  isShow = false;
  siteUrl = environment.website;
  user_id = '';
  profileSubscription: Subscription;
  loadSubscription: Subscription;
  automations: any[] = [];
  materials = [];
  libraries = [];
  labels = [];

  fullNodeParsedInfo = null;

  // for show automation graph
  layoutSettings = {
    orientation: 'TB'
  };
  center$: Subject<boolean> = new Subject();
  panToNode$: Subject<string> = new Subject();
  curve = stepRound;
  public layout: Layout = new DagreNodesOnlyLayout();
  initEdges = [];
  initNodes = [{ id: 'start', label: '' }];
  edges = [];
  nodes = [];
  saved = true;

  autoZoom = true;
  zoomLevel = 0.8;
  autoCenter = true;

  @ViewChild('wrapper') wrapper: ElementRef;
  wrapperWidth = 0;
  wrapperHeight = 0;
  offsetX = 0;
  offsetY = 0;

  automation_type = 'contact';
  showType = 'contact';
  automation;
  automationSummary: Automation = new Automation();
  timelines = [];
  automation_id = '';
  isInherited = false;
  rvms = [];
  dialerSubscription: Subscription;
  getActionTimelineSubscription: Subscription;
  loadingTimelines = false;
  assignedTimelines = [];
  runningContacts = [];
  runningDeals = [];

  COUNTRIES: { code: string; name: string }[] = [];

  lead_fields: any[] = [];
  garbageSubscription: Subscription;

  sharingOptions = [
    {
      id: 1,
      value: 'Transfer',
      comment:
        'Transfer contacts help, Would you transfer contacts? Yes, please'
    },
    {
      id: 2,
      value: 'Clone',
      comment: 'Clone contacts help, Would you clone contacts? Yes, please'
    }
  ];
  private stages = [];

  constructor(
    private overlayService: OverlayService,
    public labelService: LabelService,
    private dealsService: DealsService,
    private userService: UserService,
    public materialService: MaterialService,
    private automationService: AutomationService,
    public storeService: StoreService,
    private dialerService: DialerService,
    private viewContainerRef: ViewContainerRef,
    private ngZone: NgZone,
    private handlerService: HandlerService,
    private contactService: ContactService,
    public sspaService: SspaService,
    private helperService: HelperService,
    private teamService: TeamService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user_id = profile._id;
      }
    );
    this.dealsService.easyLoad();
    this.automationService.automations$.subscribe((res) => {
      this.automations = res;
    });

    this.dialerSubscription = this.dialerService.rvms$.subscribe((res) => {
      if (res && res['success']) {
        this.rvms = res['messages'];
      }
    });

    this.handlerService.pageName.next('detail');
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
      }
    );
  }

  ngOnInit(): void {
    this.materialService.loadMaterial(false);
    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });
    this.loadSubscription = this.storeService.libraries$.subscribe(
      (libraries) => {
        this.libraries = libraries;
      }
    );
    this.dealsService.stageSummaries$.subscribe((_stages) => {
      this.stages = _stages;
    });
    if (this.isShowAutomationGraph(this.fullNode)) {
      this.timelines = this.fullNode.timelines;
      if (
        this.fullNode?.status === 'completed' ||
        this.fullNode?.status === 'stopped'
      ) {
        if (
          this.fullNode['id'] === 'a_10000' &&
          this.fullNode['parent_automationline']
        )
          this.loadCompletedAutomation(this.fullNode['parent_automationline']);
        else if (
          this.fullNode['id'] !== 'a_10000' &&
          this.fullNode['automation_line']
        )
          this.loadCompletedAutomation(this.fullNode['automation_line']);
        else {
          this.loadAutomation(this.fullNode['automation_id']);
        }
      } else if (this.fullNode?.status === 'progress') {
        this.loadTimelines(this.fullNode['automation_line']);
      } else {
        this.loadAutomation(this.fullNode['automation_id']);
      }
    }

    if (this.fullNode && this.fullNode['automation']) {
      const data = {
        automation: this.fullNode['automation'],
        ref: this.fullNode.id
      };
      this.loadingTimelines = true;
      this.getActionTimelineSubscription &&
        this.getActionTimelineSubscription.unsubscribe();
      this.getActionTimelineSubscription = this.automationService
        .getActionTimelines(data)
        .subscribe((timelines) => {
          this.loadingTimelines = false;
          if (timelines) {
            this.assignedTimelines = timelines;
            if (this.fullNode['automation_type'] === 'contact') {
              this.runningContacts = timelines.map((item) =>
                new Contact().deserialize(item.contact)
              );
            } else {
              this.runningDeals = timelines.map((item) =>
                new Deal().deserialize(item.deal)
              );
            }
          }
        });
    }
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.labelService.allLabels$.subscribe((res) => {
      this.labels = res;
    });
    this.loadTeam();
    if (this.fullNode)
      this.fullNodeParsedInfo = this.getMaterialInfo(this.fullNode);
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  update(activeTab = 'action'): void {
    const data = {
      type: 'edit',
      activeTab
    };
    if (this.fullNode) {
      data['timelines'] = this.assignedTimelines;
    }
    this.overlayService.close(data);
  }

  remove(): void {
    const data = {
      type: 'remove'
    };
    if (this.fullNode) {
      data['timelines'] = this.assignedTimelines;
    }
    this.overlayService.close(data);
  }

  expand(automation_id): void {
    window.open('/autoflow/edit/' + automation_id, '_blank');
  }

  overlayClose(): void {
    this.overlayService.close(null);
  }

  seeMore(): void {
    this.isShow = !this.isShow;
  }

  loadTeam(): void {
    this.teamService.loadAll(false);
  }

  getDealStageName(id): any {
    return this.stages?.find((stage) => stage._id === id)?.title || '';
  }

  getAutomationTitle(id): any {
    if (this.automations && this.automations.length > 0) {
      const index = this.automations.findIndex((item) => item._id === id);
      if (index >= 0) {
        return this.automations[index].title;
      }
    }
    return '';
  }

  getMaterialFullContent(
    content: string,
    type: string,
    materialIds: any
  ): string {
    if (type.includes('text')) {
      return convertIdToUrlOnSMS(content);
    } else if (type.includes('email')) {
      return convertMaterialIdToFullUrl(materialIds, content);
    }
    return content;
  }

  getMaterialInfo(node): any {
    let materials = [];
    let previewType = '';
    let videoCount = 0;
    let pdfCount = 0;
    let imageCount = 0;
    const materialIds = { videoIds: [], imageIds: [], pdfIds: [] };

    if (node.videos && node.videos.length > 0) {
      materials = [...node.videos];
      materialIds.videoIds = node.videos;
      previewType = 'video';
      videoCount = node.videos.length - 1;
    }
    if (node.pdfs && node.pdfs.length > 0) {
      materials = [...materials, ...node.pdfs];
      materialIds.pdfIds = node.pdfs;
      pdfCount = node.pdfs.length;
      if (previewType === '') {
        previewType = 'pdf';
        pdfCount--;
      }
    }
    if (node.images && node.images.length > 0) {
      materials = [...materials, ...node.images];
      materialIds.imageIds = node.images;
      imageCount = node.images.length;
      if (previewType === '') {
        previewType = 'image';
        imageCount--;
      }
    }
    let previewMaterial = {};
    if (materials && materials.length > 0) {
      const index = this.materials.findIndex(
        (item) => item._id === materials[0]
      );
      if (index >= 0) {
        previewMaterial = this.materials[index];
      }
    }
    if (materials && materials.length > 0) {
      const index = this.libraries.findIndex(
        (item) => item._id === materials[0]
      );
      if (index >= 0) {
        previewMaterial = this.libraries[index];
      }
    }
    const content = this.getMaterialFullContent(
      node.content,
      node.type,
      materialIds
    );

    const result = {
      previewType,
      count: materials.length - 1,
      material: previewMaterial,
      videoCount,
      pdfCount,
      imageCount,
      content
    };
    return result;
  }

  getAssignAt(group): string {
    if (group === 'primary') {
      return 'Primary Contact';
    }
    return 'Everyone';
  }

  isShowAssignAt(node) {
    return false;
  }

  getCalendarDuration(duration): string {
    const index = CALENDAR_DURATION.findIndex(
      (item) => item.value === duration
    );
    if (index >= 0) {
      return CALENDAR_DURATION[index].text;
    }
    return '';
  }

  getContact(contact): any {
    return new Contact().deserialize(contact);
  }

  // show graph functions

  isShowAutomationGraph(action): boolean {
    if (action && action.type === 'automation') {
      return true;
    }
    return false;
  }
  loadCompletedAutomation(id: string): void {
    this.automationService.getAutomationLine(id).subscribe((res) => {
      this.automation = res?.automation_line;
      this.automation_type = res?.automation_line['type'] || 'contact';
      // insert start action

      const actions = res?.automation_line['automations'];
      for (const action of actions) {
        action.id = action.ref.replace(`_${id}`, '');
        action.id = action.id.replace(`${id}`, 'a_10000');
        action.parent = action.parent_ref.replace(`_${id}`, '');
        action.parent = action.parent.replace(`${id}`, 'a_10000');
      }
      this.composeGraph(actions);
      this.rebuildStatus();
    });
  }

  loadTimelines(id: string): void {
    this.automationService.getTimelines(id).subscribe(
      (res) => {
        this.automation = res.automation_line;
        this.automation_type = res.automation_line['type'] || 'contact';
        // insert start action

        const actions = res.automation_line['timelines'];
        for (const action of actions) {
          action.id = action.ref.replace(`_${id}`, '');
          action.id = action.id.replace(`${id}`, 'a_10000');
          action.parent = action.parent_ref.replace(`_${id}`, '');
          action.parent = action.parent.replace(`${id}`, 'a_10000');
        }
        this.composeGraph(actions);
        this.rebuildStatus();
      },
      (err) => {}
    );
  }

  loadAutomation(id: string): void {
    this.automationService.get(id).subscribe(
      (res) => {
        this.automation = res;
        this.automation_type = res['type'] || 'contact';
        // insert start action

        const actions = res['automations'];
        this.fullNode.no_timelines = true;

        this.composeGraph(actions);
      },
      (err) => {}
    );
  }

  composeGraph(actions): void {
    const nodes = [];
    const edges = [];
    const caseNodes = {}; // Case nodes pair : Parent -> Sub case actions
    const edgesBranches = []; // Edge Branches
    if (actions?.length) {
      // check multiple branch version.
      const a_10000 = actions.filter((a) => a.id === 'a_10000');
      if (!a_10000?.length) {
        nodes.push({
          category: ACTION_CAT.START,
          id: 'a_10000',
          index: 10000,
          label: 'START',
          leaf: true,
          type: 'start'
        });
      }
    }
    const sortedActions = [];

    var rootAction = actions.find((action) => action.id === 'a_10000');
    if (rootAction) {
      sortedActions.push(rootAction);
    } else {
      rootAction = actions.find((action) => action.parent === 'a_10000');
      if (rootAction) {
        sortedActions.push(rootAction);
      }
    }

    function findAndAddChildActions(parentId) {
      const childActions = actions.filter(
        (action) => action.parent === parentId
      );
      childActions.forEach((childAction) => {
        sortedActions.push(childAction);
        findAndAddChildActions(childAction.id);
      });
    }

    findAndAddChildActions(rootAction.id);

    actions = sortedActions;
    if (actions) {
      actions.forEach((e) => {
        const node = {
          id: e.id,
          index: this.genIndex(e.id),
          period: e.period
        };

        if (e.condition) {
          if (e.action) {
            if (
              e.type === 'deal' &&
              e.action.type !== 'deal' &&
              this.automation_type !== 'deal'
            ) {
              node['parent_type'] = 'deal';
            }
            let type = e.action?.type;
            const videos = e.action?.videos ?? [];
            const pdfs = e.action?.pdfs ?? [];
            const images = e.action?.images ?? [];
            const materials = [...videos, ...pdfs, ...images];

            if (e.action.type === 'text') {
              if (materials.length === 0) {
                type = 'text';
              } else {
                if (materials.length === 1) {
                  if (videos.length > 0) {
                    type = 'send_text_video';
                  }
                  if (pdfs.length > 0) {
                    type = 'send_text_pdf';
                  }
                  if (images.length > 0) {
                    type = 'send_text_image';
                  }
                } else if (materials.length > 1) {
                  type = 'send_text_material';
                }
              }
            } else if (e.action.type === 'email') {
              if (materials.length === 0) {
                type = 'email';
              } else {
                if (materials.length === 1) {
                  if (videos.length > 0) {
                    type = 'send_email_video';
                  }
                  if (pdfs.length > 0) {
                    type = 'send_email_pdf';
                  }
                  if (images.length > 0) {
                    type = 'send_email_image';
                  }
                } else if (materials.length > 1) {
                  type = 'send_email_material';
                }
              }
            }

            node['type'] = type;
            node['task_type'] = e.action.task_type;
            node['content'] = e.action.content || '';
            node['subject'] = e.action.subject;
            node['description'] = e.action.description || '';
            node['deal_name'] = e.action.deal_name;
            node['deal_stage'] = e.action.deal_stage;
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['appointment'] = e.action.appointment;
            node['due_date'] = e.action.due_date;
            node['timezone'] = e.action.timezone;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action?.videos;
            node['pdfs'] = e.action?.pdfs;
            node['images'] = e.action?.images;
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            if (e.action.commands) {
              node['commands'] = e.action.commands;
            } else {
              node['command'] = e.action.command;
            }
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['attachments'] = e.action.attachments;
            node['audio'] = e.action.audio;
            node['condition_field'] = e.action.condition_field;
            node['contact_conditions'] = e.action.contact_conditions;
            node['status'] = e.status;
            node['period'] = e.period;
            node['error_message'] = e.error_message;
            node['timelines'] = e.timelines;
            node['share_users'] = e.action.share_users;
            node['share_all_member'] = e.action.share_all_member;
            node['round_robin'] = e.action.round_robin;
            node['share_type'] = e.action.share_type;
            node['share_team'] = e.action.share_team;
            node['timelines'] = actions;
            node['automation_line'] =
              e.action.type === 'automation'
                ? e.action.automation_line_id
                : undefined;
            node['parent_automationline'] =
              e.action.type === 'automation'
                ? e.action.automation_line_id
                : undefined;
          }
          nodes.push(node);

          const parentNodeIndex = actions.findIndex(
            (item) => item.id === e.parent
          );
          const parentNode = actions[parentNodeIndex];

          if (parentNode && parentNode.action.type === 'contact_condition') {
            const index = nodes.findIndex(
              (node) =>
                node.parentId === e.parent &&
                JSON.stringify(node.condition.case) ===
                  JSON.stringify(e.condition.case)
            );
            const caseNodeIndex = uuidv4();
            const nodeId = 'a_' + caseNodeIndex;
            const caseNode = {
              type: 'contact_condition',
              condition_field: parentNode.action.condition_field,
              id: nodeId,
              index: caseNodeIndex,
              label: e.condition.case,
              leaf: true,
              category: ACTION_CAT.CONDITION,
              condition: { case: e.condition.case }
            };
            if (index === -1) nodes.push(caseNode);
            const bSource = e.parent;
            const bTarget = index !== -1 ? nodes[index].id : nodeId;
            const target = e.id;
            if (index === -1)
              edges.push({
                id: 'a_' + uuidv4(),
                source: bSource,
                target: bTarget,
                category: 'case',
                answer: caseNode.condition ? caseNode.condition.case : '',
                data: {}
              });
            edges.push({
              id: 'a_' + uuidv4(),
              source: bTarget,
              target: target,
              data: {}
            });
            edgesBranches.push(bSource);
            edgesBranches.push(bTarget);
            if (index === -1) {
              if (caseNodes[bSource]) {
                caseNodes[bSource].push(caseNode);
              } else {
                caseNodes[bSource] = [caseNode];
              }
            }
          } else {
            if (e.condition.answer) {
              const actionCondition = {
                case: e.condition.case,
                answer: true
              };
              if (e.condition.type) {
                actionCondition['type'] = e.condition.type;
              }
              const yesNodeIndex = uuidv4();
              const yesNodeId = 'a_' + yesNodeIndex;
              const yesNode = {
                id: yesNodeId,
                index: yesNodeIndex,
                label: 'YES',
                leaf: false,
                category: ACTION_CAT.CONDITION,
                condition: actionCondition
              };
              nodes.push(yesNode);
              const bSource = e.parent;
              const bTarget = yesNodeId;
              const target = e.id;
              edges.push({
                id: 'a_' + uuidv4(),
                source: bSource,
                target: bTarget,
                category: 'case',
                answer: 'yes',
                data: {
                  category: 'case',
                  answer: 'yes'
                }
              });
              edges.push({
                id: 'a_' + uuidv4(),
                source: bTarget,
                target: target,
                data: {}
              });
              edgesBranches.push(bSource);
              edgesBranches.push(bTarget);
              if (caseNodes[bSource]) {
                caseNodes[bSource].push(yesNode);
              } else {
                caseNodes[bSource] = [yesNode];
              }
            }
            if (!e.condition.answer) {
              const actionCondition = {
                case: e.condition.case,
                percent: e.condition.percent,
                answer: false
              };
              if (e.condition.type) {
                actionCondition['type'] = e.condition.type;
              }
              const noNodeIndex = uuidv4();
              const noNodeId = 'a_' + noNodeIndex;
              const noNode = {
                id: noNodeId,
                index: noNodeIndex,
                label: 'NO',
                leaf: false,
                category: ACTION_CAT.CONDITION,
                condition: actionCondition
              };
              nodes.push(noNode);
              const bSource = e.parent;
              const bTarget = noNodeId;
              const target = e.id;
              edges.push({
                id: 'a_' + uuidv4(),
                source: bSource,
                target: bTarget,
                category: 'case',
                answer: 'no',
                hasLabel: true,
                type: actionCondition.case,
                percent: e.condition.percent,
                data: {
                  category: 'case',
                  answer: 'no',
                  hasLabel: true,
                  type: actionCondition.case,
                  percent: e.condition.percent
                }
              });
              edges.push({
                id: 'a_' + uuidv4(),
                source: bTarget,
                target: target,
                data: {}
              });
              edgesBranches.push(bSource);
              edgesBranches.push(bTarget);
              if (caseNodes[bSource]) {
                caseNodes[bSource].push(noNode);
              } else {
                caseNodes[bSource] = [noNode];
              }
            }
          }
        } else {
          if (
            e.type === 'deal' &&
            e.action.type !== 'deal' &&
            this.automation_type !== 'deal'
          ) {
            node['parent_type'] = 'deal';
          }

          let type = e.action?.type;
          const videos = e.action?.videos ?? [];
          const pdfs = e.action?.pdfs ?? [];
          const images = e.action?.images ?? [];
          const materials = [...videos, ...pdfs, ...images];

          if (e.action.type === 'text') {
            if (materials.length === 0) {
              type = 'text';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_text_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_text_pdf';
                }
                if (images.length > 0) {
                  type = 'send_text_image';
                }
              } else if (materials.length > 1) {
                type = 'send_text_material';
              }
            }
          } else if (e.action.type === 'email') {
            if (materials.length === 0) {
              type = 'email';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_email_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_email_pdf';
                }
                if (images.length > 0) {
                  type = 'send_email_image';
                }
              } else if (materials.length > 1) {
                type = 'send_email_material';
              }
            }
          }

          if (e.action) {
            node['type'] = type;
            node['task_type'] = e.action.task_type;
            node['content'] = e.action.content || '';
            node['subject'] = e.action.subject;
            node['description'] = e.action.description || '';
            node['deal_name'] = e.action.deal_name;
            node['deal_stage'] = e.action.deal_stage;
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['appointment'] = e.action.appointment;
            node['due_date'] = e.action.due_date;
            node['timezone'] = e.action.timezone;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action?.videos;
            node['pdfs'] = e.action?.pdfs;
            node['images'] = e.action?.images;
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            if (e.action.commands) {
              node['commands'] = e.action.commands;
            } else {
              node['command'] = e.action.command;
            }
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['attachments'] = e.action.attachments;
            node['audio'] = e.action.audio;
            node['condition_field'] = e.action.condition_field;
            node['contact_conditions'] = e.action.contact_conditions;
            node['timelines'] = e.timelines;
            node['status'] = e.status;
            node['error_message'] = e.error_message;
            node['period'] = e.period;
            node['share_users'] = e.action.share_users;
            node['share_all_member'] = e.action.share_all_member;
            node['round_robin'] = e.action.round_robin;
            node['share_type'] = e.action.share_type;
            node['share_team'] = e.action.share_team;
            node['timelines'] = actions;
            node['automation_line'] =
              e.action.type === 'automation'
                ? e.action.automation_line_id
                : undefined;
            node['parent_automationline'] =
              e.action.type === 'automation'
                ? e.action.automation_line_id
                : undefined;
          }
          nodes.push(node);
          if (e.parent !== '0') {
            const source = e.parent;
            const target = e.id;
            edges.push({ id: 'a_' + uuidv4(), source, target, data: {} });
            edgesBranches.push(source);
          }
        }

        if (node['type'] === 'contact_condition') {
          let lastIndex = node['index'];

          //make condition branches.
          const contactConditions = node['contact_conditions'];
          for (const condition of contactConditions) {
            const newId = 'a_' + uuidv4();
            const data = {
              ...node,
              parentId: node['id'],
              id: newId,
              index: lastIndex,
              category: ACTION_CAT.CONDITION,
              label: condition,
              leaf: true,
              condition: { case: condition }
            };
            nodes.push(data);
            edges.push({
              id: node['id'] + '_' + newId,
              source: node['id'],
              target: newId,
              category: 'case',
              answer: condition,
              data: {}
            });
            lastIndex = uuidv4();
          }

          //make else contact condition action
          const newId = 'a_' + uuidv4();
          const elseData = {
            ...node,
            parentId: node['id'],
            id: newId,
            index: lastIndex,
            category: ACTION_CAT.CONDITION,
            label: 'else',
            leaf: true,
            condition: { case: 'else' }
          };
          nodes.push(elseData);
          edges.push({
            id: node['id'] + '_' + newId,
            source: node['id'],
            target: newId,
            category: 'case',
            answer: 'else',
            data: {}
          });
        }
      });
    }

    // Uncompleted Case Branch Make
    for (const branch in caseNodes) {
      if (caseNodes[branch].length === 1) {
        const newNodeIndex = uuidv4();

        const newNodeId = 'a_' + newNodeIndex;
        const conditionType = caseNodes[branch][0].condition.case;
        if (caseNodes[branch][0].condition.answer) {
          // Insert False case
          const noNode = {
            id: newNodeId,
            index: newNodeIndex,
            label: 'NO',
            leaf: true,
            condition: { case: conditionType, answer: false },
            category: ACTION_CAT.CONDITION
          };
          nodes.push(noNode);
          const bSource = branch;
          const bTarget = newNodeId;
          edges.push({
            id: 'a_' + uuidv4(),
            source: bSource,
            target: bTarget,
            category: 'case',
            answer: 'no',
            hasLabel: true,
            type: conditionType
          });
        } else {
          // Insert true case
          const yesNode = {
            id: newNodeId,
            index: newNodeIndex,
            label: 'YES',
            leaf: false,
            condition: { case: conditionType, answer: true },
            category: ACTION_CAT.CONDITION
          };
          nodes.push(yesNode);
          const bSource = branch;
          const bTarget = newNodeId;
          edges.push({
            id: 'a_' + uuidv4(),
            source: bSource,
            target: bTarget,
            category: 'case',
            answer: 'yes'
          });
        }
      }
    }
    // Leaf Setting
    nodes.forEach((e) => {
      if (edgesBranches.indexOf(e.id) !== -1 || e.type === 'automation') {
        e.leaf = false;
      } else {
        e.leaf = true;
      }
    });
    this.nodes = [...nodes];
    this.edges = [...edges];

    // disable auto center for flipping issue when add action.
    setTimeout(() => {
      this.autoCenter = false;
      this.autoZoom = false;
      this.center$.next(false);

      //move to active node
      for (const node of this.nodes) {
        if (node.status === 'active') {
          this.panToNode$.next(node.id);
          break;
        }
      }
    }, 500);
  }

  rebuildStatus(): void {
    for (const edge of this.edges) {
      if (edge.source !== 'a_10000' && this.timelines) {
        const index = this.timelines.findIndex(
          (item) => item.ref === edge.source
        );
        if (index < 0) {
          edge.status = 'pending';
        }
      }
    }
  }

  getContactConditionLabel(node): any {
    if (node['condition_field'] === 'automation') {
      const index = this.automations.findIndex(
        (item) => item._id === node.label
      );
      if (index >= 0) {
        return this.automations[index].title;
      } else {
        return '';
      }
    } else if (node['condition_field'] === 'country') {
      const index = this.COUNTRIES.findIndex(
        (item) => item.code === node.label
      );
      if (index >= 0) {
        return this.COUNTRIES[index].name;
      } else {
        return node.label;
      }
    } else if (node['condition_field'] === 'label') {
      const label = this.labels.find((e) => e._id === node.label);
      if (label) return label.name;
      else return '';
    } else if (validateDateTime(node.label)) {
      return moment(node.label).format('MM/DD/YYYY');
    } else {
      return node.label;
    }
  }

  genIndex(id: string): any {
    const idStr = (id + '').replace('a_', '');
    return idStr;
  }

  zoomIn(): void {
    if (this.zoomLevel < 1.5) {
      this.zoomLevel += 0.1;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.4) {
      this.zoomLevel -= 0.1;
    }
  }

  hasMultipleBranch(node): boolean {
    if (this.automation_type === 'deal') {
      if (node) {
        const edges = this.edges.filter((item) => item.source === node.id);
        for (const edge of edges) {
          if (edge.category === 'case') {
            return false;
          }
        }
        if (edges && edges.length >= BRANCH_COUNT) {
          return false;
        } else if (edges && edges.length === 1) {
          return true;
        }
      }
    }
    return false;
  }

  showStatus(node): boolean {
    // if (this.isInherited) {
    //   return true;
    // }
    // if (node && this.timelines.length > 0) {
    //   const index = this.timelines.findIndex((item) => item.ref === node.id);
    //   if (index >= 0) {
    //     return true;
    //   }
    // }
    return true;
  }

  easyView(event: any, node: any, origin: any, content: any): void {
    const matchingAutomation = (this.fullNode?.timelines || []).some(
      (timeline) =>
        node.type === 'automation' &&
        timeline?.automation === node?.automation_id
    );
    if (matchingAutomation) {
      const bodyElement = window.document.body;
      const subSubModalElements =
        bodyElement.getElementsByClassName(`sub-sub-modal active`);
      if (!subSubModalElements.length) {
        const subModalElements =
          bodyElement.getElementsByClassName(`sub-modal active`);
        const mainModalElements = bodyElement.getElementsByClassName(
          `main-automation main-${node?.automation_id}`
        );
        if (subModalElements.length) {
          subModalElements[0].parentElement.style.zIndex = '1000';
          subModalElements[0].classList.remove('active');
        }
        if (mainModalElements.length) {
          mainModalElements[0].parentElement.style.zIndex = '1001';
          mainModalElements[0].classList.add('active');
        }
      } else {
        const subModalElements = bodyElement.getElementsByClassName(
          `sub-modal sub-${node?.automation_id}`
        );
        if (subSubModalElements.length) {
          subSubModalElements[0].parentElement.style.zIndex = '1000';
          subSubModalElements[0].classList.remove('active');
        }
        if (subModalElements.length) {
          subModalElements[0].parentElement.style.zIndex = '1001';
          subModalElements[0].classList.add('active');
        }
      }
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    if (this.disableOverlay) {
      return;
    }

    this.ngZone.run(() => {
      if (node.type === 'automation' && node.status === 'pending') {
        node['no_timelines'] = true;
      }
      this.overlayService
        .openSubOverlay(origin, content, this.viewContainerRef, 'automation', {
          data: node
        })
        .subscribe((res) => {});
    });
  }

  getDuration(duration): string {
    if (duration) {
      if (duration >= 48) {
        const day = Math.floor(duration / 24);
        if (day * 24 == duration) {
          return day + ' Days';
        } else {
          return duration + ' Hours';
        }
      } else {
        return duration + ' Hours';
      }
    } else {
      return 'Immediately';
    }
  }

  getVoicemailInfo(id): any {
    const index = this.rvms.findIndex((item) => item.id === id);
    if (index >= 0) {
      return this.rvms[index];
    } else {
      return null;
    }
  }

  getFormattedCondition(node, condition): any {
    if (node['condition_field'] === 'automation') {
      const index = this.automations.findIndex(
        (item) => item._id === condition
      );
      if (index >= 0) {
        return this.automations[index].title;
      }
    } else if (node['condition_field'] === 'country') {
      const index = this.COUNTRIES.findIndex((item) => item.code === condition);
      if (index >= 0) {
        return this.COUNTRIES[index].name;
      } else {
        return '';
      }
    } else if (node['condition_field'] === 'label') {
      const label = this.labels.find((e) => e._id === condition);
      if (label) return label.name;
      else return '';
    } else if (validateDateTime(condition)) {
      return moment(condition).format('MM/DD/YYYY');
    } else {
      return condition;
    }
  }

  getContactCondition(node): any {
    let index = CONTACT_PROPERTIES.findIndex(
      (item) => item.id === node['condition_field']
    );
    if (index >= 0) {
      return CONTACT_PROPERTIES[index].value;
    }
    index = this.lead_fields.findIndex(
      (item) => item.name === node['condition_field']
    );
    if (index >= 0) {
      return node['condition_field'];
    }
    return '';
  }

  updateFullNodeStatus(status): void {
    const data = {
      type: status
    };
    this.overlayService.close(data);
  }

  isActionCommandEnabled(action, index: number): boolean {
    const COMMANDS = ['update_label', 'push_tag', 'pull_tag'];
    if (!action || !action.commands || !action.content) {
      return false;
    }
    if (
      action.commands[index] === COMMANDS[index] &&
      action.content[index]?.length
    ) {
      return true;
    }
    return false;
  }

  getShareOption(type): string {
    const index = this.sharingOptions.findIndex((item) => item.id === type);
    if (index >= 0) {
      return this.sharingOptions[index].value;
    }
    return '';
  }

  getCommunityTeam(team): string {
    const teams = this.teamService.teams.getValue();
    const index = teams.findIndex((item) => item._id === team);
    if (index >= 0) {
      return teams[index].name;
    }
    return '';
  }

  getMembers(team, users): any {
    const results = [];
    const teams = this.teamService.teams.getValue();
    const index = teams.findIndex((item) => item._id === team);
    if (index >= 0) {
      const selectedTeam = teams[index];
      const members = [];
      for (const owner of selectedTeam.owner) {
        members.push(owner);
      }
      for (const editor of selectedTeam.editors) {
        members.push(editor);
      }
      for (const member of selectedTeam.members) {
        members.push(member);
      }
      for (const user of users) {
        const userIndex = members.findIndex((item) => item._id === user);
        if (userIndex >= 0) {
          results.push(members[userIndex]);
        }
      }
    }
    return results;
  }

  getAvatarName(user): any {
    if (user.user_name) {
      const names = user.user_name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      } else {
        return names[0][0];
      }
    }
    return 'UC';
  }

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    send_email_video: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_video: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
    send_email_pdf: AUTOMATION_ICONS.SEND_PDF_EMAIL,
    send_text_pdf: AUTOMATION_ICONS.SEND_PDF_TEXT,
    send_email_image: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
    send_text_image: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
    update_contact: AUTOMATION_ICONS.UPDATE_CONTACT,
    deal: AUTOMATION_ICONS.NEW_DEAL,
    move_deal: AUTOMATION_ICONS.MOVE_DEAL,
    send_email_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    automation: AUTOMATION_ICONS.AUTOMATION,
    contact_condition: AUTOMATION_ICONS.CONTACT_CONDITION,
    move_contact: AUTOMATION_ICONS.MOVE_CONTACT,
    share_contact: AUTOMATION_ICONS.SHARE_CONTACT
  };
  ACTIONS = {
    follow_up: 'New Task',
    update_follow_up: 'Edit Task',
    note: 'New Note',
    email: 'New Email',
    text: 'New Text',
    send_email_video: 'New Video Email',
    send_text_video: 'New Video Text',
    send_email_pdf: 'New PDF Email',
    send_text_pdf: 'New PDF Text',
    send_email_image: 'New Image Email',
    send_text_image: 'New Image Text',
    update_contact: 'Edit Contact',
    deal: 'New Deal',
    move_deal: 'Move Deal',
    send_email_material: 'New Material Email',
    send_text_material: 'New Material Text',
    automation: 'Automation',
    contact_condition: 'Contact Condition',
    move_contact: 'Contact Move',
    share_contact: 'Contact Share'
  };
  CASE_ACTIONS = {
    watched_video: 'Watched Video?',
    watched_pdf: 'Reviewed PDF?',
    watched_image: 'Reviewed Image?',
    opened_email: 'Opened Email?',
    replied_text: 'Replied Text',
    watched_material: 'Watched Material?',
    task_check: 'Completed task?'
  };
  NEED_CASE_ACTIONS: [
    'email',
    'send_email_video',
    'send_text_video',
    'send_email_pdf',
    'send_text_pdf',
    'send_email_image',
    'send_text_image'
  ];
}
