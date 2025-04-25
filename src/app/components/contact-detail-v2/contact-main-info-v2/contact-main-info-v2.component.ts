import {
  Component,
  OnInit,
  ElementRef,
  Input,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Contact, ContactActivity } from '@models/contact.model';
import { ContactService } from '@app/services/contact.service';
import { UserService } from '@app/services/user.service';
import { StoreService } from '@app/services/store.service';
import { HandlerService } from '@app/services/handler.service';
import { ContactListType, FieldTypeEnum } from '@utils/enum';
import { formatDate } from '@utils/functions';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NoteCreateComponent } from '@app/components/note-create/note-create.component';
import { DialogSettings } from '@constants/variable.constants';
import { HelperService } from '@app/services/helper.service';
import { MaterialService } from '@app/services/material.service';
import { environment } from '@environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';
import { ContactMergeComponent } from '@app/components/contact-merge/contact-merge.component';
import { ContactShareComponent } from '@app/components/contact-share/contact-share.component';
import { NotifyComponent } from '@app/components/notify/notify.component';
import { TeamService } from '@app/services/team.service';
import { ContactMoveComponent } from '@app/components/contact-move/contact-move.component';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { AdditionalEditComponent } from '@app/components/additional-edit/additional-edit.component';
import { AdditionalFieldsComponent } from '@app/components/additional-fields/additional-fields.component';
import { CustomFieldAddComponent } from '@app/components/custom-field-add/custom-field-add.component';
import moment from 'moment-timezone';
import { ContactActionService } from '@app/services/contact-action.service';
import { MaterialBrowserV2Component } from '@app/components/material-browser-v2/material-browser-v2.component';
import { SharedContactsService } from '@app/services/contacts/shared-contacts.service';
import { TaskService } from '@app/services/task.service';
import { StopShareContactComponent } from '@app/components/stop-share-contact/stop-share-contact.component';
import { MovePendingContactsService } from '@app/services/contacts/move-pending-contact.service';
import { SharePendingContactsService } from '@app/services/contacts/share-pending-contacts.service';
import { AUTOCOMPLETE_CLOSE_PROVIDER } from '@app/variables/providers';
import { RouterService } from '@app/services/router.service';
import { LabelService } from '@app/services/label.service';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { AssigneeSelectComponent } from '@app/components/assignee-select/assignee-select.component';
import { LabelSelectComponent } from '@app/components/label-select/label-select.component';
import { NgScrollbar } from 'ngx-scrollbar';
import { CustomFieldService } from '@app/services/custom-field.service';

const VIEW_MODE = {
  SINGLE: 0,
  TASKS: 1,
  CONTACTS: 2
};

@Component({
  selector: 'app-contact-main-info-v2',
  templateUrl: './contact-main-info-v2.component.html',
  styleUrls: ['./contact-main-info-v2.component.scss'],
  providers: [AUTOCOMPLETE_CLOSE_PROVIDER]
})
export class ContactMainInfoV2Component implements OnInit, AfterViewInit {
  readonly USER_FEATURES = USER_FEATURES;
  private contactMainInfoSubject: BehaviorSubject<Contact> =
    new BehaviorSubject(null);
  contactMainInfo: Contact = new Contact(); // contact main informations
  contactId = '';
  emails = [];
  phones = [];
  addresses = [];

  @Input()
  public set setContactId(val: string) {
    if (val) {
      this.contactId = val;
    }
  }
  @Output() changeContact = new EventEmitter<string>();
  @ViewChild(NgScrollbar) scrollbar: NgScrollbar; // NgScrollbar reference
  @ViewChild('assigneeSelect') assigneeSelect: AssigneeSelectComponent; // AssigneeSelect reference
  @ViewChild('labelSelect') labelSelect: LabelSelectComponent; // LabelSelect reference

  userId = '';
  assigneeEnabled = false;
  assigneeEditable = false;
  callLabel = '';
  sharedMembers = [];
  sharable = false;
  rateUpdating = false;

  // Name Update
  nameEditable = false;
  contactFirstName = '';
  contactLastName = '';
  activeFieldName = '';
  saving = false;

  // Variables for the package enable
  isPackageAutomation = true;
  isPackageText = true;
  isPackageDialer = true;

  textUnsubscribed = false;
  emailUnsubscribed = false;
  extraAdditionalFields: any = {};
  leadFields: any[] = [];
  contactLoading = true;
  isAdditionalInfoOpen: boolean = true;

