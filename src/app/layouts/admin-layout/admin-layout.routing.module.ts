import { Routes } from '@angular/router';
import { PageExitGuard } from '@guards/page-exit.guard';
import { HomeComponent } from '@pages/home/home.component';
import { ProfileComponent } from '@pages/profile/profile.component';
import { DealsComponent } from '@pages/deals/deals.component';
import { ContactsComponent } from '@pages/contacts/contacts.component';
import { AutomationsComponent } from '@pages/automations/automations.component';
import { SettingsComponent } from '@pages/settings/settings.component';
import { AffiliateComponent } from '@pages/affiliate/affiliate.component';
import { TeamsComponent } from '@pages/teams/teams.component';
import { TemplatesComponent } from '@pages/templates/templates.component';
import { CalendarComponent } from '@pages/calendar/calendar.component';
import { CalendlyComponent } from '@pages/calendly/calendly.component';
import { ScheduleTypeCreateComponent } from '@pages/schedule-type-create/schedule-type-create.component';
import { DealsDetailComponent } from '@pages/deals-detail/deals-detail.component';
import { VideoCreateComponent } from '@pages/video-create/video-create.component';
import { AutoflowComponent } from '@pages/autoflow/autoflow.component';
import { TeamComponent } from '@pages/team/team.component';
import { TemplateComponent } from '@pages/template/template.component';
import { ThemesComponent } from '@pages/themes/themes.component';
import { ThemeComponent } from '@pages/theme/theme.component';
import { NotificationsListComponent } from '@pages/notifications-list/notifications-list.component';
import { MessagesComponent } from '@pages/messages/messages.component';
import { TestComponent } from '@pages/test/test.component';
import { VerifyEmailComponent } from '@pages/verify-email/verify-email.component';
import { CampaignComponent } from '@pages/campaign/campaign.component';
import { CampaignBulkMailingItemComponent } from '@pages/campaign-bulk-mailing-item/campaign-bulk-mailing-item.component';
import { NewsletterEditorComponent } from '@pages/newsletter-editor/newsletter-editor.component';
import { EmailQueueComponent } from '@pages/email-queue/email-queue.component';
import { ScheduledOneComponent } from '@pages/scheduled-one/scheduled-one.component';
import { CampaignCreateComponent } from '@pages/campaign-create/campaign-create.component';
import { AutomationQueueComponent } from '@pages/automation-queue/automation-queue.component';
import { DealsSettingComponent } from '@pages/deals-setting/deals-setting.component';
import { PipelinesLibraryListComponent } from '@pages/pipelines-library/pipelines-library.component';
import {
  PageBuilderComponent,
  PageBuilderConvrrtComponent
} from '@pages/page-builder/page-builder.component';
import { LandingPagesComponent } from '@app/pages/landing-pages/landing-pages.component';
import { TaskManagerComponent } from '@pages/task-manager/task-manager.component';
import { ContactsImportCsvComponent } from '@pages/contacts-import-csv/contacts-import-csv.component';
import { CallReportComponent } from '@pages/call-report/call-report.component';
import { AnalyticsDashboardComponent } from '@pages/analytics-dashboard/analytics-dashboard.component';
import { RatesSettingComponent } from '@pages/rates-setting/rates-setting.component';
import { ContactManagerComponent } from '@pages/contact-manager/contact-manager.component';
import { SmartCodeComponent } from '@pages/smart-code/smart-code.component';
import { LeadCaptureComponent } from '@pages/lead-capture/lead-capture.component';
import { LeadCaptureFormAddComponent } from '@app/pages/lead-capture-form-add/lead-capture-form-add.component';
import { LeadCaptureFormTrackComponent } from '@app/pages/lead-capture-from-track/lead-capture-from-track.component';
import { TokenManagerComponent } from '@pages/token-manager/token-manager.component';
import { TasksComponent } from '@pages/tasks/tasks.component';
import { AgentFilterComponent } from '@app/pages/agent-filter/agent-filter.component';
import { ConversationsComponent } from '@app/pages/conversations/conversations.component';
import { ContactsSphereSortingComponent } from '@app/pages/contacts-sphere-sorting/contacts-sphere-sorting.component';
import { SignatureSettingComponent } from '@app/pages/signature-setting/signature-setting.component';
import { MaterialsNewComponent } from '@app/pages/materials-new/materials-new.component';
import { MaterialDetailComponent } from '@app/pages/material-detail/material-detail.component';
import { MaterialsMainComponent } from '@app/pages/materials-new/materials-main/materials-main.component';
import { ContactDetailV2Component } from '@app/pages/contact-detail-v2/contact-detail-v2.component';
import { LandingPageDetailComponent } from '@app/pages/landing-page/landing-page.component';
import { LandingPageCreateComponent } from '@app/pages/landing-page-create/landing-page-create.component';

