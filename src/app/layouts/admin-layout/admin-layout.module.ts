import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxAudioPlayerModule } from 'ngx-audio-player';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
// import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { StripeModule } from 'stripe-angular';
import { EmailEditorModule } from 'angular-email-editor';
import { NgChartsModule } from 'ng2-charts';

import { AdminLayoutRoutes } from '@layouts/admin-layout/admin-layout.routing.module';
import { SharedModule } from '@layouts/shared/shared.module';
import { ComponentsModule } from '@components/components.module';

import { HomeComponent } from '@pages/home/home.component';
import { TasksComponent } from '@pages/tasks/tasks.component';
import { ContactsComponent } from '@pages/contacts/contacts.component';
import { ProfileComponent } from '@pages/profile/profile.component';
import { GeneralProfileComponent } from '@pages/general-profile/general-profile.component';
import { SignatureComponent } from '@pages/signature/signature.component';
import { SecurityComponent } from '@pages/security/security.component';
import { IntegrationComponent } from '@pages/integration/integration.component';
import { IntegrationNewComponent } from '@pages/integration-new/integration-new.component';
import { PaymentComponent } from '@pages/payment/payment.component';
import { ActivitiesComponent } from '@pages/activities/activities.component';
import { AffiliateComponent } from '@pages/affiliate/affiliate.component';
import { AutomationsComponent } from '@pages/automations/automations.component';
import { SettingsComponent } from '@pages/settings/settings.component';
import { TeamsComponent } from '@pages/teams/teams.component';
import { TemplatesComponent } from '@pages/templates/templates.component';
import { TemplateComponent } from '@pages/template/template.component';
import { TeamComponent } from '@pages/team/team.component';
import { CalendarComponent } from '@pages/calendar/calendar.component';
import { CalendlyComponent } from '@pages/calendly/calendly.component';
import { NotificationsComponent } from '@pages/notifications/notifications.component';
import { AssistantComponent } from '@pages/assistant/assistant.component';
import { LeadCaptureComponent } from '@pages/lead-capture/lead-capture.component';
import { LeadCaptureFormAddComponent } from '@pages/lead-capture-form-add/lead-capture-form-add.component';
import { LeadCaptureFormTrackComponent } from '@pages/lead-capture-from-track/lead-capture-from-track.component';
import { TagManagerComponent } from '@pages/tag-manager/tag-manager.component';
import { LabelManagerComponent } from '@pages/label-manager/label-manager.component';
import { StatusAutomationComponent } from '@pages/status-automation/status-automation.component';
import { SocialProfileComponent } from '@pages/social-profile/social-profile.component';
import { DealsComponent } from '@pages/deals/deals.component';
import { DealsDetailComponent } from '@pages/deals-detail/deals-detail.component';
import { AutoflowComponent } from '@pages/autoflow/autoflow.component';
import { VideoCreateComponent } from '@pages/video-create/video-create.component';
import { MoneyPipe } from '@pipes/money.pipe';
import { TeamListComponent } from '@pages/team-list/team-list.component';
import { AnalyticsVideoSentComponent } from '@pages/analytics-video-sent/analytics-video-sent.component';
import { AnalyticsVideoWatchedComponent } from '@pages/analytics-video-watched/analytics-video-watched.component';
import { AnalyticsContactsAddedComponent } from '@pages/analytics-contacts-added/analytics-contacts-added.component';
import { ThemesComponent } from '@pages/themes/themes.component';
import { ThemeComponent } from '@pages/theme/theme.component';
import { NotificationsListComponent } from '@pages/notifications-list/notifications-list.component';
import { SmartCodeComponent } from '@pages/smart-code/smart-code.component';
import { SmsLimitsComponent } from '@pages/sms-limits/sms-limits.component';
import { SmsLimitsNewComponent } from '@app/pages/sms-limits-new/sms-limits-new.component';
import { DealsSettingComponent } from '@pages/deals-setting/deals-setting.component';
import { MessagesComponent } from '@pages/messages/messages.component';
import { TeamShareContactComponent } from '@pages/team-share-contact/team-share-contact.component';
import { TestComponent } from '@pages/test/test.component';
import { VerifyEmailComponent } from '@pages/verify-email/verify-email.component';
import { CampaignComponent } from '@pages/campaign/campaign.component';
import { CampaignBulkMailingComponent } from '@pages/campaign-bulk-mailing/campaign-bulk-mailing.component';
import { CampaignBulkMailingItemComponent } from '@pages/campaign-bulk-mailing-item/campaign-bulk-mailing-item.component';
import { CampaignSmtpComponent } from '@pages/campaign-smtp/campaign-smtp.component';
import { CompanyComponent } from '@pages/company/company.component';
import { CampaignTemplatesComponent } from '@pages/campaign-templates/campaign-templates.component';
import { NewsletterEditorComponent } from '@pages/newsletter-editor/newsletter-editor.component';
import { EmailQueueComponent } from '@pages/email-queue/email-queue.component';
import { ScheduledOneComponent } from '@pages/scheduled-one/scheduled-one.component';
import { ScheduleTypesComponent } from '@pages/schedule-types/schedule-types.component';
import { ScheduleTypeCreateComponent } from '@pages/schedule-type-create/schedule-type-create.component';
import { ScheduleLinkComponent } from '@app/pages/schedule-link/schedule-link.component';
import { CampaignCreateComponent } from '@pages/campaign-create/campaign-create.component';
import { AutomationQueueComponent } from '@pages/automation-queue/automation-queue.component';
import { SubscriptionComponent } from '@pages/subscription/subscription.component';
import { SubscriptionV2Component } from '@pages/subscription-v2/subscription-v2.component';
import { BillingComponent } from '@pages/billing/billing.component';
import { IntegratedCalendarsComponent } from '@pages/integrated-calendars/integrated-calendars.component';
import { ThemeSettingComponent } from '@pages/theme-setting/theme-setting.component';
import { ScheduledEventsComponent } from '@pages/scheduled-events/scheduled-events.component';
import { TaskManagerComponent } from '@pages/task-manager/task-manager.component';
import { BusinessHourComponent } from '@pages/business-hour/business-hour.component';
import { ContactsImportCsvComponent } from '@pages/contacts-import-csv/contacts-import-csv.component';
import { CallReportComponent } from '@pages/call-report/call-report.component';
import { RatesSettingComponent } from '@pages/rates-setting/rates-setting.component';
import {
  PageBuilderComponent,
  PageBuilderConvrrtComponent
} from '@pages/page-builder/page-builder.component';
import { LandingPagesComponent } from '@app/pages/landing-pages/landing-pages.component';
import { SignatureSettingComponent } from '@app/pages/signature-setting/signature-setting.component';

