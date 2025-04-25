import {
  Component,
  OnInit,
  Input,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  ViewContainerRef,
  Output,
  EventEmitter
} from '@angular/core';
import { Automation } from '@models/automation.model';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Subscription } from 'rxjs';
import { UserService } from '@app/services/user.service';
import { ContactService } from '@app/services/contact.service';
import { listToTree } from '@app/helper';
import { Timeline } from '@models/timeline.model';
import { DatetimeFormatPipe } from '@pipes/datetime-format.pipe';
import {
  ActionName,
  AUTOMATION_ICONS,
  DialogSettings
} from '@constants/variable.constants';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Contact } from '@models/contact.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { ConfirmBusinessComponent } from '@app/components/confirm-business-hour/confirm-business-hour.component';
import { AutomationService } from '@app/services/automation.service';
import { AutomationShowFullComponent } from '@app/components/automation-show-full/automation-show-full.component';
import { OverlayService } from '@app/services/overlay.service';
import { finalize } from 'rxjs/operators';
import { ResetDateTimeComponent } from '@app/components/reset-date-time/reset-date-time.component';
import * as _ from 'lodash';
import moment from 'moment-timezone';
import { SspaService } from '@app/services/sspa.service';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';

@Component({
  selector: 'app-contact-active-timeline',
  templateUrl: './contact-active-timeline.component.html',
  styleUrls: ['./contact-active-timeline.component.scss']
})
export class ContactActiveTimelineComponent implements OnInit {
  @Output() onAssignAutomation = new EventEmitter();

  @Input() contactId = '';
  @Input() contactMainInfo = new Contact(); // contact main informations;
  // Variables for the package enable
  isPackageAutomation = true;
  isPackageGroupEmail = true;
  isPackageText = true;
  isPackageDialer = true;

  selectedAutomation = '';

  canceling = false;
  assigning = false;

  // Variables for automation timeline
  allContactDataSources = [];
  dataContactSources = [];
  allDealDataSource = [];
  dataDealSource = [];
  @ViewChild('closeContactAutomation') closeContactAutomation: ElementRef;

  userSubscription: Subscription;
  loadTimelineSubscription: Subscription;
  cancelSubscription: Subscription;
  updateTimelineSubscription: Subscription;

  treeControl = new NestedTreeControl<any>((node) => node.children);
  timelines;
  activeRoot: any;
  activePrevRoot: any;
  timelineActivities = [];
  ActionName = ActionName;
  DueDateTimeFormat = 'MMM DD YYYY, hh:mm a';
  hasChild = (_: number, node: any) =>
    !!node.children && node.children.length > 0;

  isBusinessTime = true;
  isUpdatingTimeline = false;
  updatingTimeline = null;

  //manage timeline
  actions = [];
  nodes = [];
  materials = [];
  automations: Automation[] = [];
  automationUnAssigned = true;
  // ICONS List
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
    root: AUTOMATION_ICONS.DEAL_ROOT,
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
    audio: 'New Ringless VM',
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

  constructor(
    public userService: UserService,
    public contactService: ContactService,
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private automationService: AutomationService,
    private overlayService: OverlayService,
    private viewContainerRef: ViewContainerRef,
    public sspaService: SspaService,
    protected contactDetailInfoService: ContactDetailInfoService
  ) {
    this.userSubscription && this.userSubscription.unsubscribe();
    this.userSubscription = this.userService.profile$.subscribe((profile) => {
      if (profile?._id) {
        this.userSubscription && this.userSubscription.unsubscribe();
        if (this.contactId) {
          this.loadTimeline(this.contactId);
        }
      }
    });
  }

  ngOnInit(): void {
    this.contactDetailInfoService.timelineRefresh$.subscribe(() => {
      this.loadTimeline(this.contactId);
    });
  }

  ngOnChanges(): void {
    this.loadTimeline(this.contactId);
  }