export const AdminLayoutRoutes: Routes = [
  {
    path: 'dashboard',
    component: AnalyticsDashboardComponent,
    data: {
      title: 'Dashboard'
    }
  },
  {
    path: 'dashboard-setting',
    component: RatesSettingComponent,
    data: {
      title: 'Dashboard Setting'
    }
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Tasks'
    }
  },
  {
    path: 'activities',
    component: HomeComponent,
    data: {
      title: 'Activities'
    }
  },
  {
    path: 'tasks',
    component: TasksComponent,
    data: {
      title: 'Tasks'
    }
  },
  {
    path: 'pipeline',
    component: DealsComponent,
    data: {
      title: 'Pipeline'
    }
  },
  {
    path: 'pipeline/pipeline-manager',
    component: DealsSettingComponent,
    data: {
      title: 'Pipeline Manager'
    }
  },
  {
    path: 'pipeline/pipeline-manager/:page',
    component: DealsSettingComponent,
    data: {
      title: 'Pipeline Manager'
    }
  },
  {
    path: 'pipeline/:id',
    component: DealsComponent,
    data: {
      title: 'Pipeline'
    }
  },
  {
    path: 'pipeline/stage/:id',
    component: DealsComponent,
    data: {
      title: 'Pipeline'
    }
  },
  {
    path: 'pipelines-library',
    component: PipelinesLibraryListComponent,
    data: {
      title: 'Pipeline Library'
    }
  },
  {
    path: 'pipelines-library/:team/:folder',
    component: PipelinesLibraryListComponent,
    data: {
      title: 'Pipeline Library'
    }
  },
  {
    path: 'contacts',
    component: ContactsComponent,
    data: {
      title: 'Contacts'
    }
  },
  {
    path: 'contacts/contact-manager/:page',
    component: ContactManagerComponent,
    data: {
      title: 'Contact Manager'
    }
  },
  {
    path: 'contacts/call-report',
    component: CallReportComponent,
    data: {
      title: 'Call Report'
    }
  },
  {
    path: 'sphere',
    component: ConversationsComponent,
    data: {
      title: 'Sphere Conversations'
    }
  },
  {
    path: 'contacts/prepare-import-csv',
    component: ContactsImportCsvComponent,
    data: {
      title: 'Contacts'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'contacts/import-csv',
    component: ContactsComponent,
    data: {
      title: 'Contacts'
    }
  },
  {
    path: 'contacts/sorting',
    component: ContactsSphereSortingComponent,
    data: {
      title: 'Sphere of Influence Sorting'
    }
  },

  {
    path: 'contacts/:id',
    component: ContactDetailV2Component,
    data: {
      title: 'Detail Contact V2',
      id: 'contactDetailV2'
    },
    canDeactivate: [PageExitGuard]
  },

  {
    path: 'materials/create/:mode',
    component: VideoCreateComponent,
    data: {
      title: 'Materials',
      id: 'materialCreate'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'materials/create/:mode/:folder',
    component: VideoCreateComponent,
    data: {
      title: 'Materials'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'materials/analytics/:material_type',
    component: MaterialDetailComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials/analytics/:material_type/:id',
    component: MaterialDetailComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials/analytics/:material_type/:id/:activity',
    component: MaterialDetailComponent,
    data: {
      title: 'Materials'
    }
  },
  {
    path: 'materials',
    component: MaterialsNewComponent,
    children: [
      {
        path: '',
        component: MaterialsMainComponent,
        data: { title: 'Materials' }
      },
      {
        path: ':page',
        component: MaterialsMainComponent,
        data: { title: 'Materials' }
      },
      {
        path: ':page/:team/:folder',
        component: MaterialsMainComponent,
        data: { title: 'Materials' }
      },
      {
        path: ':page/:folder',
        component: MaterialsMainComponent,
        data: { title: 'Materials' }
      }
    ]
  },
  {
    path: 'automations',
    component: AutomationsComponent,
    data: {
      title: 'Automations'
    }
  },
  {
    path: 'automations/:tab',
    component: AutomationsComponent,
    data: {
      title: 'Automations'
    }
  },
  {
    path: 'automations/:tab/:folder',
    component: AutomationsComponent,
    data: {
      title: 'Automations'
    }
  },
  {
    path: 'automations/:tab/:team/:folder',
    component: AutomationsComponent,
    data: {
      title: 'Automations'
    }
  },
  {
    path: 'autoflow/new',
    component: AutoflowComponent,
    data: {
      title: 'Automations',
      id: 'automationDetail'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'autoflow/create/',
    component: AutoflowComponent,
    data: {
      title: 'Automations',
      id: 'automationDetail'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'autoflow/:mode/:id/:team',
    component: AutoflowComponent,
    data: {
      title: 'Automation',
      id: 'automationDetail'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'autoflow/:mode/:id',
    component: AutoflowComponent,
    data: {
      title: 'Automation',
      id: 'automationDetail'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'settings/signature',
    component: SignatureSettingComponent,
    data: {
      title: 'Signature'
    }
  },
  {
    path: 'settings',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'settings/:page',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'community',
    component: TeamsComponent,
    data: {
      title: 'Community'
    }
  },
  {
    path: 'community/:id',
    component: TeamComponent,
    data: {
      title: 'Community',
      id: 'teamDetail'
    }
  },
  {
    path: 'community/:id/:tab/:folder',
    component: TeamComponent,
    data: {
      title: 'Community',
      id: 'teamDetail'
    }
  },
  {
    path: 'templates-list/merged-field-manager',
    component: TokenManagerComponent,
    data: {
      title: 'Template Merge Field Manager'
    }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    data: {
      title: 'Profile'
    }
  },
  {
    path: 'profile/outlook',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'profile/gmail',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'profile/zoom',
    component: SettingsComponent,
    data: {
      title: 'Settings'
    }
  },
  {
    path: 'profile/:page',
    component: ProfileComponent,
    data: {
      title: 'Profile'
    }
  },
  {
    path: 'profile/:page/:action',
    component: ProfileComponent,
    data: {
      title: 'Profile'
    }
  },
  {
    path: 'affiliate',
    component: AffiliateComponent,
    data: {
      title: 'Affiliate'
    }
  },
  {
    path: 'templates/new',
    component: TemplateComponent,
    data: {
      title: 'Template'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'templates/edit/:id',
    component: TemplateComponent,
    data: {
      title: 'Template'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'templates/new/:id',
    component: TemplateComponent,
    data: {
      title: 'Template'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'templates',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'templates/:tab',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'templates/:tab/:folder',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'templates/:tab/:team/:folder',
    component: TemplatesComponent,
    data: {
      title: 'Templates'
    }
  },
  {
    path: 'calendar',
    component: CalendarComponent,
    data: {
      title: 'Calendar'
    }
  },
  {
    path: 'calendar/:action',
    component: CalendarComponent,
    data: {
      title: 'Calendar'
    }
  },
  {
    path: 'calendar/:mode/:year/:month/:day',
    component: CalendarComponent,
    data: {
      title: 'Calendar'
    }
  },
  {
    path: 'lead-hub/scheduler',
    component: CalendlyComponent,
    data: {
      title: 'Scheduler'
    }
  },
  {
    path: 'lead-hub/scheduler/:tab',
    component: CalendlyComponent,
    data: {
      title: 'Scheduler'
    }
  },
  {
    path: 'lead-hub/scheduler/event-type/:id',
    component: ScheduleTypeCreateComponent,
    data: {
      title: 'Scheduler Event Type'
    },
    canDeactivate: [PageExitGuard]
  },
  {
    path: 'lead-hub/websites',
    component: PageBuilderComponent,
    data: {
      title: 'Websites'
    }
  },
  {
    path: 'lead-hub/landing-pages',
    component: LandingPagesComponent,
    data: {
      title: 'Landing Pages'
    }
  },
  {
    path: 'lead-hub/landing-pages/v1',
    component: PageBuilderConvrrtComponent,
    data: {
      title: 'Landing Pages'
    }
  },
  {
    path: 'lead-hub/smart-codes',
    component: SmartCodeComponent,
    data: {
      title: 'Smart Codes'
    }
  },
  {
    path: 'lead-hub/lead-capture',
    component: LeadCaptureComponent,
    data: {
      title: 'Lead Form'
    }
  },
  {
    path: 'lead-hub/lead-capture/create',
    component: LeadCaptureFormAddComponent,
    data: {
      title: 'Create Lead Form'
    }
  },
  {
    path: 'lead-hub/lead-capture/edit/:id',
    component: LeadCaptureFormAddComponent,
    data: {
      title: 'Edit Lead Form'
    }
  },
  {
    path: 'lead-hub/lead-capture/:id',
    component: LeadCaptureFormTrackComponent,
    data: {
      title: 'Form History'
    }
  },
  {
    path: 'lead-hub/agent-filter',
    component: AgentFilterComponent,
    data: {
      title: 'Agent Filter'
    }
  },
  {
    path: 'theme',
    component: ThemesComponent,
    data: {
      title: 'Themes'
    }
  },
  {
    path: 'theme/new',
    component: ThemeComponent,
    data: {
      title: 'Theme'
    }
  },
  {
    path: 'theme/:mode/:id',
    component: ThemeComponent,
    data: {
      title: 'Theme'
    }
  },
  {
    path: 'notifications',
    component: NotificationsListComponent,
    data: {
      title: 'Notifications'
    }
  },
  {
    path: 'scheduled-items',
    component: TaskManagerComponent,
    data: {
      title: 'Scheduled Items'
    }
  },
  {
    path: 'messages',
    component: MessagesComponent,
    data: {
      title: 'Messages'
    }
  },
  {
    path: 'test',
    component: TestComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    data: {
      title: 'Verify Email'
    }
  },
  {
    path: 'bulk-mail',
    component: CampaignComponent,
    data: {
      title: 'Bulk Email'
    }
  },
  {
    path: 'bulk-mail/bulk/create',
    component: CampaignCreateComponent,
    data: {
      title: 'New Bulk Email'
    }
  },
  {
    path: 'bulk-mail/bulk/draft/:id',
    component: CampaignCreateComponent,
    data: {
      title: 'Bulk Email Draft'
    }
  },
  {
    path: 'bulk-mail/:page',
    component: CampaignComponent,
    data: {
      title: 'Bulk Email'
    }
  },
  {
    path: 'bulk-mail/bulk/:id',
    component: CampaignBulkMailingItemComponent,
    data: {
      title: 'Bulk Email'
    }
  },
  {
    path: 'newsletter',
    component: NewsletterEditorComponent,
    data: {
      title: 'Newsletter'
    }
  },
  {
    path: 'newsletter/:mode/:id',
    component: NewsletterEditorComponent,
    data: {
      title: 'Newsletter'
    }
  },
  {
    path: 'email-queue/:id',
    component: EmailQueueComponent,
    data: {
      title: 'Email Queue'
    }
  },
  {
    path: 'text-queue/:id',
    component: EmailQueueComponent,
    data: {
      title: 'Text Queue'
    }
  },
  {
    path: 'automation-queue/:id',
    component: AutomationQueueComponent,
    data: {
      title: 'Automation Assign Queue'
    }
  },
  {
    path: 'oneonone-scheduled',
    component: ScheduledOneComponent,
    data: {
      title: 'Scheduled'
    }
  },
  {
    path: 'lead-hub/landing-pages/create',
    component: LandingPageCreateComponent,
    data: {
      title: 'New Landing Page'
    }
  },
  {
    path: 'lead-hub/landing-pages/edit/:id',
    component: LandingPageCreateComponent,
    data: {
      title: 'Edit Landing Page'
    }
  },
  {
    path: 'lead-hub/landing-pages/:id',
    component: LandingPageDetailComponent,
    data: {
      title: 'Landing Page Detail'
    }
  }
];
