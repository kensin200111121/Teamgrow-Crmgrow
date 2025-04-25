import { TemplatePortal } from '@angular/cdk/portal';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { DetailActivity } from '@models/activityDetail.model';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';
import { Contact } from '@models/contact.model';
import { getContactHTML } from '@utils/functions';
import { TemplateToken } from '@utils/data.types';
import { getUserTimezone, replaceToken } from '@app/helper';
import { Subscription } from 'rxjs';
import { LabelService } from '@services/label.service';
import { DEFAULT_TIME_ZONE } from '@constants/variable.constants';
import { EmailService } from '@app/services/email.service';
import { ChangeDetectorRef } from '@angular/core';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';
import { Pdf } from '@models/pdf.model';
@Component({
  selector: 'app-email-timelines',
  templateUrl: './email-timelines.component.html',
  styleUrls: ['./email-timelines.component.scss']
})
export class EmailTimelinesComponent implements OnInit {
  getContactHTML = getContactHTML;
  @Input('email') email: any = {};
  @Input('showContact') showContact = false;
  @Input('contacts')
  public set contacts(val: Contact[]) {
    val.forEach((e) => {
      this._contactObj[e._id] = e;
    });
    if (val?.length === 1) this.contactInfo = val[0];
  }
  @Input('timelines')
  public set timelines(val: DetailActivity[]) {
    this._timelines = val || [];
    this._timelines.sort((a, b) =>
      a.type === 'emails' ? 1 : a.created_at > b.created_at ? -1 : 1
    );
    if (this._timelines && this._timelines.length) {
      this.main = this._timelines[0];
    }
    this.basic = this._timelines.filter((e) => e.type === 'emails')[0];
    if (this.basic) {
      if (this.basic.videos instanceof Array) {
        this._includedMaterials = [...this.basic.videos];
      }
      if (this.basic.pdfs instanceof Array) {
        this._includedMaterials = [
          ...this._includedMaterials,
          ...this.basic.pdfs
        ];
      }
      if (this.basic.images instanceof Array) {
        this._includedMaterials = [
          ...this._includedMaterials,
          ...this.basic.images
        ];
      }

      this._firstM = this._includedMaterials[0];
      if (this.basic.activity_detail) {
        if (this.basic.activity_detail.pdf_tracker) {
          const { pdf_tracker } = this.basic.activity_detail;
          if (pdf_tracker.pdf instanceof Array) {
            this._firstM = pdf_tracker.pdf[0];
          } else {
            this._firstM = pdf_tracker.pdf;
          }
        }
      }
    }
    if (this._includedMaterials.length) {
      this._timelines = this._timelines.filter(
        (e) => e.type !== 'videos' && e.type !== 'pdfs' && e.type !== 'images'
      );
    }
  }
  @Input('expanded') expanded = false;
  @Input('loading') loading = false;
  @Input('materials')
  public set materials(val) {
    this._materials = val;
  }
  @Input('contactInfo') contactInfo: Contact;
  @Output() onExpand = new EventEmitter();
  @Output() onCollapse = new EventEmitter();
  userId = '';
  SITE = environment.website;
  main: DetailActivity;
  basic: DetailActivity;
  _contactObj = {};
  _timelines: DetailActivity[] = [];
  _materials = {};
  _includedMaterials = [];
  _firstM: string;
  more = false;
  @ViewChild('materialDetailPortal') materialDetailPortal: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  detailMaterial;
  siteUrl = environment.front;
  templateTokens: TemplateToken[] = [];
  allLabels = null;
  labelSubscription: Subscription;
  detailLoading = false;
  additional_fields;
  timezone_info;
  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private userService: UserService,
    public labelService: LabelService,
    private emailService: EmailService,
    private changeDetector: ChangeDetectorRef
  ) {
    const profile = this.userService.profile.getValue();
    this.userId = profile._id;
    this.timezone_info = getUserTimezone(profile);

    const garbage = this.userService.garbage.getValue();
    if (garbage.template_tokens && garbage.template_tokens.length) {
      this.templateTokens = [...garbage.template_tokens];
    }
    this.additional_fields = garbage.additional_fields || [];
    this.labelSubscription && this.labelSubscription.unsubscribe();
    this.labelSubscription = this.labelService.allLabels$.subscribe((res) => {
      if (res) {
        this.allLabels = res;
      }
    });
  }

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.labelSubscription && this.labelSubscription.unsubscribe();
  }

  private base64urlTobase64(input: string): string {
    // Replace non-url compatible chars with base64 standard chars
    input = input.replace(/-/g, '+').replace(/_/g, '/');

    // Pad out with standard base64 required padding characters
    const pad = input.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error(
          'InvalidLengthError: Input base64url string is the wrong length to determine padding'
        );
      }
      input += new Array(5 - pad).join('=');
    }

    return input;
  }

  private replaceBase64Content(
    _emailContent: string,
    attachments: any
  ): string {
    if (!_emailContent) return '';
    if (!attachments?.length) return _emailContent;
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const contentId = attachment?.contentId;
      const mimeType = attachment?.mimeType;
      let mimeData = attachment?.mimeData;
      if (!contentId || !mimeType || !mimeData) continue;
      mimeData = this.base64urlTobase64(mimeData);
      _emailContent = _emailContent.replace(
        'cid:' + contentId,
        'data:' + mimeType + ';base64,' + mimeData
      );
    }
    return _emailContent;
  }

  expand(): void {
    this.onExpand.emit();
    if (this.email['message_detail']) return;
    if (this.email?.email_message_id) {
      this.detailLoading = true;
      const email_message_id = this.email.email_message_id;
      this.emailService.getGmailMessage(email_message_id).subscribe((res) => {
        if (res?.data) {
          const _emailContent = res.data?.emailContent;
          const attachments = res.data?.emailAttachments;
          const emailContent = this.replaceBase64Content(
            _emailContent,
            attachments
          );
          this.email['message_detail'] = emailContent;
          this.email['message_attachments'] = attachments;
          this.changeDetector.detectChanges();
          this.detailLoading = false;
        } else {
          this.detailLoading = false;
        }
      });
    }
  }

  collapse(): void {
    this.more = false;
    this.onCollapse.emit();
  }

  openDetail(id: string, event: any): void {
    this.detailMaterial = this._materials[id];
    const originX = event.clientX;
    const originY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const size = {
      maxWidth: '260px',
      minWidth: '240px',
      maxHeight: 400,
      minHeight: 180
    };
    const positionStrategy = this.overlay.position().global();
    if (screenW - originX > 280) {
      positionStrategy.left(originX + 'px');
    } else if (originX > 280) {
      positionStrategy.left(originX - 280 + 'px');
    } else if (screenW - originX > 260) {
      positionStrategy.left(originX + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 420) {
      positionStrategy.centerVertically();
    } else if (originY < 190) {
      positionStrategy.top('10px');
    } else if (screenH - originY < 190) {
      positionStrategy.top(screenH - 410 + 'px');
    } else {
      positionStrategy.top(originY - 190 + 'px');
    }
    size['height'] = 'unset';
    this.templatePortal = new TemplatePortal(
      this.materialDetailPortal,
      this.viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
      }
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize(size);
      this.overlayRef.attach(this.templatePortal);
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.outsidePointerEvents().subscribe(() => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }
  getLabelName(contact: Contact): string {
    let _labelName = '';
    if (this.allLabels?.length > 0) {
      this.allLabels.forEach((e) => {
        if (e._id == contact?.label) _labelName = e.name;
      });
    }
    return _labelName;
  }
  replaceContent(content: string): string {
    const user = this.userService.profile.getValue();
    const material = Object.values(this._materials)[0];
    if (content) {
      const materialTitle = material ? material['title'] : '';
      content = content
        .replace(/{material_title}/gi, materialTitle)
        .split('<br>')
        .join('<br />\n');

      if (this.email?.assigned_id) {
        const assigned = this.email.assigned_id;
        content = content
          .replace(
            /{assignee_name}/gi,
            assigned?.user_name || '{assignee_name}'
          )
          .replace(
            /{assignee_first_name}/gi,
            assigned?.user_name?.split(' ')[0] || '{assignee_first_name}'
          )
          .replace(
            /{assignee_last_name}/gi,
            assigned?.user_name?.split(' ')[1] || '{assignee_last_name}'
          )
          .replace(
            /{assignee_email}/gi,
            assigned.connected_email || assigned.email || '{assignee_email}'
          )
          .replace(
            /{assignee_phone}/gi,
            assigned?.cell_phone || '{assignee_phone}'
          );
      }
    } else {
      content = '';
    }

    if (this.contactInfo) {
      let labelName = '';
      if (content.match(/{label}/gi)) {
        labelName = this.getLabelName(this.contactInfo);
      }
      return replaceToken(
        user,
        this.contactInfo,
        this.templateTokens,
        content,
        labelName,
        this.additional_fields,
        this.timezone_info
      );
    } else {
      return content;
    }
  }

  downloadAttachment(
    mimeData: string,
    mimeType: string,
    filename: string
  ): void {
    if (!mimeData) return;
    const base64 = this.base64urlTobase64(mimeData);
    const decodeData = Buffer.from(base64, 'base64');
    const blob = new Blob([decodeData], { type: mimeType });
    saveAs(blob, filename);
  }
  getAttachment(attachment: any): void {
    if (!attachment) return;
    if (attachment?.mimeData) {
      this.downloadAttachment(
        attachment.mimeData,
        attachment.mimeType,
        attachment.filename
      );
    } else {
      const data = {
        messageId: this.email.email_message_id,
        attachmentId: attachment.attachmentId
      };
      this.emailService.getGmailAttachment(data).subscribe((res) => {
        if (res?.data) {
          const mimeData = res.data.mimeData;
          this.downloadAttachment(
            mimeData,
            attachment.mimeType,
            attachment.filename
          );
        }
      });
    }
  }
}
