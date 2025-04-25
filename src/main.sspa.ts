import { enableProdMode, NgZone } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Router, NavigationStart } from '@angular/router';
import {
  singleSpaAngular,
  getSingleSpaExtraProviders
} from 'single-spa-angular';
import { AppModule } from '@app/app.module';
import { environment } from '@environments/environment';
import { ReplaySubject } from 'rxjs';
import { AppProps } from 'single-spa';
import '@angular/localize/init'; // Included With i18 localization

// Add any custom single-spa props you have to this type def
// https://single-spa.js.org/docs/building-applications.html#custom-props
type SingleSpaProps = AppProps & {};
const singleSpaPropsSubject = new ReplaySubject<SingleSpaProps>(1);

// Set the webpack public path (baseURL)
// WEBPACK_PUBLIC_PATH replaced by webpack loader during the build
declare var __webpack_public_path__: string;
__webpack_public_path__ = 'WEBPACK_PUBLIC_PATH/';

if (environment.production) {
  enableProdMode();
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: (singleSpaProps) => {
    singleSpaPropsSubject.next(singleSpaProps);

    return platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(
      AppModule
    );
  },
  template: '<app-root />',
  Router,
  NavigationStart,
  NgZone
});

var styles;
const unmountCycle = (data) => {
  return new Promise((res) => {
    const marker = document.createElement('div');
    marker.id = 'crmgrow-styles';
    styles = document.querySelectorAll("[name='crmgrow']");
    if (!document.querySelector('#crmgrow-styles')) {
      document.head.insertBefore(marker, styles[0]);
    }
    styles.forEach((style) => style.remove());

    const userflowView = document.getElementById('userflow-ui');
    if (userflowView) {
      userflowView.style.visibility = 'hidden';
    }

    res(true);
  });
};

const mountCycle = (data) => {
  return new Promise((res) => {
    if (styles?.length) {
      const marker = document.querySelector('#crmgrow-styles');
      for (let i = styles.length - 1; i >= 0; i--) {
        document.head.insertBefore(styles[i], marker);
      }
    }

    const userflowView = document.getElementById('userflow-ui');
    if (userflowView) {
      userflowView.style.visibility = 'visible';
    }

    res(true);
  });
};

export const bootstrap = [mountCycle, lifecycles.bootstrap];
export const mount = [mountCycle, lifecycles.mount];
export const unmount = [unmountCycle, lifecycles.unmount];
