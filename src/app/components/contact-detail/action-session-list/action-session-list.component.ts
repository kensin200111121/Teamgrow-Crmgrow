import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-action-session-list',
  templateUrl: './action-session-list.component.html',
  styleUrls: ['./action-session-list.component.scss']
})
export class ActionSessionListComponent implements OnInit {
  @Output() onCollapse = new EventEmitter();
  @Input() isShowCollapse = true;
  _sessionList = [];
  @ViewChild('materialDetailPortal') materialDetailPortal: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  detailMaterial;
  SITE = environment.website;
  unneededFields = ['activity', 'contact', 'landing_page'];

  @Input() materials;
  @Input() set sessionList(val) {
    this._sessionList = val.reverse();
  }

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {}

  collapse(): void {
    this.onCollapse.emit();
  }

  openDetail(material: any, event: any, material_type: string): void {
    this.detailMaterial = { ...material, material_type };
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
}
