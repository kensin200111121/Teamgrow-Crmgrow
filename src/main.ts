import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import '@angular/compiler';
import * as Sentry from '@sentry/angular-ivy';
import { AppModule } from '@app/app.module';
import { environment } from '@environments/environment';
import 'codemirror/mode/htmlmixed/htmlmixed';

Sentry.init({
  dsn: environment.SENTRY_DSN || '',
  integrations: [
    // Registers and configures the Tracing integration,
    // which automatically instruments your application to monitor its
    // performance, including custom Angular routing instrumentation
    // new Sentry.BrowserTracing({
    //   routingInstrumentation: Sentry.routingInstrumentation
    // })
    // Registers the Replay integration,
    // which automatically captures Session Replays
    // new Sentry.Replay()
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: environment.production ? 'production' : 'development'
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
