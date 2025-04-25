import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { TopbarComponent } from '@partials/topbar/topbar.component';
import { NavbarComponent } from '@partials/navbar/navbar.component';
import { SidebarComponent } from '@partials/sidebar/sidebar.component';
import { SlideTabComponent } from '@components/slide-tab/slide-tab.component';
import { TabOptionComponent } from '@components/tab-option/tab-option.component';
import { ActionsBarComponent } from '@components/actions-bar/actions-bar.component';
import { AvatarEditorComponent } from '@components/avatar-editor/avatar-editor.component';
import { NgxCropperJsModule } from 'ngx-cropperjs-wrapper';
import { SharedModule } from '@layouts/shared/shared.module';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { ConfirmBulkMaterialsComponent } from '@components/confirm-bulk-materials/confirm-bulk-materials.component';
import { TeamEditComponent } from '@components/team-edit/team-edit.component';
import { TeamDeleteComponent } from '@components/team-delete/team-delete.component';
import { InputContactsComponent } from '@components/input-contacts/input-contacts.component';
import { SelectContactComponent } from '@components/select-contact/select-contact.component';
import { InputAutomationComponent } from '@components/input-automation/input-automation.component';
import { InputTemplateComponent } from '@components/input-template/input-template.component';
import { InputTeamMembersComponent } from '@app/components/input-team-members/input-team-members.component';
import { SelectLeaderComponent } from '@components/select-leader/select-leader.component';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import { CalendarEventComponent } from '@components/calendar-event/calendar-event.component';
import { CalendarRecurringDialogComponent } from '@components/calendar-recurring-dialog/calendar-recurring-dialog.component';
import { DataEmptyComponent } from '@components/data-empty/data-empty.component';
import { CampaignAddListComponent } from '@components/campaign-add-list/campaign-add-list.component';
import { CampaignAddContactComponent } from '@components/campaign-add-contact/campaign-add-contact.component';
import { UploadContactsComponent } from '@components/upload-contacts/upload-contacts.component';
import { DownloadContactsProgreeBarComponent } from '@components/contact-download-progress-bar/contact-download-progress-bar.component';
import { TaskCreateComponent } from '@components/task-create/task-create.component';
import { NoteCreateComponent } from '@components/note-create/note-create.component';
import { CalendarDeclineComponent } from '@components/calendar-decline/calendar-decline.component';
import { JoinTeamComponent } from '@components/join-team/join-team.component';
import { InviteTeamComponent } from '@components/invite-team/invite-team.component';
import { SearchUserComponent } from '@components/search-user/search-user.component';
import { CaseConfirmComponent } from '@components/case-confirm/case-confirm.component';
import { CaseConfirmPercentComponent } from '@components/case-confirm-percent/case-confirm-percent.component';
import { LabelSelectComponent } from '@components/label-select/label-select.component';
import { AssigneeSelectComponent } from '@components/assignee-select/assignee-select.component';
import { CampaignAddBroadcastComponent } from '@components/campaign-add-broadcast/campaign-add-broadcast.component';
import { MailListComponent } from '@components/mail-list/mail-list.component';
import { CustomFieldAddComponent } from '@components/custom-field-add/custom-field-add.component';
import { CustomFieldDeleteComponent } from '@components/custom-field-delete/custom-field-delete.component';
import { AutomationAssignComponent } from '@components/automation-assign/automation-assign.component';
import { ContactAutomationAssignModalComponent } from './contact-detail-v2/contact-data-list-container/contact-automation-assign-modal/contact-automation-assign-modal.component';
import { LinkContactAssignComponent } from '@components/link-contact-assign/link-contact-assign.component';
import { MaterialAddComponent } from '@components/material-add/material-add.component';
import { NotifyComponent } from '@components/notify/notify.component';
import { SafeHtmlPipe } from '@pipes/safe-html.pipe';
import { ShareSiteComponent } from '@components/share-site/share-site.component';
import { AssistantCreateComponent } from '@components/assistant-create/assistant-create.component';
import { AssistantPasswordComponent } from '@components/assistant-password/assistant-password.component';
import { AssistantRemoveComponent } from '@components/assistant-remove/assistant-remove.component';
import { TagEditComponent } from '@pages/tag-manager/tag-edit/tag-edit.component';
import { TagDeleteComponent } from '@pages/tag-manager/tag-delete/tag-delete.component';
import { MaterialEditTemplateComponent } from '@components/material-edit-template/material-edit-template.component';
import { MaterialShareComponent } from '@components/material-share/material-share.component';
import { VideoEditComponent } from '@components/video-edit/video-edit.component';
import { PdfEditComponent } from '@components/pdf-edit/pdf-edit.component';
import { ImageEditComponent } from '@components/image-edit/image-edit.component';
import { ManageLabelComponent } from '@components/manage-label/manage-label.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { RecordSettingDialogComponent } from '@components/record-setting-dialog/record-setting-dialog.component';
import { TeamCreateComponent } from '@components/team-create/team-create.component';
import { AdvancedFilterComponent } from '@components/advanced-filter/advanced-filter.component';
import { TaskFilterComponent } from '@components/task-filter/task-filter.component';
import { ContactBulkComponent } from '@components/contact-bulk/contact-bulk.component';
import { TaskTypeComponent } from '@components/task-type/task-type.component';
import { InputTagComponent } from '@components/input-tag/input-tag.component';
import { LabelEditColorComponent } from '@components/label-edit-color/label-edit-color.component';
import { LabelEditComponent } from '@components/label-edit/label-edit.component';
import { ContactMergeComponent } from '@components/contact-merge/contact-merge.component';
import { InputSourceComponent } from '@components/input-source/input-source.component';
import { InputCompanyComponent } from '@components/input-company/input-company.component';
import { ImportContactMergeComponent } from '@components/import-contact-merge/import-contact-merge.component';
import { AutomationShowFullComponent } from '@components/automation-show-full/automation-show-full.component';
import { AutomationTreeOverlayComponent } from '@components/automation-tree-overlay/automation-tree-overlay.component';
import { MaterialSendComponent } from '@components/material-send/material-send.component';
import { ImportContactMergeConfirmComponent } from '@components/import-contact-merge-confirm/import-contact-merge-confirm.component';
import { DealCreateComponent } from '@components/deal-create/deal-create.component';
import { ScheduleSendComponent } from '@components/schedule-send/schedule-send.component';
import { ScheduleSelectComponent } from '@components/schedule-select/schedule-select.component';
import { DealTimeDurationComponent } from '@components/deal-time-duration/deal-time-duration.component';
import { DealAutomationComponent } from '@components/deal-automation/deal-automation.component';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { AccordionComponent } from '@components/accordion/accordion.component';
import { SmartCodeAddComponent } from '@components/smart-code-add/smart-code-add.component';
import { TaskEditComponent } from '@components/task-edit/task-edit.component';
import { FilterAddComponent } from '@components/filter-add/filter-add.component';
import { ContactAssignAutomationComponent } from '@components/contact-assign-automation/contact-assign-automation.component';
import { TaskBulkComponent } from '@components/task-bulk/task-bulk.component';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { AssignmentDialogComponent } from '@app/components/assignment-dialog/assignment-dialog.component';
import { AdditionalEditComponent } from '@components/additional-edit/additional-edit.component';
import { ActionsHeaderComponent } from '@components/actions-header/actions-header.component';
import { NoteEditComponent } from '@components/note-edit/note-edit.component';
import { TaskDeleteComponent } from '@components/task-delete/task-delete.component';
import { DealStageCreateComponent } from '@components/deal-stage-create/deal-stage-create.component';
import { TeamContactShareComponent } from '@components/team-contact-share/team-contact-share.component';
import { SelectMemberComponent } from '@components/select-member/select-member.component';
import { PlanSelectComponent } from '@components/plan-select/plan-select.component';
import { PlanBuyComponent } from '@components/plan-buy/plan-buy.component';
import { DealStageDeleteComponent } from '@components/deal-stage-delete/deal-stage-delete.component';
import { DealEditComponent } from '@components/deal-edit/deal-edit.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { DateCustomInputComponent } from '@components/date-custom-input/date-custom-input.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { AutomationStatusComponent } from '@components/automation-status/automation-status.component';
import { ContactMergeLabelComponent } from '@components/contact-merge-label/contact-merge-label.component';
import { InputCountryComponent } from '@components/input-country/input-country.component';
import { InputStateComponent } from '@components/input-state/input-state.component';
import { DealContactComponent } from '@components/deal-contact/deal-contact.component';
import { SelectTeamComponent } from '@components/select-team/select-team.component';
import { ContactShareComponent } from '@components/contact-share/contact-share.component';
import { FilterInputComponent } from '@components/filter-input/filter-input.component';
import { StageInputComponent } from '@components/stage-input/stage-input.component';
import { SelectCalendarComponent } from '@components/select-calendar/select-calendar.component';
import { FolderComponent } from '@components/folder/folder.component';
import { MoveFolderComponent } from '@components/move-folder/move-folder.component';
import { InputContactChipComponent } from '@components/input-contact-chip/input-contact-chip.component';
import { DetailErrorComponent } from '@components/detail-error/detail-error.component';
import { MaterialBrowserComponent } from '@components/material-browser/material-browser.component';
import { GlobalSearchComponent } from '@components/global-search/global-search.component';
import { PurchaseMessageComponent } from '@components/purchase-message/purchase-message.component';
import { AddPhoneComponent } from '@components/add-phone/add-phone.component';
import { DeleteFolderComponent } from '@components/delete-folder/delete-folder.component';
import { SendTextComponent } from '@components/send-text/send-text.component';
import { TemplateSelectorComponent } from '@components/template-selector/template-selector.component';
import { TokenSelectorComponent } from '@components/token-selector/token-selector.component';
import { ZapierDialogComponent } from '@components/zapier-dialog/zapier-dialog.component';
import { CalendlyDialogComponent } from '@components/calendly-dialog/calendly-dialog.component';
import { CalendlyListComponent } from '@components/calendly-list/calendly-list.component';
import { InputEmailChipComponent } from '@components/input-email-chip/input-email-chip.component';
import { TemplateCreateComponent } from '@components/template-create/template-create.component';
import { SocialShareComponent } from '@components/social-share/social-share.component';
import { TeamMaterialShareComponent } from '@components/team-material-share/team-material-share.component';
import { TemplateBrowserComponent } from '@components/template-browser/template-browser.component';
import { AutomationBrowserComponent } from '@components/automation-browser/automation-browser.component';
import { AutomationDetailOverlayComponent } from '@components/automation-detail-overlay/automation-detail-overlay.component';
import { TeamMemberProfileComponent } from '@components/team-member-profile/team-member-profile.component';
import { AdditionalFieldsComponent } from '@components/additional-fields/additional-fields.component';
import { AutomationShareComponent } from '@components/automation-share/automation-share.component';
import { MemberSelectorComponent } from '@components/member-selector/member-selector.component';
import { CardComponent } from '@components/card/card.component';
import { PaymentCardComponent } from '@components/payment-card/payment-card.component';
import { MaterialTimelinesComponent } from '@components/material-timelines/material-timelines.component';
import { DealTimelinesComponent } from '@components/deal-timelines/deal-timelines.component';
import { EmailTimelinesComponent } from '@components/email-timelines/email-timelines.component';
import { TextTimelinesComponent } from '@components/text-timelines/text-timelines.component';
import { PlayTimelinesComponent } from '@components/play-timelines/play-timelines.component';
import { InputContactDealComponent } from '@components/input-contact-deal/input-contact-deal.component';
import { SubscriptionCancelReasonComponent } from '@components/subscription-cancel-reason/subscription-cancel-reason.component';
import { StripeModule } from 'stripe-angular';
import { STRIPE_KEY } from '@constants/variable.constants';
import { UpgradePlanErrorComponent } from '@components/upgrade-plan-error/upgrade-plan-error.component';
import { PaymentFailedErrorComponent } from '@components/payment-failed-error/payment-failed-error.component';
import { DialPlanComponent } from '@components/dial-plan/dial-plan.component';
import { StopShareContactComponent } from '@components/stop-share-contact/stop-share-contact.component';
import { MessageFilesComponent } from '@components/message-files/message-files.component';
import { ConnectNewCalendarComponent } from '@components/connect-new-calendar/connect-new-calendar.component';
import { InputStageComponent } from '@components/input-stage/input-stage.component';
import { CalendarMoreEventComponent } from '@components/calendar-more-event/calendar-more-event.component';
import { ScheduleEventTypeComponent } from '@components/schedule-event-type/schedule-event-type.component';
import { ScheduleLocationEditComponent } from '@components/schedule-location-edit/schedule-location-edit.component';
import { SelectCompanyComponent } from '@components/select-company/select-company.component';
import { AddUserComponent } from '@components/add-user/add-user.component';
import { CodeInputModule } from 'angular-code-input';
import { VerifyCodeConfirmComponent } from '@components/verify-code-confirm/verify-code-confirm.component';
import { CompanyInputComponent } from '@components/company-input/company-input.component';
import { BuyAccountComponent } from '@components/buy-account/buy-account.component';
import { FormatProfileComponent } from '@components/format-profile/format-profile.component';
import { CaseMaterialConfirmComponent } from '@components/case-material-confirm/case-material-confirm.component';
import { CalendarSettingComponent } from '@components/calendar-setting/calendar-setting.component';
import { ImportTemplatesComponent } from '@components/import-templates/import-templates.component';
import { ContactDeleteComponent } from '@components/contact-delete/contact-delete.component';
import { AutomationItemComponent } from './contact-detail-v2/contact-data-list-container/automation-item/automation-item.component';
import { DataListComponent } from './contact-detail-v2/contact-data-list-container/data-list/data-list.component';
import { TaskListComponent } from './contact-detail-v2/contact-data-list-container/task-list/task-list.component';
import { LabelDisplayComponent } from '@components/label-display/label-display.component';
import { ConfirmPrimaryContactComponent } from '@components/confirm-primary-contact/confirm-primary-contact.component';
import { DialerLogComponent } from '@components/dialer-log/dialer-log.component';
import { SmsSubscribeComponent } from '@components/sms-subscribe/sms-subscribe.component';
import { DialerReportComponent } from '@components/dialer-report/dialer-report.component';
import { SelectAutomationComponent } from '@components/select-automation/select-automation.component';
import { DialerCallComponent } from '@components/dialer-call/dialer-call.component';
import { CreateCallLabelComponent } from '@components/create-call-label/create-call-label.component';
import { ForwardEmailComponent } from '@components/forward-email/forward-email.component';
import { AccountSettingComponent } from '@components/account-setting/account-setting.component';
import { AccountPasswordComponent } from '@components/account-password/account-password.component';
import { TemplatesBrowserComponent } from '@components/templates-browser/templates-browser.component';
import { NotificationAlertComponent } from '@components/notification-alert/notification-alert.component';
import { ToastrComponent } from '@components/toastr/toastr.component';
import { IntroModalComponent } from '@components/intro-modal/intro-modal.component';
import { UserInsightsComponent } from '@pages/user-insights/user-insights.component';
import { DealMoveComponent } from '@components/deal-move/deal-move.component';
import { SelectContactListComponent } from '@components/select-contact-list/select-contact-list.component';
import { UserflowCongratComponent } from '@components/userflow-congrat/userflow-congrat.component';
import { LeadCaptureFormComponent } from '@components/lead-capture-form/lead-capture-form.component';
import { CaptureFieldAddComponent } from '@components/capture-field-add/capture-field-add.component';
import { AssetsManagerComponent } from '@components/assets-manager/assets-manager.component';
import { AddActionComponent } from '@components/add-action/add-action.component';
import { EditActionComponent } from '@components/edit-action/edit-action.component';
import { SelectBranchComponent } from '@components/select-branch/select-branch.component';
import { DealStageUpdateComponent } from '@components/deal-stage-update/deal-stage-update.component';
import { PipelineCreateComponent } from '@components/pipeline-create/pipeline-create.component';
import { EventTypeAutomationComponent } from '@components/event-type-automation/event-type-automation.component';
import { EventTypeTagsComponent } from '@components/event-type-tags/event-type-tags.component';
import { PipelineRenameComponent } from '@components/pipeline-rename/pipeline-rename.component';
import { TaskRecurringDialogComponent } from '@components/task-recurring-dialog/task-recurring-dialog.component';
import { DeletePipelineComponent } from '@components/delete-pipeline/delete-pipeline.component';
import { ChangeFolderComponent } from '@components/change-folder/change-folder.component';
import { RemoveFolderComponent } from '@components/remove-folder/remove-folder.component';
import { ConfirmRemoveAutomationComponent } from '@components/confirm-remove-automation/confirm-remove-automation.component';
import { CaseConfirmKeepComponent } from '@components/case-confirm-keep/case-confirm-keep.component';
import { InputEventTypeComponent } from '@components/input-event-type/input-event-type.component';
import { ScheduleSettingComponent } from '@components/schedule-setting/schedule-setting.component';
import { ActionImpossibleNotificationComponent } from '@components/action-impossible-notification/action-impossible-notification.component';
import { MaterialChangeComponent } from '@components/material-change/material-change.component';
import { AudioNoteComponent } from '@components/audio-note/audio-note.component';
import { ConfirmShareContactsComponent } from '@components/confirm-share-contacts/confirm-share-contacts.component';
import { ConfirmBulkTemplatesComponent } from '@components/confirm-bulk-templates/confirm-bulk-templates.component';
import { InlineNoteEditorComponent } from '@components/inline-note-editor/inline-note-editor.component';
import { UnassignBulkAutomation } from '@components/unassign-bulk-automation/unassign-bulk-automation.component';
import { TeamSettingComponent } from '@components/team-setting/team-setting.component';
import { SaveTemplateComponent } from '@components/save-template/save-template.component';
import { AuthorizeCodeConfirmComponent } from '@components/authorize-code-confirm/authorize-code-confirm.component';
import { DealCustomFieldEdit } from '@components/deal-custom-field-edit/deal-custom-field-edit.component';
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarMomentDateFormatter,
  DateAdapter,
  MOMENT
} from 'angular-calendar';
import moment from 'moment-timezone';
import { MentionModule } from 'angular-mentions';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
import { TagContactsListComponent } from '@pages/tag-manager/tag-contacts-list/tag-contacts-list.component';
import { TagMergeComponent } from '@pages/tag-manager/tag-merge/tag-merge.component';
import { LabelContactsListComponent } from '@pages/label-manager/label-contacts-list/label-contacts-list.component';
import { LabelMergeComponent } from '@components/label-merge/label-merge.component';
import { InputLabelComponent } from '@components/input-label/input-label.component';
import { CustomFieldContactsListComponent } from '@pages/custom-fields/custom-field-contacts-list/custom-field-contacts-list.component';
import { UpdateDuplicatedContactComponent } from '@pages/contacts-import-csv/update-duplicated-contact/update-duplicated-contact.component';
import { ReviewToUploadComponent } from '@pages/contacts-import-csv/review-to-upload/review-to-upload.component';
import { DuplicateContactsCsvFileComponent } from '@pages/contacts-import-csv/duplicate-contacts-csv-file/duplicate-contacts-csv-file.component';
import { MatchColumnComponent } from '@pages/contacts-import-csv/match-column/match-column.component';
import { DuplicateContactsListComponent } from '@pages/contacts-import-csv/duplicate-contacts-list/duplicate-contacts-list.component';
import { UploadImportedContactsComponent } from '@components/upload-imported-contacts/upload-imported-contacts.component';
import { UpdateDuplicatedContactsCsvComponent } from '@pages/contacts-import-csv/update-duplicated-contacts-csv/update-duplicated-contacts-csv.component';
import { InputDealStageComponent } from '@components/input-deal-stage/input-deal-stage.component';
import { InvalidContactsComponent } from '@pages/contacts-import-csv/invalid-contacts/invalid-contacts.component';
import { EditUserComponent } from '@components/edit-user/edit-user.component';
import { ConfirmLeaveTeamComponent } from '@components/confirm-leave-team/confirm-leave-team.component';
import { ConfirmMoveContactsComponent } from '@components/confirm-move-contacts/confirm-move-contacts.component';
import { CustomFieldsMergeComponent } from '@components/custom-fields-merge/custom-fields-merge.component';
import { SelectComponent } from '@components/select/select.component';
import { AliasDialogComponent } from '@components/alias-dialog/alias-dialog.component';
import { EmailSenderComponent } from '@components/email-sender/email-sender.component';
import { CreateDealsComponent } from '@pages/contacts-import-csv/create-deals/create-deals.component';
import { TokenManagerComponent } from '@pages/token-manager/token-manager.component';
import { CreateTokenComponent } from '@components/create-token/create-token.component';
import { DeleteTokenComponent } from '@components/delete-token/delete-token.component';
import { RatingsComponent } from '@components/ratings/ratings.component';
import { ContactManagerComponent } from '@pages/contact-manager/contact-manager.component';
import { RemoveActionComponent } from '@components/remove-action/remove-action.component';
import { DuplicateDealsComponent } from '@pages/contacts-import-csv/duplicate-deals/duplicate-deals.component';
import { EditDealComponent } from '@components/edit-deal/edit-deal.component';
import { MergeDealsComponent } from '@components/merge-deals/merge-deals.component';
import { FilterOptionsComponent } from '@components/filter-options/filter-options.component';
import { SelectContactConditionComponent } from '@components/select-contact-condition/select-contact-condition.component';
import { AdvancedFilterLabelComponent } from '@components/advanced-filter-label/advanced-filter-label.component';
import { AdvancedFilterOptionComponent } from '@components/advanced-filter-option/advanced-filter-option.component';
import { AdvancedFilterMaterialComponent } from '@components/advanced-filter-material/advanced-filter-material.component';
import { AdvancedFilterCountryComponent } from '@components/advanced-filter-country/advanced-filter-country.component';
import { AdvancedFilterStateComponent } from '@components/advanced-filter-state/advanced-filter-state.component';
import { AdvancedFilterCityComponent } from '@components/advanced-filter-city/advanced-filter-city.component';
import { AdvancedFilterZipcodeComponent } from '@components/advanced-filter-zipcode/advanced-filter-zipcode.component';
import { AdvancedFilterSourceComponent } from '@components/advanced-filter-source/advanced-filter-source.component';
import { AdvancedFilterCompanyComponent } from '@components/advanced-filter-company/advanced-filter-company.component';
import { AdvancedFilterTagComponent } from '@components/advanced-filter-tag/advanced-filter-tag.component';
import { AdvancedFilterStageComponent } from '@components/advanced-filter-stage/advanced-filter-stage.component';
import { AdvancedFilterActivityComponent } from '@components/advanced-filter-activity/advanced-filter-activity.component';
import { AdvancedFilterTeamComponent } from '@components/advanced-filter-team/advanced-filter-team.component';
import { AdvancedFilterAssigneeComponent } from '@components/advanced-filter-assignee/advanced-filter-assignee.component';
import { ConfirmBusinessComponent } from '@components/confirm-business-hour/confirm-business-hour.component';
import { LeadCaptureFormDelayComponent } from '@components/lead-capture-form-delay/lead-capture-form-delay.component';
import { ChatGptWizardComponent } from './chatgpt-wizard/chatgpt-wizard.component';
import { ChatGptExtendComponent } from './chatgpt-extend/chatgpt-extend.component';
import { ChatGptButtonComponent } from './chatgpt-button/chatgpt-button.component';
import { ChatGptCompareBlockComponent } from './chatgpt-compare-block/chatgpt-compare-block.component';
import { PersonalitySelectorComponent } from './personality-selector/personality-selector.component';
import { PersonalityManagerComponent } from './personality-manager/personality-manager.component';
import { ColumnEditComponent } from '@components/column-edit/column-edit.component';
import { SelectDealComponent } from '@components/select-deal/select-deal.component';
import { ConfirmBulkAutomationComponent } from '@components/confirm-bulk-automation/confirm-bulk-automation.component';
import { ResetDateTimeComponent } from '@components/reset-date-time/reset-date-time.component';
import { ResourceFilters } from '@components/resource-filters/resource-filters.component';
import { AutoCompleteTaskComponent } from '@components/auto-complete-task/auto-complete-task.component';
import { BusinessDateTimePickerComponent } from '@components/business-date-time-picker/business-date-time-picker.component';
import { ConfirmToAddComponent } from '@components/confirm-to-add/confirm-to-add.component';
import { TaskFilterOptionComponent } from '@components/task-filter-option/task-filter-option.component';
import { TaskGlobalFilterComponent } from '@components/task-global-filter/task-global-filter.component';
import { TaskStatusFilterComponent } from '@components/task-status-filter/task-status-filter.component';
import { TaskDescriptionContactFilterComponent } from '@components/task-description-contact-filter/task-description-contact-filter.component';
import { TaskDatetimeFilterComponent } from '@components/task-datetime-filter/task-datetime-filter.component';
import { TaskTypeFilterComponent } from '@components/task-type-filter/task-type-filter.component';
import { TaskFilterOptionsComponent } from '@components/task-filter-options/task-filter-options.component';
import { CreateEmbededMaterialComponent } from '@components/create-embeded-material/create-embeded-material.component';
import { CreateEmbededFormComponent } from './create-embeded-form/create-embeded-form.component';
import { CustomToastComponent } from '@components/custom-toast/custom-toast.component';
import { VortexLogoutComponent } from '@components/vortex-logout/vortex-logout.component';
import { AdvancedFilterCustomFieldComponent } from '@components/advanced-filter-custom-field/advanced-filter-custom-field.component';
import { InputAssigneeComponent } from '@components/input-assignee/input-assignee.component';
import { AssignTimelineContactsComponent } from '@components/assign-timeline-contacts/assign-timeline-contacts.component';
import { DealDetailComponent } from './deal-detail/deal-detail.component';
import { DealInfoComponent } from './deal-info/deal-info.component';
import { DealHistoryComponent } from './deal-history/deal-history.component';
import { ContactMoveComponent } from './contact-move/contact-move.component';
import { PipelineBrowserComponent } from './pipeline-browser/pipeline-browser.component';
import { CustomFieldMatchComponent } from './custom-field-match/custom-field-match.component';
import { TeamContactMoveComponent } from './team-contact-move/team-contact-move.component';
import { AgentFilterAddComponent } from './agent-filter-add/agent-filter-add.component';
import { TwilioBrandManager } from '@app/partials/globals/twilio-brand-manager/twilio-brand-manager.component';
import { BucketListComponent } from './bucket-list/bucket-list.component';
import { BucketItemComponent } from './bucket-item/bucket-item.component';
import { ConversationItemComponent } from './conversation-item/conversation-item.component';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { BucketCreateComponent } from './bucket-create/bucket-create.component';
import { SphereContactComponent } from './sphere-contact/sphere-contact.component';
import { AdvancedFilterUnsubscribedComponent } from './advanced-filter-unsubscribed/advanced-filter-unsubscribed.component';
import { AdvancedFilterAutomationComponent } from './advanced-filter-automation/advanced-filter-automation.component';
import { DealsListComponent } from '@app/pages/deals-list/deals-list.component';
import { NewLandingPageComponent } from './new-landing-page/new-landing-page.component';
import { LandingPageSendComponent } from './landing-page-send/landing-page-send.component';
import { ConfirmCustomTokenComponent } from './confirm-custom-token/confirm-custom-token.component';
import { ContactActivitySuperItemComponent } from './contact-detail/contact-activity-super-item/contact-activity-super-item.component';
import { ContactEmailActionItemComponent } from './contact-detail/contact-email-action-item/contact-email-action-item.component';
import { ContactNoteActionItemComponent } from './contact-detail/contact-note-action-item/contact-note-action-item.component';
import { ContactDealActionItemComponent } from './contact-detail/contact-deal-action-item/contact-deal-action-item.component';
import { ContactTaskActionItemComponent } from './contact-detail/contact-task-action-item/contact-task-action-item.component';
import { ContactMeetingActionItemComponent } from './contact-detail/contact-meeting-action-item/contact-meeting-action-item.component';
import { ContactCallActionItemComponent } from './contact-detail/contact-call-action-item/contact-call-action-item.component';
import { ContactAutomationActionItemComponent } from './contact-detail/contact-automation-action-item/contact-automation-action-item.component';

