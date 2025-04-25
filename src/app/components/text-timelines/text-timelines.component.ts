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
import { getUserTimezone, replaceToken } from '@app/helper';
import { TemplateToken } from '@utils/data.types';
import { LabelService } from '@services/label.service';
import { Subscription } from 'rxjs';
import { DEFAULT_TIME_ZONE } from '@constants/variable.constants';

@Component({
  selector: 'app-text-timelines',
  templateUrl: './text-timelines.component.html',
  styleUrls: ['./text-timelines.component.scss']
})
export class TextTimelinesComponent implements OnInit {
  getContactHTML = getContactHTML;
  @Input('text') text: any = {};
  @Input('showContact') showContact = false;
  @Input('contacts')
  public set contacts(val: Contact[]) {
    val.forEach((e) => {
      this._contactObj[e._id] = e;
    });
  }
  @Input('timelines')
  public set timelines(val: DetailActivity[]) {
    this._timelines = val || [];
    this._timelines.sort((a, b) =>
      a.type === 'texts' ? 1 : a.created_at > b.created_at ? -1 : 1
    );
    if (this._timelines && this._timelines.length) {
      this.main = this._timelines[0];
    }
    this.basic = this._timelines.filter((e) => e.type === 'texts')[0];
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
    }

    this._firstM = this._includedMaterials[0];

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
  _timelines: DetailActivity[] = [];
  _materials = {};
  _includedMaterials = [];
  _firstM: string;
  _contactObj = {};
  more = false;

  @ViewChild('materialDetailPortal') materialDetailPortal: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  detailMaterial;
  siteUrl = environment.front;

  templateTokens: TemplateToken[] = [];
  allLabels = null;
  labelSubscriptrion: Subscription;

  additional_fields;
  timezone_info;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private userService: UserService,
    public labelService: LabelService
  ) {
    const profile = this.userService.profile.getValue();
    this.userId = profile._id;
    this.timezone_info = getUserTimezone(profile);

    const garbage = this.userService.garbage.getValue();
    if (garbage.template_tokens && garbage.template_tokens.length) {
      this.templateTokens = [...garbage.template_tokens];
    }
    this.labelSubscriptrion && this.labelSubscriptrion.unsubscribe();
    this.labelSubscriptrion = this.labelService.allLabels$.subscribe((res) => {
      if (res) {
        this.allLabels = res;
      }
    });
    this.additional_fields = garbage.additional_fields || [];
  }

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.labelSubscriptrion && this.labelSubscriptrion.unsubscribe();
  }
  expand(): void {
    this.onExpand.emit();
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
    let labelName = '';
    if (content?.match(/{label}/gi)) {
      labelName = this.getLabelName(this.contactInfo);
    }
    if (this.text?.assigned_id) {
      const assigned = this.text.assigned_id;
      content = content
        .replace(/{assignee_name}/gi, assigned?.user_name || '{assignee_name}')
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
    return replaceToken(
      user,
      this.contactInfo,
      this.templateTokens,
      content,
      labelName,
      this.additional_fields,
      this.timezone_info
    );
  }
}
