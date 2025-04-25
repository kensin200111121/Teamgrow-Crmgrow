import { SspaService } from '../../services/sspa.service';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ACTION_CAT,
  AUTOMATION_ICONS,
  BRANCH_COUNT,
  CONTACT_PROPERTIES
} from '@constants/variable.constants';
import { DagreNodesOnlyLayout } from '@variables/customDagreNodesOnly';
import { stepRound } from '@variables/customStepCurved';
import { AutomationService } from '@services/automation.service';
import { LabelService } from '@services/label.service';
import { ContactService } from '@services/contact.service';
import { OverlayService } from '@services/overlay.service';
import { PageCanDeactivate } from '@variables/abstractors';
import { Subject, Subscription } from 'rxjs';
import { Layout } from '@swimlane/ngx-graph';
import { Automation } from '@models/automation.model';
import { DealsService } from '@services/deals.service';
import { HandlerService } from '@services/handler.service';
import { UserService } from '@services/user.service';
import moment from 'moment-timezone';
import { validateDateTime } from '@utils/functions';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'app-automation-show-full',
  templateUrl: './automation-show-full.component.html',
  styleUrls: ['./automation-show-full.component.scss']
})
export class AutomationShowFullComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy, AfterViewInit
{
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
  autoZoom = false;
  zoomLevel = 0.8;
  autoCenter = true;
  labels = [];

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
  actions = [];

  stages: any[] = [];
  automations: any[] = [];
  lead_fields: any[] = [];
  garbageSubscription: Subscription;
  isCompleted = false;
  isBusinessTime = true;
  COUNTRIES: { code: string; name: string }[] = [];

