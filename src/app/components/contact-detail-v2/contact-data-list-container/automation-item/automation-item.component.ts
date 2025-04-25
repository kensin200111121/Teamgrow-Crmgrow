import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Output,
  ViewContainerRef,
  EventEmitter
} from '@angular/core';
import {
  ActionName,
  AUTOMATION_ICONS,
  DialogSettings
} from '@constants/variable.constants';
import { AutomationShowFullComponent } from '@components/automation-show-full/automation-show-full.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { AutomationService } from '@app/services/automation.service';
import { finalize, Subscription } from 'rxjs';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { OverlayService } from '@app/services/overlay.service';
import { ResetDateTimeComponent } from '@app/components/reset-date-time/reset-date-time.component';
import moment from 'moment-timezone';

@Component({
  selector: 'app-automation-item',
  templateUrl: './automation-item.component.html',
  styleUrls: ['./automation-item.component.scss']
})
export class AutomationItemComponent implements OnInit {
  data: any[] = [];
  @Input() contactId = '';
  initLoading = true;

  @Input() set setInitLoading(val) {
    this.initLoading = val;
  }
  siteURL = environment.website;

  @Input() set setData(val) {
    this.data = val;
    this.initAutomations();
  }

  @Output() onUpdateAutomationCount: EventEmitter<string[]> =
    new EventEmitter();
  cancelSubscription: Subscription;
  DueDateTimeFormat = 'MMM DD YYYY, hh:mm a';
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
  ActionName = ActionName;

  isUpdatingTimeline = false;
  updatingTimeline = null;

  updateTimelineSubscription: Subscription;
  processTimelineSubscription: Subscription;
  constructor(
    private dialog: MatDialog,
    private automationService: AutomationService,
    private toast: ToastrService,
    private overlayService: OverlayService,
    private viewContainerRef: ViewContainerRef,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  initAutomations() {
    this.data.map((item: any) => {
      item['automationId'] = item.timelines?.[0]?.['automation'];
      item['displayTimelines'] = this.sortItems(item.timelines);
      item['isExpanded'] = false;
    });
  }

  handleExpand(_id: string) {
    this.data.map((item) => {
      if (item._id === _id) item.isExpanded = !item.isExpanded;
      else item.isExpanded = false;
    });
  }

  showFullAutomation(automation: any, type: string) {
    const automationId = automation._id;
    this.dialog.open(AutomationShowFullComponent, {
      position: { top: '100px' },
      width: '98vw',
      maxWidth: '900px',
      height: 'calc(60vh + 70px)',
      panelClass: ['main-automation', `main-${automationId}`, 'active'],
      data: {
        id: automationId,
        automation: automation,
        timelines: automation['timelines'],
        type: type
      }
    });
  }

  sortItems(data: any[]): any[] {
    const sortedArray: any[] = [];
    let activeItem;
    data.map((item) => {
      if (item.status === 'active' || item.status === 'checking')
        activeItem = item;
    });
    if (!activeItem) {
      data.sort((a, b) =>
        new Date(a.due_date).getTime() < new Date(b.due_date).getTime() ? -1 : 1
      );
      activeItem = data[0];
    }
    const nextItems: any[] = [];
    let prevItem: any;
    data.forEach((item: any) => {
      if (item.parent_ref === activeItem.ref) nextItems.push(item);
      if (item.ref === activeItem.parent_ref) prevItem = item;
    });

    if (prevItem) sortedArray.push(prevItem);
    sortedArray.push(activeItem);
    if (nextItems.length > 0) {
      if (nextItems.length === 1) sortedArray.push(nextItems[0]);
      else if (nextItems.length > 1) {
        sortedArray.push(nextItems[0]);
        sortedArray.push(nextItems[1]);
      }
    }

    return sortedArray;
  }

  closeAutomation(automation: any): void {
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
          if (automation?.deal) {
            this.dialog
              .open(ConfirmComponent, {
                maxWidth: '400px',
                width: '96vw',
                data: {
                  title: 'Unassign automation',
                  message:
                    'Are you want to exclude only this contact from this deal automation? or stop this deal automation?',
                  cancelLabel: 'No, Stop',
                  confirmLabel: 'Yes, Exclude'
                }
              })
              .afterClosed()
              .subscribe((result) => {
                console.log('result: ', result);
                const isOnly = result ? true : false;
                this.cancelSubscription &&
                  this.cancelSubscription.unsubscribe();
                this.automationService
                  .unAssign(
                    automation.timelines[0].automation_line,
                    automation?.deal,
                    isOnly,
                    this.contactId
                  )
                  .subscribe((res) => {
                    if (res) {
                      this.toast.success('Unassigned automation successfully');
                      this.data = this.data.filter(
                        (item) => item?._id !== automation._id
                      );
                      this.onUpdateAutomationCount.emit(this.data);
                    }
                  });
              });
          } else {
            this.cancelSubscription && this.cancelSubscription.unsubscribe();
            this.automationService
              .unAssign(automation._id)
              .subscribe((status) => {
                if (status) {
                  this.toast.success('Unassigned automation successfully');
                  this.data = this.data.filter(
                    (item) => item?._id !== automation._id
                  );
                  this.onUpdateAutomationCount.emit(this.data);
                }
              });
          }
        }
      });
  }

  closeDealAutomation(dealId: string): void {
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
          this.cancelSubscription && this.cancelSubscription.unsubscribe();
          this.automationService.unAssignDeal(dealId).subscribe((res) => {
            if (res) {
              this.data.pop();
              this.onUpdateAutomationCount.emit(this.data);
            }
          });
        }
      });
  }

  getActionType(_item: any): string {
    let type = _item.action?.type;
    const videos = _item.action.videos ? _item.action.videos : [];
    const pdfs = _item.action.pdfs ? _item.action.pdfs : [];
    const images = _item.action.images ? _item.action.images : [];
    const materials = [...videos, ...pdfs, ...images];

    if (_item.action.type === 'text') {
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
    } else if (_item.action.type === 'email') {
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
    return type;
  }

  easyView(node: any, origin: any, content: any): void {
    this.overlayService
      .open(
        origin,
        content,
        this.viewContainerRef,
        'automation-timeline',
        {
          data: node
        },
        ['timeline-overlay']
      )
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

  private pauseTimeline(node): void {
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
              }
            });
        }
      });
  }

  private forwardTimeline(node): void {
    this.updatingTimeline = node;
    this.isUpdatingTimeline = true;
    this.changeDetector.markForCheck();
    const data = {
      timeline_ids: [node._id]
    };
    this.processTimelineSubscription?.unsubscribe();
    this.processTimelineSubscription = this.automationService
      .processTimeline(data)
      .pipe(
        finalize(() => {
          this.isUpdatingTimeline = false;
          this.changeDetector.markForCheck();
        })
      )
      .subscribe((result) => {
        if (result) {
          this.toast.success('Process timeline successfully');
        }
      });
  }

  private resetTimelineDueDate(node, type): void {
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
              }
            });
        }
      });
  }

  private updateActionTimeline(timeline): void {
    for (const automationItem of this.data) {
      const index = automationItem.displayTimelines.findIndex(
        (item) => item._id === timeline._id
      );
      if (index >= 0) {
        automationItem.displayTimelines[index] = {
          ...timeline
        };
      }
    }
  }

  getCorrectAutomationActionType(obj: any) {
    obj.action.type = this.getActionType(obj);

    return obj;
  }

  private bothPending(timelines): boolean {
    return (
      timelines.reduce(
        (count, timeline) =>
          count + (timeline.condition && timeline.status === 'pending' ? 1 : 0),
        0
      ) === 2
    );
  }
}
