import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, InjectionToken, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { ComponentsModule } from '@components/components.module';
import { AppRoutingModule } from '@app/app-routing.module';
import { ApiInterceptor } from '@interceptors/api.interceptor';
import { PageExitGuard } from '@guards/page-exit.guard';
import { AppComponent } from '@app/app.component';
import { AdminLayoutComponent } from '@layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from '@layouts/auth-layout/auth-layout.component';
import { environment } from '@environments/environment';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MentionModule } from 'angular-mentions';
import { DatetimeFormatPipe } from '@pipes/datetime-format.pipe';
import { CustomToastComponent } from '@components/custom-toast/custom-toast.component';
import { GlobalErrorHandler } from './interceptors/error.interceptor';
import { TimeagoIntl } from 'ngx-timeago';
import { MatDialogModule } from '@angular/material/dialog';
import { CalendarConnectComponent } from '@components/calendar-connect/calendar-connect.component';

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

@NgModule({
  declarations: [
    AppComponent,
    AuthLayoutComponent,
    AdminLayoutComponent,
    CalendarConnectComponent
  ],
  imports: [
    MatDialogModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production
    }),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    NgbModule,
    MatSidenavModule,
    MatIconModule,
    ComponentsModule,
    ToastrModule.forRoot({
      toastComponent: CustomToastComponent,
      positionClass: 'toast-top-center'
    }),
    MentionModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
    PageExitGuard,
    TimeagoIntl,
    DatetimeFormatPipe,
    ...(environment.production
      ? [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]
      : [])
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
