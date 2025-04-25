import { Component, Input, OnInit } from '@angular/core';
import {
  ContactActivityActionV2,
  ContactActivityDetailV2
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import _ from 'lodash';
@Component({
  selector: 'app-contact-activity-super-item',
  templateUrl: './contact-activity-super-item.component.html',
  styleUrls: ['./contact-activity-super-item.component.scss']
})
export class ContactActivitySuperItemComponent implements OnInit {
  @Input() contactId: string;
  @Input() activity: ContactActivityActionV2;
  @Input() isPending: boolean;
  @Input() isActionItem?: boolean; // true: action list item, false: activity list item
  @Input() prospectId?: string;
  constructor() {}

  ngOnInit(): void {}
}

@Component({
  selector: 'app-contact-activity-item-super',
  template: ''
})
export abstract class ContactActivityItemSuperComponent implements OnInit {
  protected contactId;
  protected isPending: boolean;
  protected activity: ContactActivityActionV2 | null;
  protected abstract contactDetailInfoService: ContactDetailInfoService;
  protected isActionItem?: boolean;

  actionDetail: ContactActivityDetailV2 | undefined | null;
  isExpanded = false; // expand flag for detail content
  detailLoading = false;
  more = false; // expand flag for detail long email history after expand detail content

  ngOnInit(): void {
    // this.loadMoreDetail();
  }

  private loadMoreDetail(): void {
    if (!this.activity) return;
    this.detailLoading = true;
    this.contactDetailInfoService
      .loadContactActivityDetail(this.contactId, {
        type: this.activity.type,
        id: this.activity.actionId
      })
      .subscribe((res) => {
        if (res?.data) {
          this.actionDetail = this.getParseDetail(res.data);
        }
        this.detailLoading = false;
      });
  }

  getParseDetail(actionDetail): any {
    const { activities, details } = actionDetail;
    const detailInfos = details.reduce(
      (res, item) => ({ ...res, ...item }),
      {}
    );

    // filter "sent video/image/pdf using email" activity history content
    const filteredList = ['email', 'text'].includes(this.activity?.type)
      ? activities.reverse().filter((item) => {
          return !['images', 'pdfs', 'videos'].includes(item.type);
        })
      : activities.reverse();

    const parsedActivities = filteredList.map((activity) => {
      let material = null;
      let trackerInfo = null;
      let tracker = null;
      let subContent = null;
      switch (activity.type) {
        case 'pdf_trackers':
          tracker = detailInfos?.pdf_tracker?.[activity?.pdf_trackers];
          material = detailInfos?.pdf[activity?.pdfs[0]];
          break;
        case 'video_trackers':
          tracker = detailInfos?.video_tracker?.[activity?.video_trackers];
          material = detailInfos?.video?.[activity?.videos[0]];
          break;
        case 'form_trackers':
          tracker = detailInfos?.form_tracker?.[activity?.form_trackers];
          break;
        case 'image_trackers':
          tracker = detailInfos?.image_tracker?.[activity?.image_trackers];
          material = detailInfos?.image?.[activity?.images[0]];
          break;
        case 'email_trackers':
          tracker = detailInfos?.email_tracker?.[activity?.email_trackers];
          break;
        case 'deals':
          subContent =
            detailInfos?.deal_stage?.[activity?.deal_stages]?.title ?? '';
          break;
        default:
          break;
      }

      if (tracker) {
        trackerInfo = {
          mediaTracker: tracker,
          type: activity.type
        };
      }
      if (material && trackerInfo) {
        trackerInfo.duration = material.duration;
      }
      if (subContent) {
        activity.subContent = subContent;
      }
      return { ...activity, material, trackerInfo };
    });
    return {
      ...actionDetail,
      activities:
        this.activity.type === 'follow_up'
          ? parsedActivities.reverse()
          : parsedActivities,
      details: detailInfos
    };
  }

  expandMoreDetail(): void {
    this.isExpanded = true;
    this.loadMoreDetail();
  }

  hideMoreDetail(): void {
    this.isExpanded = false;
    this.more = false;
  }

  toggleSessions(): void {
    if (this.isExpanded) {
      this.hideMoreDetail();
    } else {
      this.expandMoreDetail();
    }
  }

  replaceContent(content: string): string {
    if (content) {
      content = this.contactDetailInfoService.replaceContent(
        content,
        this.activity?.action?.assigned_contacts
      );
    } else {
      content = '';
    }
    return content;
  }

  convertReceiversStr(receivers: string[]): string {
    return receivers.join(',');
  }
}
