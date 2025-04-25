import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SocialLoginModule } from '@abacritt/angularx-social-login';

import { AuthLayoutRoutes } from '@layouts/auth-layout/auth-layout.routing.module';
import { LoginComponent } from '@pages/login/login.component';
import { RegisterComponent } from '@pages/register/register.component';
import { ForgotPasswordComponent } from '@pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '@pages/reset-password/reset-password.component';
import { SharedModule } from '@layouts/shared/shared.module';
import {
  SocialAuthServiceConfig,
  GoogleLoginProvider
} from '@abacritt/angularx-social-login';
import { environment } from '@environments/environment';
import { StripeModule } from 'stripe-angular';
import { STRIPE_KEY } from '@constants/variable.constants';
import { CompanyChooseComponent } from '@pages/company-choose/company-choose.component';
import { ScheduleComponent } from '@pages/schedule/schedule.component';
@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    CompanyChooseComponent,
    ScheduleComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    StripeModule.forRoot(STRIPE_KEY),
    RouterModule.forChild(AuthLayoutRoutes),
    TranslateModule.forChild({ extend: true }),
    SocialLoginModule
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(environment.ClientId.Google)
          }
        ]
      } as SocialAuthServiceConfig
    }
  ]
})
export class AuthLayoutModule {}