// const config: SocketIoConfig = {
//   url: environment.server + '/application',
//   options: {}
// };
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarMomentDateFormatter,
  DateAdapter,
  MOMENT
} from 'angular-calendar';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import moment from 'moment-timezone';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
import { adapterFactory as dateFnsAdapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CustomFieldsComponent } from '@pages/custom-fields/custom-fields.component';
import { LinkComponent } from '@components/link/link.component';
import { MentionModule } from 'angular-mentions';
import { AnalyticsDashboardComponent } from '@pages/analytics-dashboard/analytics-dashboard.component';
import { ContactManagerComponent } from '@pages/contact-manager/contact-manager.component';
import { TwilioSettingComponent } from '@pages/twilio-setting/twilio-setting.component';
import { StarterBrandComponent } from '@pages/twilio-setting/starter-brand/starter-brand.component';
import { StandardBrandComponent } from '@pages/twilio-setting/standard-brand/standard-brand.component';
import { BrandCampaignsComponent } from '@pages/twilio-setting/brand-campaigns/brand-campaigns.component';
import { MaterialsTeamList } from '@pages/materials-team/materials-team.component';
import { AutomationsOwnList } from '@pages/automations-own/automations-own.component';
import { AutomationsLibraryList } from '@pages/automations-library/automations-library.component';
import { AutomationsTeamList } from '@pages/automations-team/automations-team.component';
import { AutomationResourcesComponent } from '@pages/automation-resources/automation-resources.component';
import { PipelinesLibraryListComponent } from '@pages/pipelines-library/pipelines-library.component';
import { TemplatesOwnList } from '@pages/templates-own/templates-own.component';
import { TemplatesLibraryList } from '@pages/templates-library/templates-library.component';
import { TemplatesTeamList } from '@pages/templates-team/templates-team.component';
import { PipelinesTeamList } from '@app/pages/pipelines-team/pipelines-team.component';
import { ContactListComponent } from '@app/pages/contact-list/contact-list.component';
import { OverviewComponent } from '@app/pages/overview/overview.component';
import { OverviewTopComponent } from '@app/pages/overview-top/overview-top.component';
import { OverviewTaskComponent } from '@app/pages/overview-task/overview-task.component';
import { OverviewCoursesComponent } from '@app/pages/overview-courses/overview-courses.component';
import { OverviewCalendarComponent } from '@app/pages/overview-calendar/overview-calendar.component';
import { OverviewReportComponent } from '@app/pages/overview-report/overview-report.component';
import { OverviewMarketingComponent } from '@app/pages/overview-marketing/overview-marketing.component';
import { OverviewForYouComponent } from '@app/pages/overview-for-you/overview-for-you.component';
import { AgentFilterComponent } from '@app/pages/agent-filter/agent-filter.component';
import { ConversationsComponent } from '@pages/conversations/conversations.component';
import { ContactsSphereSortingComponent } from '@app/pages/contacts-sphere-sorting/contacts-sphere-sorting.component';
import { FolderTreeComponent } from '@app/components/folder-tree/folder-tree.component';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import { ContactActionsComponent } from '@app/pages/contact-actions/contact-actions.component';
import { ContactAgentFireComponent } from '@app/pages/contact-agent-fire/contact-agent-fire.component';
import { ContactActiveTimelineComponent } from '@app/pages/contact-active-timeline/contact-active-timeline.component';
import { DialerService } from '@app/services/dialer.service';
import { MaterialsNewComponent } from '@app/pages/materials-new/materials-new.component';
import { MaterialsNavigationComponent } from '@app/pages/materials-new/materials-navigation/materials-navigation.component';
import { MaterialsMainComponent } from '@app/pages/materials-new/materials-main/materials-main.component';
import { MaterialsTreeViewComponent } from '@app/pages/materials-new/materials-navigation/materials-tree-view/materials-tree-view.component';
import { MaterialDetailComponent } from '../../pages/material-detail/material-detail.component';
import { ContactDetailV2Component } from '../../pages/contact-detail-v2/contact-detail-v2.component';
import { ContactMainInfoV2Component } from '@app/components/contact-detail-v2/contact-main-info-v2/contact-main-info-v2.component';
import { LandingPageDetailComponent } from '@app/pages/landing-page/landing-page.component';
import { LandingPageCreateComponent } from '../../pages/landing-page-create/landing-page-create.component';
import { NgxColorsModule } from 'ngx-colors';
import { FilterOptionsListComponent } from '@app/components/filter-options-list/filter-options-list.component';
import { IntegrationVortexComponent } from '@app/pages/integration-vortex/integration-vortex.component';