  /*****************************************
   * Automation Select & Display
   *****************************************/
  /**
   * Select Automation To assign
   * @param evt :Automation
   */
  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt._id;
  }

  loadTimeline(_id: string): void {
    this.loadTimelineSubscription &&
      this.loadTimelineSubscription.unsubscribe();
    this.loadTimelineSubscription = this.contactService
      .loadTimeline(_id)
      .subscribe((res) => {
        if (res) {
          this.timelines = res;
          this.timeLineArrangement();
          this.generateTimelineActivity();
        }
      });
  }

  timeLineArrangement(): any {
    this.allContactDataSources = [];
    this.allDealDataSource = [];
    this.dataContactSources = [];

    if (!this.timelines) {
      this.changeDetector.markForCheck();
      return;
    }

    if (
      this.timelines['contact_automation_lines'] &&
      this.timelines['contact_automation_lines'].length > 0
    ) {
      // this.allContactDataSource = new MatTreeNestedDataSource<any>();
      for (const contact_automation_line of this.timelines[
        'contact_automation_lines'
      ]) {
        const allContactDataSource = {
          data: []
        };
        this.remakeTimeLines(contact_automation_line['timelines']);
        const curTimeLine = contact_automation_line['timelines'].map((it) => {
          const automationlineId = it.automation_line;
          if (automationlineId) {
            it.ref = it.ref.replace(`_${automationlineId}`, '');
            it.ref = it.ref.replace(`${automationlineId}`, 'a_10000');
            it.parent_ref = it.parent_ref.replace(`_${automationlineId}`, '');
            it.parent_ref = it.parent_ref.replace(
              `${automationlineId}`,
              'a_10000'
            );
          }
          return it;
        });

        const contactAutomationTree = listToTree(curTimeLine) || [];

        let root = null;
        if (contactAutomationTree.length > 0) {
          allContactDataSource.data = contactAutomationTree;
          root = JSON.parse(JSON.stringify(allContactDataSource.data[0]));
          const rootNode = { ...root };
          this.activeRoot = null;
          this.activePrevRoot = null;

          // get status = 'active' first action and set it to root
          this.getActiveRoot(rootNode);

          // if nothing status = 'active', get status = 'checking' first action and set it to root
          if (!this.activeRoot) {
            this.getCheckingRoot(rootNode);
          }

          let activeRoot = null;
          if (this.activeRoot) {
            activeRoot = { ...this.activeRoot };
          } else {
            activeRoot = { ...root };
          }
          const activePrevRoot = { ...this.activePrevRoot };
          if (activePrevRoot && Object.keys(activePrevRoot).length > 0) {
            activeRoot = { ...activePrevRoot };
          }

          if (activeRoot) {
            for (const firstChild of activeRoot.children) {
              for (const secondChild of firstChild.children) {
                secondChild.children = [];
              }
            }

            const dataContactSource = new MatTreeNestedDataSource<any>();
            dataContactSource.data.push(activeRoot);
            this.dataContactSources.push(dataContactSource);
            this.allContactDataSources.push(allContactDataSource);
          }
        }
      }
    } else {
      this.allContactDataSources = [];
      this.automationUnAssigned = true;
    }

    this.changeDetector.markForCheck();
  }

  generateTimelineActivity(): void {
    if (!this.timelines) {
      return;
    }
    this.timelineActivities = [];
    if (
      this.timelines['contact_automation_lines'] &&
      this.timelines['contact_automation_lines'].length > 0
    ) {
      const contactAutomation = this.timelines['contact_automation'];
      const contactTimelines = this.timelines['contact_automation_lines'];
      const activeIndex = contactTimelines.findIndex(
        (item) => item.status === 'active'
      );
      if (activeIndex >= 0) {
        const activeAction = contactTimelines[activeIndex];
        const datetimeFormatPipe = new DatetimeFormatPipe();
        const actionTime = datetimeFormatPipe.transform(activeAction.due_date);
        this.timelineActivities.push({
          type: 'Contact Automation',
          automation: contactAutomation,
          actions: [
            {
              label: activeAction.action.label,
              time: actionTime
            }
          ]
        });
      }
    }
    if (
      this.timelines['deal_automation_lines'] &&
      this.timelines['deal_automation_lines'].length > 0
    ) {
      for (const dealTimeline of this.timelines['deal_automation_lines']) {
        const dealAutomation = dealTimeline.automation;
        const timelines = dealTimeline.timeline;
        const activeActions = timelines.filter(
          (item) => item.status === 'active'
        );
        if (activeActions.length > 0) {
          const actions = [];
          for (const activeAction of activeActions) {
            const datetimeFormatPipe = new DatetimeFormatPipe();
            const actionTime = datetimeFormatPipe.transform(
              activeAction.due_date
            );
            actions.push({
              label: activeAction.action?.label,
              time: actionTime
            });
          }
          this.timelineActivities.push({
            type: 'Deal Automation',
            automation: dealAutomation,
            actions: actions
          });
        }
      }
    }
  }

  remakeTimeLines(timelines): void {
    if (timelines && timelines.length > 0) {
      for (const e of timelines) {
        if (e.action) {
          let type = e.action.type;
          const videos = e.action.videos ? e.action.videos : [];
          const pdfs = e.action.pdfs ? e.action.pdfs : [];
          const images = e.action.images ? e.action.images : [];
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
          e.action.type = type;
          e.action.label = this.ActionName[type];
        }
      }
    }
  }

  getActiveRoot(root, parent = null): void {
    if (
      root.status === 'progress' ||
      root.status === 'active' ||
      root.status === 'paused' ||
      root.status === 'executed' ||
      root.status === 'checking'
    ) {
      if (this.activeRoot) {
        if (new Date(this.activeRoot.updated_at) < new Date(root.updated_at)) {
          this.activeRoot = { ...root };
          if (parent) {
            this.activePrevRoot = { ...parent };
          }
        }
      } else {
        this.activeRoot = { ...root };
        if (parent) {
          this.activePrevRoot = { ...parent };
        }
      }
    }
    if (root.children && root.children.length > 0) {
      for (const child of root.children) {
        this.getActiveRoot(child, root);
      }
    }
  }

  getCheckingRoot(root, parent = null): void {
    if (root.status === 'checking') {
      if (this.activeRoot) {
        if (new Date(this.activeRoot.updated_at) < new Date(root.updated_at)) {
          this.activeRoot = { ...root };
          if (parent) {
            this.activePrevRoot = { ...parent };
          }
        }
      } else {
        this.activeRoot = { ...root };
        if (parent) {
          this.activePrevRoot = { ...parent };
        }
      }
    }
    if (root.children && root.children.length > 0) {
      for (const child of root.children) {
        this.getCheckingRoot(child, root);
      }
    }
  }

  activeActionsCount(index): number {
    const timelines =
      this.timelines?.['deal_automation_lines']?.[index]?.['timeline'] || [];
    try {
      const count = (timelines || []).filter(
        (item) => item.status === 'active'
      ).length;
      return count;
    } catch (_) {
      return 0;
    }
  }

  isBranchNode(node): boolean {
    for (const dealTimeline of this.timelines['deal_automation_lines']) {
      const timeline = dealTimeline.timeline;
      if (node && timeline.length > 0) {
        const siblingNodes = [];
        for (const item of timeline) {
          if (item.parent_ref === node.parent_ref) {
            siblingNodes.push(item);
          }
        }
        if (siblingNodes.length >= 2 && !node.condition) {
          return true;
        }
      }
    }
    return false;
  }

  assignAutomation(automation: any): void {
    const allContactDataSource = {
      data: []
    };
    if (!this.selectedAutomation) {
      return;
    }
    if (!this.contactMainInfo._id) {
      return;
    }
    if (allContactDataSource.data.length) {
      const flag = this.getConfirmedAutomationBusinessHour();
      if (!flag && this.isBusinessTime) {
        this.dialog
          .open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            data: {
              title: 'Reassign new automation',
              message:
                'Are you sure to stop the current automation and start new automation?',
              cancelLabel: 'Cancel',
              confirmLabel: 'Assign'
            }
          })
          .afterClosed()
          .subscribe((status) => {
            if (status) {
              this.dialog
                .open(ConfirmBusinessComponent, {
                  maxWidth: '500px',
                  width: '96vw',
                  data: {
                    title: 'Confirm',
                    message:
                      'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
                    cancelLabel: 'Cancel',
                    confirmLabel: 'Ok'
                  }
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    if (res.notShow) {
                      this.updateConfirmAutomationBusinessHour();
                    }
                    this._assignAutomation();
                  }
                });
            }
          });
      } else {
        this.dialog
          .open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            data: {
              title: 'Reassign new automation',
              message:
                'Are you sure to stop the current automation and start new automation?',
              cancelLabel: 'Cancel',
              confirmLabel: 'Assign'
            }
          })
          .afterClosed()
          .subscribe((status) => {
            if (status) {
              this._assignAutomation();
            }
          });
      }
    } else {
      const flag = this.getConfirmedAutomationBusinessHour();
      if (!flag && this.isBusinessTime) {
        this.dialog
          .open(ConfirmBusinessComponent, {
            maxWidth: '500px',
            width: '96vw',
            data: {
              title: 'Confirm Business Hour',
              message:
                'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
              cancelLabel: 'Cancel',
              confirmLabel: 'Ok'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              if (res.notShow) {
                this.updateConfirmAutomationBusinessHour();
              }
              this._assignAutomation();
            }
          });
      } else {
        this._assignAutomation();
      }
    }
  }

  _assignAutomation(): void {
    this.assigning = true;
    // this.assignSubscription && this.assignSubscription.unsubscribe();
    this.automationService
      .bulkAssign(this.selectedAutomation, [this.contactMainInfo._id], null)
      .subscribe((res) => {
        this.assigning = false;
        this.loadTimeline(this.contactId);
        this.changeDetector.markForCheck();
        this.automationUnAssigned = false;
        this.onAssignAutomation.emit();
      });
  }

  closeAutomation(): void {
    if (!this.allContactDataSources.length) {
      return;
    }
    if (!this.contactMainInfo._id) {
      return;
    }
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '400px',
        width: '96vw',
        data: {
          title: 'Unassign automation',
          message: 'Are you sure to stop the automation?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Unassign'
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.canceling = true;
          this.cancelSubscription && this.cancelSubscription.unsubscribe();
          this.automationService
            .unAssign(this.contactMainInfo._id)
            .subscribe((status) => {
              this.canceling = false;
              if (status) {
                this.loadTimeline(this.contactId);
                this.changeDetector.markForCheck();
                this.automationUnAssigned = true;
              }
            });
        }
      });
  }

  getConfirmedAutomationBusinessHour(): boolean {
    const garbage = this.userService.garbage.getValue();
    if (garbage.confirm_message) {
      return garbage.confirm_message.automation_business_hour;
    }
    return false;
  }

  updateConfirmAutomationBusinessHour(): void {
    const garbage = this.userService.garbage.getValue();
    const data = {
      ...garbage.confirm_message,
      automation_business_hour: true
    };
    this.userService.updateGarbage({ confirm_message: data }).subscribe(() => {
      this.userService.updateGarbageImpl({
        confirm_message: data
      });
    });
  }

  showFullAutomation(type, index = 0): void {
    let automationLineId;
    let timelines;
    if (type === 'contact') {
      automationLineId =
        this.timelines['contact_automation_lines'][index]['_id'];
      timelines =
        this.timelines['contact_automation_lines'][index]['timelines'];
    } else {
      automationLineId =
        this.timelines['deal_automation_lines'][index]['timeline'][1][
          'automation_line'
        ];
      timelines = this.timelines['deal_automation_lines'][index]['timeline'];
    }
    const automationId =
      timelines && timelines.length > 0 ? timelines[0]?.automation : '';

    this.automationService
      .loadAutomationTimelines(automationLineId)
      .subscribe((res) => {
        if (res) {
          const automation = res;
          if (type === 'contact') {
            this.timelines['contact_automation_lines'][index]['timelines'] =
              automation['timelines'];
          } else {
            this.timelines['deal_automation_lines'][index]['timeline'] =
              automation['timelines'];
          }
          this.timeLineArrangement();
          this.dialog.open(AutomationShowFullComponent, {
            position: { top: '100px' },
            width: '98vw',
            maxWidth: '900px',
            height: 'calc(65vh + 70px)',
            panelClass: [
              'main-automation',
              automationId ? `main-${automationId}` : '',
              'active'
            ],
            data: {
              id: automation['_id'],
              automation: automation,
              timelines: automation['timelines'],
              type: type
            }
          });
        }
      });
  }

  easyView(node: any, origin: any, content: any): void {
    this.overlayService
      .open(origin, content, this.viewContainerRef, 'automation-timeline', {
        data: node
      })
      .subscribe((res) => {
        if (res) {
          if (res.type === 'paused') {
            this.pauseTimeline(node);
          } else if (res.type === 'forward') {
            this.forwardTimeline(node);
          } else if (res.type === 'restart') {
            this.resetTimelineDueDate(node, 'restart');
          } else if (res.type === 'revise') {
            this.resetTimelineDueDate(node, 'revise');
          }
        }
      });
  }

  pauseTimeline(node): void {
    this.updatingTimeline = node;
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Pause Automation',
          message: 'Are you sure to pause this upcoming action indefinitely?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isUpdatingTimeline = true;
          this.changeDetector.markForCheck();
          const data = {
            ids: [node._id],
            status: 'paused'
          };
          this.updateTimelineSubscription?.unsubscribe();
          this.updateTimelineSubscription = this.automationService
            .updateTimelineStatus(data)
            .pipe(
              finalize(() => {
                this.isUpdatingTimeline = false;
                this.changeDetector.markForCheck();
              })
            )
            .subscribe((result) => {
              if (result) {
                node = { ...result.data[0], status: 'paused' };
                this.updateActionTimeline(node);
                this.timeLineArrangement();
              }
            });
        }
      });
  }

  forwardTimeline(node): void {
    this.updatingTimeline = node;
    this.isUpdatingTimeline = true;
    this.changeDetector.markForCheck();
    const data = {
      ids: [node._id],
      due_date: moment().add(1, 'minutes'),
      disable_business_time: true
    };
    this.updateTimelineSubscription?.unsubscribe();
    this.updateTimelineSubscription = this.automationService
      .updateTimelineStatus(data)
      .pipe(
        finalize(() => {
          this.isUpdatingTimeline = false;
          this.changeDetector.markForCheck();
        })
      )
      .subscribe((result) => {
        if (result) {
          node = { ...result.data[0] };
          this.updateActionTimeline(node);
          this.timeLineArrangement();
        }
      });
  }

  resetTimelineDueDate(node, type): void {
    this.dialog
      .open(ResetDateTimeComponent, {
        ...DialogSettings.NOTE,
        data: {
          title: 'Set Date&Time',
          dateTime: node.due_date
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isUpdatingTimeline = true;
          this.updatingTimeline = node;
          this.changeDetector.markForCheck();
          const data = {
            ids: [node._id],
            due_date: res.due_date
          };
          if (type == 'restart') {
            data['status'] = 'active';
          }
          this.updateTimelineSubscription?.unsubscribe();
          this.updateTimelineSubscription = this.automationService
            .updateTimelineStatus(data)
            .pipe(
              finalize(() => {
                this.isUpdatingTimeline = false;
                this.changeDetector.markForCheck();
              })
            )
            .subscribe((result) => {
              if (result?.status) {
                node = { ...result.data[0] };
                this.updateActionTimeline(node);
                this.timeLineArrangement();
              }
            });
        }
      });
  }

  updateActionTimeline(timeline): void {
    if (this.timelines['contact_automation_lines'].length > 0) {
      const index = this.timelines[
        'contact_automation_lines'
      ][0].timelines.findIndex((item) => item._id === timeline._id);
      if (index >= 0) {
        this.timelines['contact_automation_lines'][0].timelines[index] = {
          ...timeline
        };
      }
    }
    if (this.timelines['deal_automation_lines'].length > 0) {
      for (const timelines of this.timelines['deal_automation_lines']) {
        const index = timelines.timeline.findIndex(
          (item) => item._id === timeline._id
        );
        if (index >= 0) {
          timelines.splice(index, 1, timeline);
          return;
        }
      }
    }
  }
}
