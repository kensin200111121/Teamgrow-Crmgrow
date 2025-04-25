import { ComponentType, OverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
// import { OverlayParams } from '@services/overlay.service';
import { Type } from '@angular/core';

export type OverlayCloseEvent<T = any> = {
  type: 'backdropClick' | 'close';
  data: T;
};

export type OverlayContent = ComponentType<any>;

export class myOverlayRef<T = any> {
  private afterClosed = new Subject<OverlayCloseEvent<T>>();
  afterClosed$ = this.afterClosed.asObservable();

  constructor(
    public overlay: OverlayRef,
    public content: OverlayContent,
    public data: T
  ) {
    overlay.backdropClick().subscribe(() => {
      this._close('backdropClick', null);
    });
  }

  close(data?: T) {
    this._close('close', data);
  }

  private _close(type: OverlayCloseEvent['type'], data?: T) {
    this.overlay.dispose();
    this.afterClosed.next({
      type,
      data
    });
    this.afterClosed.complete();
  }
}
