import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ComponentCanDeactivate } from '@variables/abstractors';

@Injectable()
export class PageExitGuard implements CanDeactivate<ComponentCanDeactivate> {
  canDeactivate(component: ComponentCanDeactivate): boolean {
    if (!component.canDeactivate()) {
      if (
        confirm(
          'You did not save your change. Are you sure to leave this page?'
        )
      ) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  }
}