registerLocaleData(localeEs, 'es');
registerLocaleData(localeFr, 'fr');

export function momentAdapterFactory() {
  return adapterFactory(moment);
}

@NgModule({
  declarations: [
    TasksComponent,
    ContactsComponent,
    ProfileComponent,
    GeneralProfileComponent,
    SignatureComponent,
    SecurityComponent,
    IntegrationComponent,
    IntegrationNewComponent,
    PaymentComponent,
    ActivitiesComponent,
    HomeComponent,
    AffiliateComponent,
    AutomationsComponent,
    SettingsComponent,
    SignatureSettingComponent,
    TeamsComponent,
    TemplatesComponent,
    TemplateComponent,
    SocialProfileComponent,
    TeamComponent,
    CalendarComponent,
    CalendlyComponent,
    NotificationsComponent,
    AssistantComponent,
    LeadCaptureComponent,
    LandingPageDetailComponent,
    LeadCaptureFormAddComponent,
    LeadCaptureFormTrackComponent,
    TagManagerComponent,
    LabelManagerComponent,
    CustomFieldsComponent,
    StatusAutomationComponent,
    DealsComponent,
    DealsDetailComponent,
    AutoflowComponent,
    VideoCreateComponent,
    MoneyPipe,
    TeamListComponent,
    AnalyticsVideoSentComponent,
    AnalyticsVideoWatchedComponent,
    AnalyticsContactsAddedComponent,
    ThemesComponent,
    ThemeComponent,
    NotificationsListComponent,
    SmartCodeComponent,
    SmsLimitsComponent,
    SmsLimitsNewComponent,
    DealsSettingComponent,
    MessagesComponent,
    TeamShareContactComponent,
    TestComponent,
    VerifyEmailComponent,
    CampaignComponent,
    CampaignBulkMailingComponent,
    CampaignBulkMailingItemComponent,
    CampaignSmtpComponent,
    CompanyComponent,
    CampaignTemplatesComponent,
    NewsletterEditorComponent,
    EmailQueueComponent,
    ScheduledOneComponent,
    ScheduleTypesComponent,
    ScheduleTypeCreateComponent,
    ScheduleLinkComponent,
    CampaignCreateComponent,
    AutomationQueueComponent,
    SubscriptionComponent,
    SubscriptionV2Component,
    BillingComponent,
    IntegratedCalendarsComponent,
    ThemeSettingComponent,
    ScheduledEventsComponent,
    TaskManagerComponent,
    BusinessHourComponent,
    ContactsImportCsvComponent,
    CallReportComponent,
    LinkComponent,
    AnalyticsDashboardComponent,
    RatesSettingComponent,
    ContactManagerComponent,
    TwilioSettingComponent,
    StarterBrandComponent,
    StandardBrandComponent,
    BrandCampaignsComponent,
    MaterialsTeamList,
    AutomationsOwnList,
    AutomationsLibraryList,
    PipelinesLibraryListComponent,
    AutomationsTeamList,
    AutomationResourcesComponent,
    TemplatesOwnList,
    TemplatesLibraryList,
    TemplatesTeamList,
    PipelinesTeamList,
    ContactListComponent,
    OverviewComponent,
    OverviewTopComponent,
    OverviewTaskComponent,
    OverviewCoursesComponent,
    OverviewCalendarComponent,
    OverviewReportComponent,
    OverviewMarketingComponent,
    OverviewForYouComponent,
    AgentFilterComponent,
    ConversationsComponent,
    ContactsSphereSortingComponent,
    PageBuilderComponent,
    LandingPagesComponent,
    PageBuilderConvrrtComponent,
    ContactActiveTimelineComponent,
    ContactActionsComponent,
    ContactAgentFireComponent,
    FolderTreeComponent,
    MaterialsNewComponent,
    MaterialsNavigationComponent,
    MaterialsMainComponent,
    MaterialDetailComponent,
    MaterialsTreeViewComponent,
    ContactDetailV2Component,
    ContactMainInfoV2Component,
    LandingPageCreateComponent,
    FilterOptionsListComponent,
    IntegrationVortexComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ComponentsModule,
    RouterModule.forChild(AdminLayoutRoutes),
    TranslateModule.forChild({ extend: true }),
    NgxSpinnerModule,
    DragDropModule,
    NgxGraphModule,
    NgChartsModule,
    PdfViewerModule,
    OverlayModule,
    EmailEditorModule,
    NgxAudioPlayerModule,
    NgxColorsModule,
    // SocketIoModule.forRoot(config),

    CalendarModule.forRoot(
      {
        provide: DateAdapter,
        useFactory: momentAdapterFactory
      },
      {
        dateFormatter: {
          provide: CalendarDateFormatter,
          useClass: CalendarMomentDateFormatter
        }
      }
    ),
    MentionModule,
    ScrollingModule
  ],
  providers: [
    {
      provide: MOMENT,
      useValue: moment
    }
  ],
  schemas: []
})
export class AdminLayoutModule {}