  constructor(
    private dialogRef: MatDialogRef<AutomationShowFullComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private automationService: AutomationService,
    private overlayService: OverlayService,
    public contactService: ContactService,
    public labelService: LabelService,
    private viewContainerRef: ViewContainerRef,
    private handlerService: HandlerService,
    private userService: UserService,
    public sspaService: SspaService
  ) {
    super();
    if (this.data && this.data.id) {
      this.automation_id = this.data.id;
    }
    if (this.data && this.data.automation) {
      this.automationSummary = new Automation().deserialize(
        this.data.automation
      );
    }
    if (this.data && this.data.timelines) {
      this.timelines = this.data.timelines;
    }
    if (this.data && this.data.type) {
      this.automation_type = this.data.type;
    }
    if (this.data && this.data.isCompleted) {
      this.isCompleted = true;
    }

    this.automationService.automations$.subscribe((res) => {
      this.automations = res;
    });

    this.handlerService.pageName.next('detail');
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
        // this.isBusinessTime = _garbage.business_time.is_enabled;
      }
    );
  }

  ngOnInit(): void {
    this.buildActionsFromTimeline();
    this.composeGraph(this.actions);

    // this.loadData(this.automation_id);
    window['confirmReload'] = true;

    document.body.classList.add('overflow-hidden');
    if (window.innerWidth < 576) {
      this.zoomLevel = 0.6;
    }

    this.COUNTRIES = this.contactService.COUNTRIES;

    this.labelService.allLabels$.subscribe((res) => {
      this.labels = res;
    });
  }

  ngOnDestroy(): void {
    // this.storeData();
    window['confirmReload'] = false;

    document.body.classList.remove('overflow-hidden');
  }

  ngAfterViewInit(): void {
    this.onResize(null);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {
    this.wrapperWidth = this.wrapper.nativeElement.offsetWidth;
  }

  buildActionsFromTimeline(): void {
    if (this.automation_type === 'contact') {
      for (const timeline of this.timelines) {
        const action = {
          _id: timeline._id,
          action: this.getAction(timeline),
          condition: timeline.condition,
          automation: timeline.automation,
          automation_line: timeline?.automation_line,
          id: timeline.ref,
          parent: timeline.parent_ref,
          period: timeline.period,
          status: timeline.status,
          watched_materials: timeline.watched_materials,
          created_at: timeline.created_at,
          updated_at: timeline.updated_at,
          error_message: timeline.error_message,
          type: timeline.action.type,
          timelines: this.timelines
        };
        const automationlineId = timeline.automation_line;
        if (automationlineId) {
          action.id = action.id.replace(`_${automationlineId}`, '');
          action.id = action.id.replace(`${automationlineId}`, 'a_10000');
          action.parent = action.parent.replace(`_${automationlineId}`, '');
          action.parent = action.parent.replace(
            `${automationlineId}`,
            'a_10000'
          );
        }
        if (timeline?.error_array?.error) {
          const error = timeline.error_array.error;
          if (Array.isArray(error)) {
            const errors = (error || []).map((e) => e?.error || 'unknow issue');
            if (errors.length > 0) action['error_message'] = errors.join(',');
          } else {
            action['error_message'] = timeline.error_array.error;
          }
        }
        this.actions.push(action);
      }
      this.actions.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      this.filterContactAutomationActions();
    } else {
      for (const timeline of this.timelines) {
        if (timeline.ref !== 'a_10000') {
          const action = {
            _id: timeline._id,
            action: this.getAction(timeline),
            condition: timeline.condition,
            automation: timeline.automation,
            automation_line: timeline?.automation_line,
            id: timeline.ref,
            parent: timeline.parent_ref,
            period: timeline.period,
            status: timeline.status,
            watched_materials: timeline.watched_materials,
            error_message: timeline.error_message,
            type: timeline.action?.type,
            timelines: this.timelines,
            created_at: timeline.created_at,
            updated_at: timeline.updated_at
          };
          const automationlineId = timeline.automation_line;
          if (automationlineId) {
            action.id = action.id.replace(`_${automationlineId}`, '');
            action.id = action.id.replace(`${automationlineId}`, 'a_10000');
            action.parent = action.parent.replace(`_${automationlineId}`, '');
            action.parent = action.parent.replace(
              `${automationlineId}`,
              'a_10000'
            );
          }
          const errors = (timeline?.error_array?.error || []).map(
            (e) => e?.error || 'unknow issue'
          );
          if (errors.length > 0) action['error_message'] = errors.join(',');
          this.actions.push(action);
        }
      }

      this.actions.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      this.filterContactAutomationActions();
    }
  }

  filterContactAutomationActions(): void {
    // get automation actions.
    const automationTimelines =
      this.timelines.filter(
        (item) =>
          item.action &&
          item.action.type === 'automation' &&
          item.ref.indexOf('a_') < 0
      ) || [];

    for (const timeline of automationTimelines) {
      const actionIndex = this.actions.findIndex(
        (item) => item._id === timeline._id
      );
      if (actionIndex >= 0) {
        this.actions.splice(actionIndex, 1);
      }
    }

    // sort automation timeline
    if (automationTimelines.length > 1) {
      automationTimelines.sort((a, b) =>
        a.created_at < b.created_at ? -1 : 1
      );
    }

    const automationActions = [];
    //make automation actions from automation timeline
    if (automationTimelines.length > 0) {
      this.isInherited = true;
      for (let i = 0; i < automationTimelines.length; i++) {
        let automationAction;
        if (i === 0) {
          automationAction = {
            id: 'a_10000',
            parent: `${automationTimelines[i].parent_ref}`,
            status: automationTimelines[i].status,
            action: automationTimelines[i].action,
            period: automationTimelines[i].period,
            parent_automationline: automationTimelines[i].parent_ref,
            type: automationTimelines[i]?.action?.type,
            timelines: this.timelines
          };
        } else {
          automationAction = {
            parent: `${automationTimelines[i].parent_ref}`,
            id: `${automationTimelines[i].ref}`,
            status: automationTimelines[i].status,
            action: automationTimelines[i].action,
            period: automationTimelines[i].period,
            parent_automationline: automationTimelines[i].parent_ref,
            type: automationTimelines[i]?.action?.type,
            timelines: this.timelines
          };
        }
        automationActions.push(automationAction);

        // reassign parent for prev automation to automation
        const rootIndex = this.actions.findIndex(
          (item) => item.parent === automationTimelines[i].action.automation_id
        );
        if (rootIndex >= 0) {
          this.actions[
            rootIndex
          ].parent = `${automationTimelines[rootIndex].parent_ref}`;
        }
      }
    }
    this.actions = [...this.actions, ...automationActions];
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
            node['automation_line'] =
              e.type === 'automation' ? e.action.automation_line_id : undefined;
            node['parent_automationline'] =
              e.type === 'automation' ? e.parent_automationline : undefined;
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
            node['automation_line'] =
              e.type === 'automation' ? e.action.automation_line_id : undefined;
            node['parent_automationline'] =
              e.type === 'automation' ? e.parent_automationline : '';
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
      let branchType;
      const nodeIndex = nodes.findIndex((item) => item.id === branch);
      if (nodeIndex >= 0) {
        branchType = nodes[nodeIndex].type;
      }

      if (branchType === 'contact_condition') {
        // uncompleted contact condition branch
        const branchNode = nodes[nodeIndex];
        const uncompletedConditions = [];
        for (const condition of branchNode?.contact_conditions) {
          const index = caseNodes[branch].findIndex(
            (item) => item.condition?.case === condition
          );
          if (index < 0) {
            uncompletedConditions.push(condition);
          }
        }

        if (
          caseNodes[branch].findIndex(
            (item) => item.condition && item.condition.case === 'else'
          ) < 0
        ) {
          uncompletedConditions.push('else');
        }

        for (const condition of uncompletedConditions) {
          const caseNodeIndex = uuidv4();
          const nodeId = 'a_' + caseNodeIndex;
          const caseNode = {
            type: 'contact_condition',
            condition_field: branchNode.condition_field,
            id: nodeId,
            index: caseNodeIndex,
            label: condition,
            leaf: true,
            category: ACTION_CAT.CONDITION,
            condition: { case: condition }
          };
          nodes.push(caseNode);
          const bSource = branch;
          const bTarget = nodeId;
          edges.push({
            id: 'a_' + uuidv4(),
            source: bSource,
            target: bTarget,
            category: 'case',
            answer: condition,
            data: {}
          });
        }
      } else {
        // uncompleted case branch
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
              condition: {
                case: conditionType,
                answer: false
              },
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
              type: conditionType,
              data: {
                category: 'case',
                answer: 'no',
                hasLabel: true,
                type: conditionType,
                percent: caseNodes[branch][0].condition.percent
              }
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
              answer: 'yes',
              data: {
                category: 'case',
                answer: 'yes',
                hasLabel: true,
                type: conditionType,
                percent: caseNodes[branch][0].condition.percent
              }
            });
          }
        }
      }
    }

    // Leaf Setting
    nodes.forEach((e) => {
      if (
        edgesBranches.indexOf(e.id) !== -1 ||
        e.type === 'automation' ||
        e.type === 'deal' ||
        e.type === 'move_deal' ||
        (e.type === 'contact_condition' && e.category === 'NORMAL')
      ) {
        e.leaf = false;
      } else {
        e.leaf = true;
      }
    });
    this.nodes = [...nodes];
    const nwEdges = edges.filter(
      (edge) =>
        nodes.findIndex((_node) => _node.id == edge.source) > -1 &&
        nodes.findIndex((_node) => _node.id == edge.target) > -1
    );
    this.edges = [...nwEdges];
    this.rebuildStatus();

    // disable auto center for flipping issue when add action.
    setTimeout(() => {
      this.autoCenter = false;
      this.autoZoom = false;
      this.center$.next(false);
    }, 500);
  }

  rebuildStatus(): void {
    if (this.timelines) {
      for (const edge of this.edges) {
        if (edge.target !== 'a_10000') {
          const index = this.timelines.findIndex(
            (item) => this.getTimelineRef(item) === edge.target
          );
          if (index < 0) {
            if (edge.category === 'case') {
              const childEdgeIndex = this.edges.findIndex(
                (item) => item.source == edge.target
              );
              if (childEdgeIndex >= 0) {
                const timelineIndex = this.timelines.findIndex(
                  (item) =>
                    this.getTimelineRef(item) ==
                    this.edges[childEdgeIndex].target
                );
                if (timelineIndex >= 0) {
                  edge.status = this.timelines[timelineIndex].status;
                } else {
                  edge.status = 'pending';
                }
              } else {
                edge.status = 'pending';
              }
            } else {
              edge.status = 'pending';
            }
          } else {
            edge.status = this.timelines[index].status
              ? this.timelines[index].status
              : 'pending';
          }
        }
      }
    }
  }

  getTimelineRef(timeline): any {
    if (timeline && timeline.automation) {
      return timeline.ref.replace('_' + timeline.automation, '');
    }
    return timeline.ref;
  }

  genIndex(id: string): any {
    const idStr = (id + '').replace('a_', '');
    return idStr;
  }

  easyView(node: any, origin: any, content: any): void {
    const bodyElement = window.document.body;
    const subModalElements = bodyElement.getElementsByClassName(
      `sub-modal sub-${node?.automation_id}`
    );
    const mainModalElements = bodyElement.getElementsByClassName(
      `main-automation active`
    );
    if (mainModalElements.length && subModalElements.length) {
      mainModalElements[0].parentElement.style.zIndex = '1000';
      mainModalElements[0].classList.remove('active');
    }
    if (subModalElements.length) {
      subModalElements[0].parentElement.style.zIndex = '1001';
      subModalElements[0].classList.add('active');
    }
    this.overlayService.open(
      origin,
      content,
      this.viewContainerRef,
      'automation-over',
      {
        data: node
      }
    );
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

  showStatus(node): boolean {
    return true;
    // if (this.isInherited) {
    //   return true;
    // }
    // if (node && this.timelines.length > 0) {
    //   const index = this.timelines.findIndex((item) => item.ref === node.id);
    //   if (index >= 0) {
    //     return true;
    //   }
    // }
    // return false;
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

  getAction(timeline): any {
    if (this.isCompleted) {
      if (timeline.activity) {
        const activity = timeline.activity;
        if (
          timeline.action &&
          (timeline.action.type === 'follow_up' ||
            timeline.action.type === 'update_follow_up')
        ) {
          if (activity.follow_ups) {
            timeline.action = {
              ...activity.follow_ups,
              type: timeline.action.type,
              task_type: activity.follow_ups.type,
              due_duration: moment(activity.follow_ups.due_duration).diff(
                moment(activity.follow_ups.updated_at),
                'hours'
              )
            };
          }
        } else if (timeline.action && timeline.action.type === 'note') {
          if (activity.notes) {
            timeline.action = {
              ...activity.notes,
              type: 'note'
            };
          }
        } else if (timeline.action && timeline.action.type === 'deal') {
          if (activity.deals) {
            timeline.action = {
              deal_name: activity.deals.title,
              deal_stage: activity.deal_stages._id,
              type: 'deal'
            };
          }
        } else {
          if (activity.texts) {
            timeline.action = {
              ...activity.texts,
              type: timeline.action.type
            };
          }
        }
      }
      // const automationActions = this.automationSummary.automations;
      // const index = automationActions.findIndex((item) => item.parent === timeline.parent_ref && item.id === timeline.ref);
      // if (index >= 0) {
      //   return automationActions[index].action;
      // }
      // return {};
    }
    return timeline.action;
  }

  getActionStatus(status): string {
    if (this.isCompleted) {
      if (status === 'progress') {
        return 'completed';
      }
    }
    return status;
  }

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    audio: AUTOMATION_ICONS.SEND_AUDIO,
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
    task_check: 'Completed Task?'
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
