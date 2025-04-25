import { SspaService } from '../../services/sspa.service';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { ACTION_CAT } from '@constants/variable.constants';
import { DagreNodesOnlyLayout } from '@variables/customDagreNodesOnly';
import { stepRound } from '@variables/customStepCurved';
import { Subject, Subscription } from 'rxjs';
import { Layout } from '@swimlane/ngx-graph';
import { AutomationService } from '@services/automation.service';

@Component({
  selector: 'app-automation-status',
  templateUrl: './automation-status.component.html',
  styleUrls: ['./automation-status.component.scss']
})
export class AutomationStatusComponent implements OnInit, OnDestroy {
  @Output() onClose = new EventEmitter();
  loading = false;
  loadSubscription: Subscription;
  layoutSettings = {
    orientation: 'TB'
  };
  center$: Subject<boolean> = new Subject();
  curve = stepRound;
  public layout: Layout = new DagreNodesOnlyLayout();
  initEdges = [];
  initNodes = [{ id: 'start', label: '' }];
  edges = [];
  nodes = [];
  automation;
  saved = true;
  identity = 1;
  autoZoom = false;
  zoomLevel = 0.8;

  @ViewChild('wrapper') wrapper: ElementRef;
  wrapperWidth = 0;
  wrapperHeight = 0;
  offsetX = 0;
  offsetY = 0;

