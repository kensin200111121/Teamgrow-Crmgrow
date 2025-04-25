import { Injectable, HostListener, Component } from '@angular/core';
import { CanDeactivate } from '@angular/router';

@Component({
  template: ''
})
export abstract class ComponentCanDeactivate {
  abstract canDeactivate(): boolean;
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (!this.canDeactivate()) {
      $event.returnValue = true;
    }
  }
}
export abstract class PageCanDeactivate extends ComponentCanDeactivate {
  abstract saved: boolean;
  canDeactivate(): boolean {
    return this.saved;
  }
}