  userSubscription: Subscription;
  contactMainInfoReadSubscription: Subscription;
  customFieldSubscription: Subscription;
  updateSubscription: Subscription;
  teamSubscription: Subscription;
  rateUpdateSubscription: Subscription;
  saveSubscription: Subscription;

  contactListService:
    | MovePendingContactsService
    | SharedContactsService
    | SharePendingContactsService;

  // Check my contact
  get isPending(): boolean {
    const contact = this.contactMainInfo;
    if (!contact) {
      return false;
    }
    const pending_users = contact.pending_users || [];
    const sharedMembers = this.sharedMembers || [];
    const contactUser = contact.user || [];

    if (
      pending_users.includes(this.userId) ||
      (!contactUser.includes(this.userId) &&
        !sharedMembers.includes(this.userId))
    ) {
      return true;
    } else {
      return false;
    }
  }

  get isShared(): boolean {
    const contact = this.contactMainInfo;
    if (!contact) {
      return false;
    }

    if (
      this.userId &&
      (this.userId === this.contactMainInfo.user ||
        this.userId === this.contactMainInfo.user[0])
    ) {
      return false;
    } else {
      return true;
    }
  }

  get isAssigned(): boolean {
    return !!this.contactMainInfo.owner;
  }

  get hasAnyAdditionalInfo(): boolean {
    if (this.emails.length > 0) return true;

    if (this.phones.length > 0) return true;

    if (this.addresses.length > 0) return true;

    if (this.contactMainInfo?.prospect_id) return true;

    if (this.customFields.length > 0) return true;

    if (Object.keys(this.extraAdditionalFields || {}).length > 0) return true;

    return false;
  }

  get assignmentLabel(): string {
    const labels: string[] = [];
    if (this.isAssigned) labels.push('Assigned');
    if (this.isShared) labels.push('Shared');
    return labels.join(' • ');
  }

  get customFields(): any[] {
    if (
      this.userId &&
      (this.userId === this.contactMainInfo.user ||
        this.userId === this.contactMainInfo.user[0])
    ) {
      return this.leadFields;
    } else {
      return this.contactMainInfo.customFields || [];
    }
  }

  isSspa = environment.isSspa;

  constructor(
    public contactService: ContactService,
    public userService: UserService,
    public materialService: MaterialService,
    private storeService: StoreService,
    private handlerService: HandlerService,
    private routerService: RouterService,
    private toastr: ToastrService,
    private helperSerivce: HelperService,
    private teamService: TeamService,
    private clipboard: Clipboard,
    private dialog: MatDialog,
    private element: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private contactActionService: ContactActionService,
    private sharedContactService: SharedContactsService,
    private movePendingContactService: MovePendingContactsService,
    private sharePendingContactService: SharePendingContactsService,
    private taskService: TaskService,
    private customFieldService: CustomFieldService,
    public labelService: LabelService,
    public contactDetailInfoService: ContactDetailInfoService
  ) {
    if (this.handlerService.selectedContactListType) {
      switch (this.handlerService.selectedContactListType) {
        case ContactListType.MOVE_PENDING:
          this.contactListService = this.movePendingContactService;
          break;
        case ContactListType.SHARE_PENDING:
          this.contactListService = this.sharePendingContactService;
          break;
        case ContactListType.SHARED:
          this.contactListService = this.sharedContactService;
          break;
      }
    }
    this.teamService.loadAll(false);
    this.userSubscription && this.userSubscription.unsubscribe();
    this.userSubscription = this.userService.profile$.subscribe((profile) => {
      if (profile?._id) {
        this.isPackageAutomation = profile.automation_info?.is_enabled;
        this.isPackageText = profile.text_info?.is_enabled;
        this.isPackageDialer = profile.dialer_info?.is_enabled;
        this.assigneeEnabled = profile?.assignee_info?.is_enabled;
        this.assigneeEditable = profile?.assignee_info?.is_editable;
        this.userSubscription && this.userSubscription.unsubscribe();
        this.checkSharable();
        this.userId = profile._id;
      }
    });

    this.teamSubscription && this.teamSubscription.unsubscribe();
    this.teamSubscription = this.teamService.teams$.subscribe((teams) => {
      this.checkSharable();
    });
    this.customFieldService.loadContactFields(true);
  }
  ngAfterViewInit(): void {
    this.scrollbar.scrolled.subscribe(() => {
      // Close open autocomplete panel while scrolling
      if (this.assigneeSelect) {
        this.assigneeSelect.closePopups();
      }
      if (this.labelSelect) {
        this.labelSelect.closePopups();
      }
    });
    // throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    // this._initPrevNextContact();
    this.contactMainInfoReadSubscription &&
      this.contactMainInfoReadSubscription.unsubscribe();
    this.contactMainInfoReadSubscription =
      this.storeService.selectedContactMainInfo$.subscribe((contact) => {
        if (!contact?._id) {
          return;
        }
        this._initContactMainInfoData(contact);

        if (this.contactMainInfo['shared_members']) {
          this.sharedMembers = this.contactMainInfo['shared_members'].map(
            (e) => e._id
          );
        }
        this.textUnsubscribed =
          this.contactMainInfo.unsubscribed?.text || false;

        this.emailUnsubscribed =
          this.contactMainInfo.unsubscribed?.email || false;

        this.contactLoading = false;
      });
    this.customFieldSubscription && this.customFieldSubscription.unsubscribe();
    this.customFieldSubscription = this.customFieldService.fields$.subscribe(
      (_fields) => {
        this.leadFields = _fields;
      }
    );
  }

