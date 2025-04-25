import { Injectable, ViewContainerRef } from '@angular/core';
import {
  Overlay,
  OverlayContainer,
  ConnectionPositionPair,
  PositionStrategy,
  OverlayConfig
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { fromEvent, Subscription, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  overlayRef: any;
  sub: Subscription;
  scrollSub: Subscription;
  subOverlayRef: any;
  closeSubOverlaySubscription: Subscription;
  private afterClosed = new Subject<any>();
  onClosed = this.afterClosed.asObservable();
  hasOpenSubOverlay = false;

  constructor(
    private overlay: Overlay,
    private overlayContainer: OverlayContainer
  ) {}

  open(
    origin: any,
    menu: any,
    viewContainerRef: ViewContainerRef,
    type: string,
    data: any,
    panelClass: string[] = []
  ): any {
    if (
      type == 'create' &&
      (this.overlayRef != null || this.overlayRef != undefined)
    ) {
      this.close(null);
      return this.onClosed.pipe(take(1));
    } else if (type == 'automation-over') {
      this.close(null);
      let config;
      if (data.data?.type === 'automation' && data.data?.automation_id) {
        config = {
          ...this.getOverlayModalConfig({ origin: origin }),
          panelClass: [`sub-modal`, `sub-${data.data?.automation_id}`, `active`]
        };
      } else {
        config = { ...this.getOverlayModalConfig({ origin: origin }) };
      }
      this.overlayRef = this.overlay.create(config);
      this.overlayRef.attach(
        new TemplatePortal(menu, viewContainerRef, {
          $implicit: data,
          close: this.close
        })
      );
      setTimeout(() => {
        if (
          this.overlayContainer.getContainerElement().getBoundingClientRect()
            .width == 0
        ) {
          return;
        } else {
          this.sub = fromEvent<MouseEvent>(document, 'click')
            .pipe(
              filter((event) => {
                const clickTarget = event.target as HTMLElement;
                if (clickTarget.closest('.second-overlay')) {
                  return false;
                }
                return (
                  clickTarget != origin &&
                  !!this.overlayRef &&
                  !this.overlayRef.overlayElement.contains(clickTarget)
                );
              }),
              take(1)
            )
            .subscribe(() => {
              this.close(null);
            });
        }
      });
      return this.onClosed.pipe(take(1));
    } else if (type == 'automation-timeline') {
      this.close(null);
      let config;
      if (data.data?.type === 'automation' && data.data?.automation_id) {
        config = {
          ...this.getOverlayTimelineConfig({ origin: origin }),
          panelClass: [`sub-modal`, `sub-${data.data?.automation_id}`, `active`]
        };
      } else {
        config = {
          ...this.getOverlayTimelineConfig({ origin: origin }),
          ...(panelClass?.length ? { panelClass } : {})
        };
      }
      this.overlayRef = this.overlay.create(config);
      this.overlayRef.attach(
        new TemplatePortal(menu, viewContainerRef, {
          $implicit: data,
          close: this.close
        })
      );
      setTimeout(() => {
        if (
          this.overlayContainer.getContainerElement().getBoundingClientRect()
            .width == 0
        ) {
          return;
        } else {
          this.sub = fromEvent<MouseEvent>(document, 'click')
            .pipe(
              filter((event) => {
                const clickTarget = event.target as HTMLElement;
                if (clickTarget.closest('.second-overlay')) {
                  return false;
                }
                return (
                  clickTarget != origin &&
                  !!this.overlayRef &&
                  !this.overlayRef.overlayElement.contains(clickTarget)
                );
              }),
              take(1)
            )
            .subscribe(() => {
              this.close(null);
            });
          const scrollWrapper = document.getElementById(
            'contact_main_infor_wrapper'
          );
          if (scrollWrapper) {
            this.scrollSub = fromEvent(scrollWrapper, 'scroll').subscribe(
              () => {
                this.close(null);
              }
            );
          }
        }
      });
      return this.onClosed.pipe(take(1));
    } else {
      this.close(null);
      let config;
      if (data.data?.type === 'automation' && data.data?.automation_id) {
        config = {
          ...this.getOverlayConfig({ origin: origin }),
          panelClass: [`sub-modal`, `sub-${data.data?.automation_id}`, `active`]
        };
      } else {
        config = { ...this.getOverlayConfig({ origin: origin }) };
      }
      this.overlayRef = this.overlay.create(config);
      this.overlayRef.attach(
        new TemplatePortal(menu, viewContainerRef, {
          $implicit: data,
          close: this.close
        })
      );
      setTimeout(() => {
        if (type == 'automation') {
          if (
            this.overlayContainer.getContainerElement().getBoundingClientRect()
              .width == 0
          ) {
            return;
          } else {
            this.sub = fromEvent<MouseEvent>(document, 'click')
              .pipe(
                filter((event) => {
                  const clickTarget = event.target as HTMLElement;
                  if (clickTarget.closest('.second-overlay')) {
                    return false;
                  }
                  return (
                    clickTarget != origin &&
                    !!this.overlayRef &&
                    !this.overlayRef.overlayElement.contains(clickTarget)
                  );
                }),
                take(1)
              )
              .subscribe(() => {
                this.close(null);
              });
            const scrollWrapper = document.getElementById(
              'contact_main_infor_wrapper'
            );
            if (scrollWrapper) {
              this.scrollSub = fromEvent(scrollWrapper, 'scroll').subscribe(
                () => {
                  this.close(null);
                }
              );
            }
          }
        } else {
          this.sub = fromEvent<MouseEvent>(document, 'click')
            .pipe(
              filter((event) => {
                const clickTarget = event.target as HTMLElement;
                return (
                  clickTarget != origin &&
                  !!this.overlayRef &&
                  !this.overlayRef.overlayElement.contains(clickTarget) &&
                  this.overlayRef.overlayElement.contains(clickTarget)
                );
              }),
              take(1)
            )
            .subscribe(() => {
              this.close(null);
            });
        }
      });
      return this.onClosed.pipe(take(1));
    }
  }
  close = (data: any) => {
    this.sub && this.sub.unsubscribe();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.afterClosed.next(data);
    }
  };

  openSubOverlay(
    origin: any,
    menu: any,
    viewContainerRef: ViewContainerRef,
    type: string,
    data: any
  ): any {
    if (
      type == 'create' &&
      (this.subOverlayRef != null || this.subOverlayRef != undefined)
    ) {
      this.closeSubOverlayFn(null);
      return this.onClosed.pipe(take(1));
    } else {
      this.hasOpenSubOverlay && this.closeSubOverlayFn(null);
      this.hasOpenSubOverlay = false;
      let config;
      if (data.data?.type === 'automation' && data.data?.automation_id) {
        config = {
          ...this.getOverlayConfig({ origin: origin }),
          panelClass: [
            `sub-sub-modal`,
            `sub-sub-${data.data?.automation_id}`,
            `active`
          ]
        };
      } else {
        config = { ...this.getOverlayConfig({ origin: origin }) };
      }
      this.subOverlayRef = this.overlay.create(config);
      this.subOverlayRef.attach(
        new TemplatePortal(menu, viewContainerRef, {
          $implicit: data,
          close: this.close
        })
      );
      this.hasOpenSubOverlay = true;
      setTimeout(() => {
        if (type == 'automation') {
          if (
            this.overlayContainer.getContainerElement().getBoundingClientRect()
              .width == 0
          ) {
            return;
          } else {
            this.closeSubOverlaySubscription = fromEvent<MouseEvent>(
              document,
              'click'
            )
              .pipe(
                filter((event) => {
                  const clickTarget = event.target as HTMLElement;
                  return (
                    clickTarget != origin &&
                    !!this.subOverlayRef &&
                    !this.subOverlayRef.overlayElement.contains(clickTarget)
                  );
                }),
                take(1)
              )
              .subscribe(() => {
                this.closeSubOverlayFn(null);
              });
          }
        } else {
          this.closeSubOverlaySubscription = fromEvent<MouseEvent>(
            document,
            'click'
          )
            .pipe(
              filter((event) => {
                const clickTarget = event.target as HTMLElement;
                return (
                  clickTarget != origin &&
                  !!this.subOverlayRef &&
                  !this.subOverlayRef.overlayElement.contains(clickTarget) &&
                  this.subOverlayRef.overlayElement.contains(clickTarget)
                );
              }),
              take(1)
            )
            .subscribe(() => {
              this.closeSubOverlayFn(null);
            });
        }
      });
      return this.onClosed.pipe(take(1));
    }
  }
  closeSubOverlayFn = (data: any) => {
    this.closeSubOverlaySubscription &&
      this.closeSubOverlaySubscription.unsubscribe();
    if (this.subOverlayRef) {
      this.subOverlayRef.dispose();
      this.subOverlayRef = null;
      this.afterClosed.next(data);
    }
  };

  private getOverlayPosition(origin: any): PositionStrategy {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(this.getPositions())
      .withPush(false);
    return positionStrategy;
  }
  private getOverlayPositionModal(origin: any): PositionStrategy {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(this.getPositionsModal())
      .withPush(false);
    return positionStrategy;
  }
  private getOverlayPositionTimeline(origin: any): PositionStrategy {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(this.getPositionsTimeline(origin))
      .withPush(false);
    return positionStrategy;
  }
  private getOverlayConfig({ origin }): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: false,
      backdropClass: 'popover-backdrop',
      positionStrategy: this.getOverlayPosition(origin)
    });
  }
  private getOverlayModalConfig({ origin }): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: false,
      backdropClass: 'popover-backdrop',
      positionStrategy: this.getOverlayPositionModal(origin)
    });
  }
  private getOverlayTimelineConfig({ origin }): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: false,
      backdropClass: 'popover-backdrop',
      positionStrategy: this.getOverlayPositionTimeline(origin)
    });
  }
  private getPositions(): ConnectionPositionPair[] {
    return [
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'top'
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'top'
      },
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'top'
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'bottom'
      },
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'bottom'
      },
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'bottom'
      }
    ];
  }
  private getPositionsModal(): ConnectionPositionPair[] {
    return [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'top',
        offsetX: 80
      }
    ];
  }
  private getPositionsTimeline(origin: any): ConnectionPositionPair[] {
    const clsNames = origin.className as string;
    return [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetX: 30,
        offsetY: -15
      },
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetX: 30,
        offsetY: 15
      }
    ];
  }
}