import { ActionSessionListComponent } from './contact-detail/action-session-list/action-session-list.component';
import { ContactMaterialListComponent } from './contact-detail/contact-material-list/contact-material-list.component';
import { ContactTextActionItemComponent } from './contact-detail/contact-text-action-item/contact-text-action-item.component';
import { ContactEventActionItemComponent } from './contact-detail/contact-event-action-item/contact-event-action-item.component';
import { ContactActivityActionItemComponent } from './contact-detail/contact-activity-action-item/contact-activity-action-item.component';
import { WavvConnectorComponent } from '../partials/globals/wavv-connector/wavv-connector.component';
import { ContactUniversalActionItemComponent } from './contact-detail/contact-universal-action-item/contact-universal-action-item.component';
import { MaterialBrowserV2Component } from './material-browser-v2/material-browser-v2.component';
import { IntegrationDialogComponent } from './integration-dialog/integration-dialog.component';
import { MaterialProgressStatusComponent } from './material-progress-status/material-progress-status.component';
import { ScheduleResendComponent } from './schedule-resend/schedule-resend.component';
import { ContactActivityListContainerComponent } from './contact-detail-v2/contact-activity-list-container/contact-activity-list-container.component';
import { ContactDataListContainerComponent } from './contact-detail-v2/contact-data-list-container/contact-data-list-container.component';
import { ContactDetailFooterComponent } from './contact-detail-v2/contact-detail-footer/contact-detail-footer.component';
import { ContactDetailActionHeaderComponent } from './contact-detail-v2/contact-detail-action-header/contact-detail-action-header.component';
import { BackButtonComponent } from '@app/pages/back-button/back-button.component';
import { InlineSendEmailComponent } from './inline-send-email/inline-send-email.component';
import { InlineSendTextComponent } from './inline-send-text/inline-send-text.component';
import { ContactActionListComponent } from './contact-detail-v2/contact-action-list/contact-action-list.component';
import { ContactActivityListComponent } from './contact-detail-v2/contact-activity-list/contact-activity-list.component';
import { ContactCreateEditComponent } from './contact-create-edit/contact-create-edit.component';
import { InputContactEmailPhoneChipComponent } from './input-contact-email-phone-chip/input-contact-email-phone-chip.component';
import { AddressInputComponent } from './contact-create-edit/address-input.component';
import { SelectLeadFormComponent } from './select-lead-form/select-lead-form.component';
import { MaterialCreateComponent } from './material-create/material-create.component';
import { MaterialPreviewV2Component } from './material-preview-v2/material-preview-v2.component';
import { MaterialViewerHistoryComponent } from './material-preview-v2/material-viewer-history/material-viewer-history.component';
import { MaterialLandingPageListComponent } from './material-preview-v2/material-landing-page-list/material-landing-page-list.component';
import { LandingPageBrowserComponent } from './landing-page-browser/landing-page-browser.component';
import { ContactInputTagComponent } from './contact-input-tag/contact-input-tag.component';
import { ContactActionUserComponent } from './contact-detail/contact-action-user/contact-action-user.component';
import { SelectStageComponent } from './select-stage/select-stage.component';
import { DealsPreferenceComponent } from '@app/pages/deals-setting/deals-preference/deals-preference';
import { AvatarContactsComponent } from '@components/avatar-contacts/avatar-contacts.component';
import { AvatarTeamMembersComponent } from '@components/avatar-team-members/avatar-team-members.component';
import { AutomationHeaderUpdateComponent } from '@components/automation-header-update/automation-header-update.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { StartTriggerComponent } from './start-trigger/start-trigger.component';
import { AutomationTriggerMaterialComponent } from '@components/automation-trigger-material/automation-trigger-material.component';
import { TriggerLeadFormComponent } from './trigger-lead-form/trigger-lead-form.component';
import { AutomationTriggerOverlayComponent } from './automation-trigger-overlay/automation-trigger-overlay.component';
import { CollapsableSettingsComponent } from './collapsable-settings/collapsable-settings.component';
import { RegisterWebinerComponent } from './register-webiner/register-webiner.component';
import { UserOnboardingComponent } from './user-onboarding/user-onboarding-component';
import { OnboardingSettingComponent } from './onboarding-setting/onboarding-setting.component';
import { NavLinkComponent } from '@components/nav-link/nav-link.component';