  ngOnDestroy(): void {
    this.handlerService.selectedContactListType = null;
  }

  getLableColor(): string {
    let color = '#ccc';
    const contactLabel = this.contactMainInfo.label;
    this.labelService.allLabels$.subscribe((res) => {
      const value = _.find(res, (e) => e._id === contactLabel);
      color = value?.color;
      if (value?.color === '#FFF') {
        color = '#ccc';
      }
    });
    return color;
  }

  checkSharable(): void {
    const userId = this.userService.profile.getValue()._id;
    const teams = this.teamService.teams.getValue();
    if (!teams || !teams.length) {
      this.sharable = false;
      return;
    }
    let isValid = false;
    teams.some((e) => {
      if (e.isActive(userId)) {
        isValid = true;
        return true;
      }
    });
    if (isValid) {
      this.sharable = true;
      return;
    }
  }

  isUrl(str): boolean {
    let url = '';
    if (str && typeof str === 'string' && str.startsWith('http')) {
      url = str;
    } else {
      url = 'http://' + str;
    }
    if (url.indexOf('.') === -1) {
      return false;
    }
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return !!pattern.test(url);
  }

  getAdditionalFieldValue(field, fieldValue): any {
    if (field.type === FieldTypeEnum.DATE) {
      if (fieldValue && fieldValue !== '') {
        if (
          fieldValue instanceof Date === false &&
          fieldValue?.day &&
          fieldValue?.month &&
          fieldValue?.year
        ) {
          const dd = fieldValue.day;
          const mm = fieldValue.month;
          const yyyy = fieldValue.year;
          return formatDate(dd, mm, yyyy);
        }

        const date = new Date(fieldValue);

        if (isNaN(date.getTime())) return '';

        const dd = date.getDate();
        const mm = date.getMonth() + 1;
        const yyyy = date.getFullYear();
        return formatDate(dd, mm, yyyy);
      }
      return '';
    }
    return fieldValue;
  }

  getExtraAdditionalFieldValue(fieldValue: string): any {
    if (moment(fieldValue, moment.ISO_8601, true).isValid()) {
      const date = new Date(fieldValue);
      const dd = date.getDate();
      const mm = date.getMonth() + 1;
      const yyyy = date.getFullYear();
      return formatDate(dd, mm, yyyy);
    }
    return fieldValue;
  }

  openAppointmentDlg(): void {
    this.contactActionService.openAppointmentDlg();
  }