  constructor(
    private automationService: AutomationService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  loadStatus(contact: string): void {
    if (window.innerWidth < 576) {
      this.zoomLevel = 0.6;
    }

    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.automationService.getContactDetail(contact).subscribe((res) => {
      this.loading = false;
      const actions = res;
      actions.forEach((e) => {
        e.id = e.ref;
        e.parent = e.parent_ref;
      });
      this.composeGraph(actions);
    });
  }

  composeGraph(actions: any): void {
    let maxId = 0;
    const ids = [];
    let missedIds = [];
    const currentIds = [];
    const nodes = [];
    const edges = [];
    const caseNodes = {}; // Case nodes pair : Parent -> Sub case actions
    const edgesBranches = []; // Edge Branches
    if (actions) {
      actions.forEach((e) => {
        const idStr = (e.id + '').replace('a_', '');
        const id = parseInt(idStr);
        if (maxId < id) {
          maxId = id;
        }
        currentIds.push(id);
      });
    }
    for (let i = 1; i <= maxId; i++) {
      ids.push(i);
    }
    missedIds = ids.filter(function (n) {
      return currentIds.indexOf(n) === -1;
    });
    maxId++;
    if (actions) {
      actions.forEach((e) => {
        if (e.condition) {
          const node = {
            id: e.id,
            index: this.genIndex(e.id),
            period: e.period
          };
          if (e.action) {
            node['type'] = e.action.type;
            node['content'] = e.action.content;
            node['subject'] = e.action.subject;
            node['due_date'] = e.action.due_date;
            node['due_duration'] = e.action.due_duration;
            node['video'] = e.action.video;
            node['pdf'] = e.action.pdf;
            node['image'] = e.action.image;
            node['label'] = this.ACTIONS[e.action.type];
            node['category'] = ACTION_CAT.NORMAL;
            node['command'] = e.action.command;
            node['commands'] = e.action.commands;
            node['ref_id'] = e.action.ref_id;
            node['status'] = e.status;
          }
          nodes.push(node);
          let conditionType;
          if (e.watched_video) {
            conditionType = 'watched_video';
          } else if (e.watched_pdf) {
            conditionType = 'watched_pdf';
          } else if (e.watched_image) {
            conditionType = 'watched_image';
          } else {
            conditionType = 'opened_email';
          }
          if (e.condition.answer) {
            let yesNodeIndex = missedIds.splice(-1)[0];
            if (!yesNodeIndex) {
              yesNodeIndex = maxId;
              maxId++;
            }
            const yesNodeId = 'a_' + yesNodeIndex;
            const yesNode = {
              id: yesNodeId,
              index: yesNodeIndex,
              label: 'YES',
              leaf: false,
              category: ACTION_CAT.CONDITION,
              condition: { case: conditionType, answer: true }
            };
            nodes.push(yesNode);
            const bSource = e.parent;
            const bTarget = yesNodeId;
            const target = e.id;
            edges.push({
              id: bSource + '_' + bTarget,
              source: bSource,
              target: bTarget,
              category: 'case',
              answer: 'yes',
              status: e.status
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              status: e.status
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
            let noNodeIndex = missedIds.splice(-1)[0];
            if (!noNodeIndex) {
              noNodeIndex = maxId;
              maxId++;
            }
            const noNodeId = 'a_' + noNodeIndex;
            const noNode = {
              id: noNodeId,
              index: noNodeIndex,
              label: 'NO',
              leaf: false,
              category: ACTION_CAT.CONDITION,
              condition: { case: conditionType, answer: false }
            };
            nodes.push(noNode);
            const bSource = e.parent;
            const bTarget = noNodeId;
            const target = e.id;
            edges.push({
              id: bSource + '_' + bTarget,
              source: bSource,
              target: bTarget,
              category: 'case',
              answer: 'no',
              hasLabel: true,
              type: conditionType,
              status: e.status
            });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              status: e.status
            });
            edgesBranches.push(bSource);
            edgesBranches.push(bTarget);
            if (caseNodes[bSource]) {
              caseNodes[bSource].push(noNode);
            } else {
              caseNodes[bSource] = [noNode];
            }
          }
        } else {
          const node = {
            id: e.id,
            index: this.genIndex(e.id),
            period: e.period
          };
          if (e.action) {
            node['type'] = e.action.type;
            node['content'] = e.action.content;
            node['subject'] = e.action.subject;
            node['due_date'] = e.action.due_date;
            node['due_duration'] = e.action.due_duration;
            node['video'] = e.action.video;
            node['pdf'] = e.action.pdf;
            node['image'] = e.action.image;
            node['label'] = this.ACTIONS[e.action.type];
            node['category'] = ACTION_CAT.NORMAL;
            node['command'] = e.action.command;
            node['commands'] = e.action.commands;
            node['ref_id'] = e.action.ref_id;
            node['status'] = e.status;
          }
          nodes.push(node);
          if (e.parent !== '0') {
            const source = e.parent;
            const target = e.id;
            edges.push({
              id: source + '_' + target,
              source,
              target,
              status: e.status
            });
            edgesBranches.push(source);
          }
        }
      });
    }

    // Uncompleted Case Branch Make
    for (const branch in caseNodes) {
      if (caseNodes[branch].length === 1) {
        let newNodeIndex = missedIds.splice(-1)[0];
        if (!newNodeIndex) {
          newNodeIndex = maxId;
          maxId++;
        }
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
            id: bSource + '_' + bTarget,
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
            id: bSource + '_' + bTarget,
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
      if (edgesBranches.indexOf(e.id) !== -1) {
        e.leaf = false;
      } else {
        e.leaf = true;
      }
    });
    this.identity = maxId;
    this.nodes = [...nodes];
    this.edges = [...edges];
  }

  genIndex(id: string): any {
    const idStr = (id + '').replace('a_', '');
    return parseInt(idStr);
  }

  zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.autoZoom = false;
      this.zoomLevel += 0.2;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.3) {
      this.zoomLevel -= 0.2;
      if (this.zoomLevel === 0) {
        this.autoZoom = true;
      }
    }
  }

  close(): void {
    this.onClose.emit();
  }

  ICONS = {
    follow_up: this.sspaService.toAsset('img/automations/follow_up.svg'),
    update_follow_up: this.sspaService.toAsset('img/automations/follow_up_update.svg'),
    note: this.sspaService.toAsset('img/automations/create_note.svg'),
    email: this.sspaService.toAsset('img/automations/send_email.svg'),
    text: this.sspaService.toAsset('img/automations/send_text.svg'),
    send_email_video: this.sspaService.toAsset('img/automations/send_video_email.svg'),
    send_text_video: this.sspaService.toAsset('img/automations/send_video_text.svg'),
    send_email_pdf: this.sspaService.toAsset('img/automations/send_pdf_email.svg'),
    send_text_pdf: this.sspaService.toAsset('img/automations/send_pdf_text.svg'),
    send_email_image: this.sspaService.toAsset('img/automations/send_image_email.svg'),
    send_text_image: this.sspaService.toAsset('img/automations/send_image_text.svg'),
    update_contact: this.sspaService.toAsset('img/automations/update_contact.svg')
  };
  ACTIONS = {
    follow_up: 'Follow up',
    update_follow_up: 'Update Follow up',
    note: 'Create Note',
    email: 'Send Email',
    send_email_video: 'Send Video Email',
    send_text_video: 'Send Video Text',
    send_email_pdf: 'Send PDF Email',
    send_text_pdf: 'Send PDF Text',
    send_email_image: 'Send Image Email',
    send_text_image: 'Send Image Text',
    update_contact: 'Update Contact'
  };
  CASE_ACTIONS = {
    watched_video: 'Watched Video?',
    watched_pdf: 'Reviewed PDF?',
    watched_image: 'Reviewed Image?',
    opened_email: 'Opened Email?'
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