export function momentAdapterFactory() {
  return adapterFactory(moment);
}
@NgModule({
  declarations: [
    TopbarComponent,
    NavbarComponent,
    SidebarComponent,
    TwilioBrandManager,
    SlideTabComponent,
    TabOptionComponent,
    ActionsBarComponent,
    AvatarEditorComponent,
    ConfirmComponent,
    ConfirmBulkMaterialsComponent,
    TeamEditComponent,
    TeamDeleteComponent,
    InputContactsComponent,
    SelectContactComponent,
    InputAutomationComponent,
    InputTemplateComponent,
    InputTeamMembersComponent,
    SelectLeaderComponent,
    DataEmptyComponent,
    ConfirmComponent,
    SelectLeaderComponent,
    CalendarEventDialogComponent,
    CalendarEventComponent,
    CalendarRecurringDialogComponent,
    CampaignAddListComponent,
    CampaignAddContactComponent,
    UploadContactsComponent,
    DownloadContactsProgreeBarComponent,
    ContactCreateEditComponent,
    AddressInputComponent,
    TaskCreateComponent,
    NoteCreateComponent,
    CalendarDeclineComponent,
    JoinTeamComponent,
    InviteTeamComponent,
    SearchUserComponent,
    CaseConfirmComponent,
    CaseConfirmPercentComponent,
    LabelSelectComponent,
    AssigneeSelectComponent,
    CampaignAddBroadcastComponent,
    MailListComponent,
    CustomFieldAddComponent,
    CustomFieldDeleteComponent,
    AutomationAssignComponent,
    ContactAutomationAssignModalComponent,
    LinkContactAssignComponent,
    MaterialAddComponent,
    NotifyComponent,
    SafeHtmlPipe,
    ShareSiteComponent,
    AssistantCreateComponent,
    AssistantPasswordComponent,
    AssistantRemoveComponent,
    TagEditComponent,
    TagDeleteComponent,
    TagMergeComponent,
    MaterialEditTemplateComponent,
    MaterialShareComponent,
    VideoEditComponent,
    MaterialCreateComponent,
    PdfEditComponent,
    ImageEditComponent,
    ManageLabelComponent,
    RecordSettingDialogComponent,
    TeamCreateComponent,
    AdvancedFilterComponent,
    TaskFilterComponent,
    ContactBulkComponent,
    TaskTypeComponent,
    InputTagComponent,
    LabelEditColorComponent,
    LabelEditComponent,
    ContactMergeComponent,
    InputSourceComponent,
    InputCompanyComponent,
    ImportContactMergeComponent,
    AutomationShowFullComponent,
    AutomationTreeOverlayComponent,
    MaterialSendComponent,
    LandingPageSendComponent,
    ImportContactMergeConfirmComponent,
    DealCreateComponent,
    ScheduleSendComponent,
    ScheduleSelectComponent,
    DealTimeDurationComponent,
    DealAutomationComponent,
    HtmlEditorComponent,
    AccordionComponent,
    SmartCodeAddComponent,
    FilterAddComponent,
    ContactAssignAutomationComponent,
    TaskEditComponent,
    TaskBulkComponent,
    SendEmailComponent,
    AssignmentDialogComponent,
    AdditionalEditComponent,
    ActionsHeaderComponent,
    NoteEditComponent,
    TaskDeleteComponent,
    DealStageCreateComponent,
    TeamContactShareComponent,
    SelectMemberComponent,
    PlanSelectComponent,
    PlanBuyComponent,
    DealStageDeleteComponent,
    DealEditComponent,
    DateInputComponent,
    DateCustomInputComponent,
    AutomationStatusComponent,
    ContactMergeLabelComponent,
    InputCountryComponent,
    InputStateComponent,
    ContactMergeLabelComponent,
    DealContactComponent,
    SelectTeamComponent,
    ContactShareComponent,
    FilterInputComponent,
    StageInputComponent,
    SelectCalendarComponent,
    FolderComponent,
    MoveFolderComponent,
    InputContactChipComponent,
    DetailErrorComponent,
    ScheduleResendComponent,
    MaterialBrowserComponent,
    GlobalSearchComponent,
    PurchaseMessageComponent,
    AddPhoneComponent,
    DeleteFolderComponent,
    SendTextComponent,
    TemplateSelectorComponent,
    TokenSelectorComponent,
    ChatGptWizardComponent,
    ChatGptExtendComponent,
    ChatGptButtonComponent,
    ChatGptCompareBlockComponent,
    PersonalitySelectorComponent,
    PersonalityManagerComponent,
    ZapierDialogComponent,
    CalendlyDialogComponent,
    CalendlyListComponent,
    InputEmailChipComponent,
    TemplateCreateComponent,
    SocialShareComponent,
    TeamMaterialShareComponent,
    TemplateBrowserComponent,
    AutomationBrowserComponent,
    AutomationDetailOverlayComponent,
    TeamMemberProfileComponent,
    AdditionalFieldsComponent,
    AutomationShareComponent,
    MemberSelectorComponent,
    CardComponent,
    PaymentCardComponent,
    MaterialTimelinesComponent,
    DealTimelinesComponent,
    EmailTimelinesComponent,
    TextTimelinesComponent,
    PlayTimelinesComponent,
    InputContactDealComponent,
    UpgradePlanErrorComponent,
    PaymentFailedErrorComponent,
    DialPlanComponent,
    StopShareContactComponent,
    InputContactDealComponent,
    SubscriptionCancelReasonComponent,
    MessageFilesComponent,
    ConnectNewCalendarComponent,
    InputStageComponent,
    CalendarMoreEventComponent,
    ScheduleEventTypeComponent,
    ScheduleLocationEditComponent,
    SelectCompanyComponent,
    AddUserComponent,
    EditUserComponent,
    VerifyCodeConfirmComponent,
    CompanyInputComponent,
    BuyAccountComponent,
    FormatProfileComponent,
    CaseMaterialConfirmComponent,
    CalendarSettingComponent,
    ImportTemplatesComponent,
    ContactDeleteComponent,
    AutomationItemComponent,
    DataListComponent,
    TaskListComponent,
    LabelDisplayComponent,
    ConfirmPrimaryContactComponent,
    DialerLogComponent,
    SmsSubscribeComponent,
    DialerReportComponent,
    SelectAutomationComponent,
    DialerCallComponent,
    CreateCallLabelComponent,
    ForwardEmailComponent,
    AccountSettingComponent,
    AccountPasswordComponent,
    TemplatesBrowserComponent,
    NotificationAlertComponent,
    ToastrComponent,
    IntroModalComponent,
    UserInsightsComponent,
    ToastrComponent,
    DealMoveComponent,
    SelectContactListComponent,
    UserflowCongratComponent,
    LeadCaptureFormComponent,
    CaptureFieldAddComponent,
    AssetsManagerComponent,
    AddActionComponent,
    EditActionComponent,
    SelectBranchComponent,
    DealStageUpdateComponent,
    PipelineCreateComponent,
    EventTypeAutomationComponent,
    EventTypeTagsComponent,
    PipelineRenameComponent,
    TaskRecurringDialogComponent,
    DeletePipelineComponent,
    ChangeFolderComponent,
    RemoveFolderComponent,
    ConfirmRemoveAutomationComponent,
    CaseConfirmKeepComponent,
    InputEventTypeComponent,
    ScheduleSettingComponent,
    ActionImpossibleNotificationComponent,
    MaterialChangeComponent,
    AudioNoteComponent,
    ConfirmShareContactsComponent,
    ConfirmBulkTemplatesComponent,
    InlineNoteEditorComponent,
    TagContactsListComponent,
    LabelContactsListComponent,
    LabelMergeComponent,
    InputLabelComponent,
    CustomFieldContactsListComponent,
    UpdateDuplicatedContactComponent,
    ReviewToUploadComponent,
    DuplicateContactsCsvFileComponent,
    MatchColumnComponent,
    DuplicateContactsListComponent,
    UploadImportedContactsComponent,
    UpdateDuplicatedContactsCsvComponent,
    InputDealStageComponent,
    UnassignBulkAutomation,
    TeamSettingComponent,
    SaveTemplateComponent,
    AuthorizeCodeConfirmComponent,
    ConfirmLeaveTeamComponent,
    ConfirmMoveContactsComponent,
    SelectComponent,
    SelectStageComponent,
    InvalidContactsComponent,
    AliasDialogComponent,
    EmailSenderComponent,
    CustomFieldsMergeComponent,
    CreateDealsComponent,
    TokenManagerComponent,
    CreateTokenComponent,
    DeleteTokenComponent,
    RatingsComponent,
    RemoveActionComponent,
    DuplicateDealsComponent,
    EditDealComponent,
    MergeDealsComponent,
    FilterOptionsComponent,
    SelectContactConditionComponent,
    AdvancedFilterLabelComponent,
    AdvancedFilterOptionComponent,
    AdvancedFilterMaterialComponent,
    AdvancedFilterCountryComponent,
    AdvancedFilterStateComponent,
    AdvancedFilterCityComponent,
    AdvancedFilterZipcodeComponent,
    AdvancedFilterSourceComponent,
    AdvancedFilterCompanyComponent,
    AdvancedFilterTagComponent,
    AdvancedFilterStageComponent,
    AdvancedFilterActivityComponent,
    AdvancedFilterTeamComponent,
    ConfirmBusinessComponent,
    LeadCaptureFormDelayComponent,
    ColumnEditComponent,
    ConfirmBusinessComponent,
    SelectDealComponent,
    AutoCompleteTaskComponent,
    ConfirmBulkAutomationComponent,
    ResetDateTimeComponent,
    ResourceFilters,
    BusinessDateTimePickerComponent,
    ConfirmToAddComponent,
    TaskFilterOptionComponent,
    TaskGlobalFilterComponent,
    TaskStatusFilterComponent,
    TaskDescriptionContactFilterComponent,
    TaskDatetimeFilterComponent,
    TaskTypeFilterComponent,
    TaskFilterOptionsComponent,
    CreateEmbededMaterialComponent,
    CreateEmbededFormComponent,
    CustomToastComponent,
    AdvancedFilterCustomFieldComponent,
    AdvancedFilterAssigneeComponent,
    InputAssigneeComponent,
    ContactMoveComponent,
    PipelineBrowserComponent,
    CustomFieldMatchComponent,
    TeamContactMoveComponent,
    AgentFilterAddComponent,
    BucketListComponent,
    BucketItemComponent,
    ConversationItemComponent,
    ConversationListComponent,
    BucketCreateComponent,
    SphereContactComponent,
    AdvancedFilterUnsubscribedComponent,
    AdvancedFilterAutomationComponent,
    DealsListComponent,
    NewLandingPageComponent,
    ConfirmCustomTokenComponent,
    ContactEmailActionItemComponent,
    ContactActivitySuperItemComponent,
    ContactNoteActionItemComponent,
    ContactDealActionItemComponent,
    ContactTaskActionItemComponent,
    ContactMeetingActionItemComponent,
    ContactCallActionItemComponent,
    ContactAutomationActionItemComponent,
    ActionSessionListComponent,
    ContactMaterialListComponent,
    ContactTextActionItemComponent,
    ContactEventActionItemComponent,
    ContactActivityActionItemComponent,
    ContactEventActionItemComponent,
    WavvConnectorComponent,
    ContactUniversalActionItemComponent,
    MaterialBrowserV2Component,
    IntegrationDialogComponent,
    MaterialProgressStatusComponent,
    ContactActivityListContainerComponent,
    ContactDataListContainerComponent,
    ContactDetailFooterComponent,
    ContactDetailActionHeaderComponent,
    BackButtonComponent,
    InlineSendEmailComponent,
    InlineSendTextComponent,
    ContactActionListComponent,
    ContactActivityListComponent,
    InputContactEmailPhoneChipComponent,
    SelectLeadFormComponent,
    MaterialPreviewV2Component,
    MaterialViewerHistoryComponent,
    MaterialLandingPageListComponent,
    LandingPageBrowserComponent,
    ContactInputTagComponent,
    ContactActionUserComponent,
    VortexLogoutComponent,
    AssignTimelineContactsComponent,
    DealsPreferenceComponent,
    DealDetailComponent,
    DealInfoComponent,
    DealCustomFieldEdit,
    DealHistoryComponent,
    AvatarContactsComponent,
    AvatarTeamMembersComponent,
    AutomationTriggerMaterialComponent,
    AutomationTriggerOverlayComponent,
    AutomationHeaderUpdateComponent,
    StartTriggerComponent,
    TriggerLeadFormComponent,
    CollapsableSettingsComponent,
    RegisterWebinerComponent,
    UserOnboardingComponent,
    OnboardingSettingComponent,
    NavLinkComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatDividerModule,
    RouterModule,
    TranslateModule.forChild({ extend: true }),
    NgxCropperJsModule,
    NgxGraphModule,
    MatCardModule,
    ColorPickerModule,
    StripeModule.forRoot(STRIPE_KEY),
    CodeInputModule.forRoot({
      codeLength: 6,
      isCharsCode: true,
      code: ''
    }),
    PdfViewerModule,
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
    MatSelectModule,
    ReactiveFormsModule
  ],
  exports: [
    TopbarComponent,
    NavbarComponent,
    SidebarComponent,
    TwilioBrandManager,
    WavvConnectorComponent,
    SlideTabComponent,
    TabOptionComponent,
    ActionsBarComponent,
    ActionsHeaderComponent,
    ConfirmComponent,
    ConfirmBulkMaterialsComponent,
    TeamEditComponent,
    TeamDeleteComponent,
    InputContactsComponent,
    SelectContactComponent,
    InputTemplateComponent,
    InputAutomationComponent,
    InputTeamMembersComponent,
    InputTagComponent,
    SelectLeaderComponent,
    CalendarEventDialogComponent,
    CampaignAddListComponent,
    CampaignAddContactComponent,
    UploadContactsComponent,
    DownloadContactsProgreeBarComponent,
    DataEmptyComponent,
    SelectLeaderComponent,
    LabelSelectComponent,
    AssigneeSelectComponent,
    MailListComponent,
    CustomFieldAddComponent,
    CustomFieldDeleteComponent,
    TagEditComponent,
    TagDeleteComponent,
    TagMergeComponent,
    MaterialEditTemplateComponent,
    VideoEditComponent,
    MaterialCreateComponent,
    PdfEditComponent,
    ImageEditComponent,
    CalendarEventComponent,
    AdvancedFilterComponent,
    ContactBulkComponent,
    ManageLabelComponent,
    TaskFilterComponent,
    ContactMergeComponent,
    InputTagComponent,
    InputSourceComponent,
    InputCompanyComponent,
    AutomationShowFullComponent,
    AutomationTreeOverlayComponent,
    MaterialSendComponent,
    LandingPageSendComponent,
    TaskTypeComponent,
    DealCreateComponent,
    DealTimeDurationComponent,
    HtmlEditorComponent,
    AccordionComponent,
    SendEmailComponent,
    AssignmentDialogComponent,
    AdditionalEditComponent,
    SelectMemberComponent,
    DealStageCreateComponent,
    PlanSelectComponent,
    PlanBuyComponent,
    DealStageDeleteComponent,
    DealEditComponent,
    DateInputComponent,
    DateCustomInputComponent,
    AutomationStatusComponent,
    DealContactComponent,
    FilterInputComponent,
    StageInputComponent,
    SelectCalendarComponent,
    InputContactChipComponent,
    GlobalSearchComponent,
    PurchaseMessageComponent,
    AddPhoneComponent,
    ZapierDialogComponent,
    CalendlyDialogComponent,
    CalendlyListComponent,
    InputEmailChipComponent,
    TemplateCreateComponent,
    SocialShareComponent,
    TeamMaterialShareComponent,
    AutomationDetailOverlayComponent,
    AdditionalFieldsComponent,
    CardComponent,
    PaymentCardComponent,
    MemberSelectorComponent,
    MaterialTimelinesComponent,
    DealTimelinesComponent,
    EmailTimelinesComponent,
    TextTimelinesComponent,
    PlayTimelinesComponent,
    DialPlanComponent,
    MessageFilesComponent,
    CalendarMoreEventComponent,
    ScheduleEventTypeComponent,
    ScheduleLocationEditComponent,
    SelectCompanyComponent,
    AddUserComponent,
    EditUserComponent,
    CompanyInputComponent,
    CalendarSettingComponent,
    ContactDeleteComponent,
    AutomationItemComponent,
    DataListComponent,
    TaskListComponent,
    RecordSettingDialogComponent,
    LabelDisplayComponent,
    ConfirmPrimaryContactComponent,
    SelectAutomationComponent,
    AccountSettingComponent,
    IntroModalComponent,
    UserInsightsComponent,
    AccountSettingComponent,
    DealMoveComponent,
    SelectContactListComponent,
    UserflowCongratComponent,
    LeadCaptureFormComponent,
    CaptureFieldAddComponent,
    AddActionComponent,
    TemplatesBrowserComponent,
    EditActionComponent,
    SelectBranchComponent,
    DealStageUpdateComponent,
    PipelineCreateComponent,
    EventTypeAutomationComponent,
    EventTypeTagsComponent,
    PipelineRenameComponent,
    TaskRecurringDialogComponent,
    SubscriptionCancelReasonComponent,
    DeletePipelineComponent,
    ConfirmRemoveAutomationComponent,
    InputEventTypeComponent,
    MaterialChangeComponent,
    AudioNoteComponent,
    ConfirmShareContactsComponent,
    ConfirmBulkTemplatesComponent,
    InlineNoteEditorComponent,
    TagContactsListComponent,
    LabelContactsListComponent,
    LabelMergeComponent,
    InputLabelComponent,
    CustomFieldContactsListComponent,
    UpdateDuplicatedContactComponent,
    ReviewToUploadComponent,
    DuplicateContactsCsvFileComponent,
    MatchColumnComponent,
    DuplicateContactsListComponent,
    UploadImportedContactsComponent,
    UpdateDuplicatedContactsCsvComponent,
    InputDealStageComponent,
    TeamSettingComponent,
    SaveTemplateComponent,
    ConfirmLeaveTeamComponent,
    SelectComponent,
    InvalidContactsComponent,
    AliasDialogComponent,
    ConfirmLeaveTeamComponent,
    CustomFieldsMergeComponent,
    CreateDealsComponent,
    TokenManagerComponent,
    SelectContactConditionComponent,
    RatingsComponent,
    DuplicateDealsComponent,
    FilterOptionsComponent,
    ConfirmBusinessComponent,
    RemoveActionComponent,
    SelectDealComponent,
    ResetDateTimeComponent,
    ResourceFilters,
    BusinessDateTimePickerComponent,
    ConfirmToAddComponent,
    TaskFilterOptionsComponent,
    TemplateSelectorComponent,
    TokenSelectorComponent,
    ChatGptWizardComponent,
    ChatGptExtendComponent,
    ChatGptButtonComponent,
    ChatGptCompareBlockComponent,
    PersonalitySelectorComponent,
    PersonalityManagerComponent,
    CustomToastComponent,
    SafeHtmlPipe,
    AgentFilterAddComponent,
    BucketListComponent,
    ConversationListComponent,
    SphereContactComponent,
    DealsListComponent,
    ContactEmailActionItemComponent,
    ContactActivitySuperItemComponent,
    ContactNoteActionItemComponent,
    ContactDealActionItemComponent,
    ContactTaskActionItemComponent,
    ContactMeetingActionItemComponent,
    ContactCallActionItemComponent,
    ContactAutomationActionItemComponent,
    ActionSessionListComponent,
    ContactMaterialListComponent,
    ContactTextActionItemComponent,
    ContactEventActionItemComponent,
    ContactActivityActionItemComponent,
    ContactUniversalActionItemComponent,
    MaterialProgressStatusComponent,
    ContactActivityListContainerComponent,
    ContactDataListContainerComponent,
    ContactDetailFooterComponent,
    ContactDetailActionHeaderComponent,
    BackButtonComponent,
    ContactActionListComponent,
    ContactActivityListComponent,
    MaterialPreviewV2Component,
    VortexLogoutComponent,
    AssignTimelineContactsComponent,
    SelectStageComponent,
    VortexLogoutComponent,
    DealsPreferenceComponent,
    DealDetailComponent,
    DealInfoComponent,
    DealCustomFieldEdit,
    DealHistoryComponent,
    AvatarContactsComponent,
    AvatarTeamMembersComponent,
    StartTriggerComponent,
    AutomationTriggerMaterialComponent,
    AutomationTriggerOverlayComponent,
    CollapsableSettingsComponent,
    RegisterWebinerComponent,
    UserOnboardingComponent,
    OnboardingSettingComponent,
    NavLinkComponent
  ],
  bootstrap: [
    AvatarEditorComponent,
    SelectTeamComponent,
    DeleteFolderComponent,
    DeletePipelineComponent,
    ForwardEmailComponent
  ],
  providers: [
    {
      provide: MOMENT,
      useValue: moment
    }
  ]
})
export class ComponentsModule {}