  openNoteDlg(): void {
    this.dialog
      .open(NoteCreateComponent, {
        ...DialogSettings.NOTE,
        data: {
          contacts: [this.contactMainInfo]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.contactActionService.onCreateNewNote();
      });
  }

  openCall(): void {
    this.contactActionService.openCall();
  }

  openSendEmail(): void {
    this.contactActionService.openSendEmail();
  }

  openSendText(): void {
    this.contactActionService.openSendText();
  }

  openTaskDlg(): void {
    this.contactActionService.openTaskDlg();
  }

  openMaterialDlg(): any {
    const content = '';
    const materials = this.helperSerivce.getMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        title: 'Select material',
        multiple: false,
        onlyMine: false,
        buttonLabel: 'Select'
      }
    });
    materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials && res.materials.length) {
        let url;
        let tempData;
        const material = res.materials[0];
        if (material.material_type == 'video') {
          tempData = {
            content: 'generated link',
            type: 'videos',
            contacts: this.contactMainInfo._id,
            videos: [material._id]
          };
        } else if (material.material_type == 'pdf') {
          tempData = {
            content: 'generated link',
            type: 'pdfs',
            contacts: this.contactMainInfo._id,
            pdfs: [material._id]
          };
        } else {
          tempData = {
            content: 'generated link',
            type: 'images',
            contacts: this.contactMainInfo._id,
            images: [material._id]
          };
        }
        this.materialService.createActivity(tempData).subscribe((res) => {
          if (res) {
            const activity = res.data;
            if (material.material_type == 'video') {
              url = environment.website + '/video1/' + activity._id;
            } else if (material.material_type == 'pdf') {
              url = environment.website + '/pdf1/' + activity._id;
            } else if (material.material_type == 'image') {
              url = environment.website + '/image/' + activity._id;
            }
            this.clipboard.copy(url);
            this.toastr.success('Generated the trackable link to clipboard');
            this.contactActionService.callbackForLoadLastGroupedActivity();
          }
        });
      }
    });
  }

  openMergeContactDlg(): void {
    this.dialog
      .open(ContactMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '700px',
        data: {
          contact: this.contactMainInfo
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.handlerService.reload$();
          this.contactActionService.callbackForLoadLastGroupedActivity();
        }
      });
  }

  openShareContactDlg(): void {
    if (this.sharable) {
      this.dialog
        .open(ContactShareComponent, {
          width: '500px',
          maxWidth: '90vw',
          data: {
            contacts: [this.contactMainInfo]
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.handlerService.reload$();
            this.contactActionService.callbackForLoadLastGroupedActivity();
          }
        });
    } else {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          title: 'Share Contact',
          message: 'You have no active teams.'
        }
      });
    }
  }

  openMoveContactDlg(): void {
    if (this.sharable) {
      this.dialog
        .open(ContactMoveComponent, {
          width: '415px',
          maxWidth: '90vw',
          data: {
            contacts: [this.contactMainInfo]
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.handlerService.reload$();
            this.contactActionService.callbackForLoadLastGroupedActivity();
          }
        });
    } else {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          title: 'Routing Contact',
          message: 'You have no active teams.'
        }
      });
    }
  }

  deleteContact(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete contact',
          message: 'Are you sure to delete this contact?',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactService
            .bulkDelete([this.contactId])
            .subscribe((status) => {
              if (!status) {
                return;
              }
              this.handlerService.readMessageContact.next([this.contactId]);
              this.routerService.goBack();
            });
        }
      });
  }

  changeLabel(event: string): void {
    const label = event ? event : null;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .bulkUpdate([this.contactMainInfo._id], { label: label }, {})
      .subscribe((status) => {
        if (status) {
          this.handlerService.bulkContactUpdate$(
            [this.contactMainInfo._id],
            { label: label },
            {}
          );
          this.contactMainInfo.label = label;
        }
      });
  }

  lockRate(rate: number): void {
    // Lock Rate
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'confirm_lock_title',
          message: 'confirm_lock_message',
          confirmLabel: 'confirm_lock_button'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const data = {
            rate,
            rate_lock: true
          };
          this.rateUpdating = true;
          this.rateUpdateSubscription &&
            this.rateUpdateSubscription.unsubscribe();
          this.rateUpdateSubscription = this.contactService
            .updateContact(this.contactMainInfo._id, data)
            .subscribe((status) => {
              this.rateUpdating = false;
              if (status) {
                this.contactMainInfo.rate = rate;
                this.contactMainInfo.rate_lock = true;
              }
            });
        }
      });
  }

  unlockRate(): void {
    // Unlock Rate
    this.rateUpdating = true;
    this.rateUpdateSubscription && this.rateUpdateSubscription.unsubscribe();
    this.rateUpdateSubscription = this.contactService
      .unlockContact([this.contactMainInfo._id])
      .subscribe((rate) => {
        this.rateUpdating = false;
        this.contactMainInfo.rate_lock = false;
        this.contactMainInfo.rate = rate;
      });
  }

  changeRate(rate: number): void {
    const data = {
      rate
    };
    this.rateUpdating = true;
    this.rateUpdateSubscription && this.rateUpdateSubscription.unsubscribe();
    this.rateUpdateSubscription = this.contactService
      .updateContact(this.contactMainInfo._id, data)
      .subscribe((status) => {
        this.rateUpdating = false;
        if (status) {
          this.contactMainInfo.rate = rate;
        }
      });
  }

  resubscribe(): void {
    this.contactService
      .updateContact(this.contactId, { 'unsubscribed.email': false })
      .subscribe((res) => {
        if (res) {
          this.emailUnsubscribed = false;
          this.changeDetector.markForCheck();
        }
      });
  }

  editContacts(
    type: string,
    evt: any,
    shouldTagFocus = false,
    focusField: string
  ): void {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    this.dialog
      .open(ContactCreateEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          contact: _.cloneDeep(this.contactMainInfo), //deep copy,
          type: type,
          isEditTag: shouldTagFocus,
          focusField: focusField
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this._initContactMainInfoData(res);
          this.changeDetector.markForCheck();
        }
      });
  }

  editAdditional(event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.dialog
      .open(AdditionalEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        data: {
          contact: {
            ...this.contactMainInfo
          }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactMainInfo.source = res.source;
          this.contactMainInfo.tags = res.tags;
          this.contactMainInfo.brokerage = res.brokerage;
          this.contactMainInfo.additional_field =
            res.additional_field || this.contactMainInfo.additional_field;
        }
      });
  }

  convertField(field): void {
    const data = {
      ...field,
      isExtra: true,
      type: 'text',
      name: field.key
    };

    this.dialog.open(CustomFieldAddComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '400px',
      disableClose: true,
      data: {
        mode: 'convert',
        field: data
      }
    });
  }

  // Stop share contact
  stopShare($event, contact): void {
    if (contact && contact.shared_team.length) {
      const team = contact.shared_team[0];
      const members = this.getSharedMembers(contact);
      if (contact.shared_all_member) {
        this.dialog
          .open(ConfirmComponent, {
            data: {
              title: 'Stop Share of Contact System-Wide',
              message:
                'WARNING: This action will stop sharing the contact with all Teams and Community members it is shared with.',
              cancelLabel: 'No',
              confirmLabel: 'Stop'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.handlerService.reload$();
              this.contactService
                .stopShareContacts([contact._id], this.userId, team._id)
                .subscribe();
              this.contactActionService.callbackForLoadLastGroupedActivity();
            }
          });
      } else {
        this.dialog
          .open(StopShareContactComponent, {
            width: '100vw',
            maxWidth: '400px',
            data: {
              contacts: [contact],
              members,
              team: team._id
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res && res.status) {
              this.handlerService.reload$();
              this.contactActionService.callbackForLoadLastGroupedActivity();
            }
          });
      }
    }
  }

  getSharedMembers(contact): any {
    return _.uniqBy(contact.shared_members, '_id');
  }

  private _initContactMainInfoData(contact): void {
    this.contactMainInfo = new Contact().deserialize({ ...contact });
    this.contactMainInfoSubject.next(this.contactMainInfo);
    this.emails = this.contactMainInfo.emails.filter((e) => !e.isPrimary);
    this.phones = this.contactMainInfo.phones.filter((e) => !e.isPrimary);
    this.addresses = this.contactMainInfo.addresses.filter((e) => !e.isPrimary);

    if (this.nameEditable) {
      this.contactFirstName = this.contactMainInfo.first_name;
      this.contactLastName = this.contactMainInfo.last_name;
    }
  }

  changeAssignee(event: string): void {
    const assignee = event ? event : null;
    if (!this.contactMainInfo?._id || this.contactMainInfo.owner === event) {
      return;
    }
    if (event) {
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.contactService
        .bulkUpdate([this.contactMainInfo._id], { owner: assignee }, {})
        .subscribe((status) => {
          if (status) {
            this.handlerService.bulkContactUpdate$(
              [this.contactMainInfo._id],
              { owner: assignee },
              {}
            );
            this.contactDetailInfoService.loadLastActivities(this.contactId, 1);
          }
        });
    }
  }

  setPrimaryPhone(phone: string): void {
    this.contactService
      .setPrimaryPhone(this.contactId, phone)
      .subscribe((res) => {
        console.log(res);
      });
  }

  setPrimaryEmail(email: string): void {
    this.contactService
      .setPrimaryEmail(this.contactId, email)
      .subscribe((res) => {
        console.log(res);
      });
  }

  setPrimaryAddress(address: any): void {
    this.contactService
      .setPrimaryAddress(this.contactId, address)
      .subscribe((res) => {
        console.log(res);
      });
  }
}
