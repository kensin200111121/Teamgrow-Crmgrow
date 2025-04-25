import { Component, Input } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { StoreService } from '@app/services/store.service';
import { UserService } from '@app/services/user.service';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DealMoveComponent } from '@components/deal-move/deal-move.component';
import { MatDialog } from '@angular/material/dialog';
import { DealsService } from '@services/deals.service';
import { Subscription } from 'rxjs';
import { ContactService } from '@services/contact.service';
import { ChangeDetectorRef } from '@angular/core';
import { DialogSettings } from '@constants/variable.constants';
import { NotifyComponent } from '@app/components/notify/notify.component';
import { SspaService } from '../../../services/sspa.service';

@Component({
  selector: 'app-contact-deal-action-item',
  templateUrl: './contact-deal-action-item.component.html',
  styleUrls: ['./contact-deal-action-item.component.scss']
})
export class ContactDealActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'deal';
  @Input() protected contactId: string;
  @Input() activity: ContactActivityActionV2;
  @Input() isPending: boolean;

  tab = { icon: '', label: 'Deals', id: 'deal' };
  stages = [];

  // Deal contact loading
  loadContactSubscription: Subscription;
  loadTimelineSubscription: Subscription;

  detailContacts = [];
  loadingContact = false;

  constructor(
    private dialog: MatDialog,
    protected contactDetailInfoService: ContactDetailInfoService,
    public storeService: StoreService,
    public userService: UserService,
    public dealsService: DealsService,
    public contactService: ContactService,
    private changeDetector: ChangeDetectorRef,
    public sspaService: SspaService
  ) {
    super();
  }
  ngOnInit(): void {
    super.ngOnInit();
    this.stages = [];
    this.dealsService.stages$.subscribe((res) => {
      if (res) {
        this.stages = [...res];
      }
    });
  }

  ngOnDestroy(): void {}

  loadContacts(ids: string[]): void {
    if (ids && ids.length >= 0) {
      this.loadingContact = true;
      this.loadContactSubscription &&
        this.loadContactSubscription.unsubscribe();
      this.loadContactSubscription = this.contactService
        .getContactsByIds(ids)
        .subscribe((contacts) => {
          this.loadingContact = false;
          if (contacts) {
            this.detailContacts = contacts;
          }
          this.changeDetector.detectChanges();
        });
    }
  }

  getDealLink(activity): string {
    const link = '/pipeline';
    const params = new URLSearchParams();

    if (activity.action) {
      params.set('deals', activity.action._id);
    } else if (activity.deals) {
      params.set('deals', activity.deals);
    }

    return `${link}?${params.toString()}`;
  }

  moveDeal(activity): void {
    this.dialog
      .open(DealMoveComponent, {
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          stage_id: activity?.deal_stage,
          deal_id: activity._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          activity.deal_stage = res;
          this.contactDetailInfoService.callbackForEditContactAction(
            activity._id,
            'deal'
          );
        }
      });
  }

  removeDeal(deal): void {
    const isPrimaryContact =
      deal?.primary_contact && this.contactId
        ? deal?.primary_contact === this.contactId
        : false;
    const lastContact =
      deal?.contacts.length === 1 && deal?.contacts[0] === this.contactId
        ? true
        : false;
    if (lastContact) {
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          position: { top: '100px' },
          data: {
            title: 'Delete Deal',
            message: 'Are you sure to delete this deal?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Confirm'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.dialog
              .open(ConfirmComponent, {
                ...DialogSettings.CONFIRM,
                data: {
                  title: 'Delete Deal',
                  message:
                    'Do you want to remove all the data and all the activities related this deal from contact?',
                  cancelLabel: 'No',
                  confirmLabel: 'Yes'
                }
              })
              .afterClosed()
              .subscribe((confirm) => {
                console.log('confirm: ', confirm);
                // return;
                if (confirm === true) {
                  this.dealsService.deleteDeal(deal._id).subscribe((status) => {
                    if (status) {
                      this.contactDetailInfoService.callbackForRemoveContactAction(
                        deal._id,
                        'deal'
                      );
                      const selectedContact =
                        this.storeService.selectedContact.getValue();
                      const index = selectedContact.details.deals.findIndex(
                        (e) => e._id == deal._id
                      );
                      selectedContact.details.deals.splice(index, 1);
                      selectedContact.activity.forEach((e, i) => {
                        if (e['type'] == 'deals' && e['deals'] == deal._id) {
                          selectedContact.activity.splice(i, 1);
                        }
                      });
                      this.storeService.selectedContact.next(selectedContact);
                    }
                  });
                }
                if (confirm === false) {
                  this.dealsService
                    .deleteOnlyDeal(deal._id)
                    .subscribe((status) => {
                      if (status) {
                        this.contactDetailInfoService.callbackForRemoveContactAction(
                          deal._id,
                          'deal'
                        );
                        const selectedContact =
                          this.storeService.selectedContact.getValue();
                        const index = selectedContact.details.deals.findIndex(
                          (e) => e._id == deal._id
                        );
                        selectedContact.details.deals.splice(index, 1);
                        selectedContact.activity.forEach((e, i) => {
                          if (e['type'] == 'deals' && e['deals'] == deal._id) {
                            selectedContact.activity.splice(i, 1);
                          }
                        });
                        this.storeService.selectedContact.next(selectedContact);
                        // this.reloadLatest();
                      }
                    });
                }
              });
          }
        });
    } else {
      if (isPrimaryContact) {
        this.dialog.open(NotifyComponent, {
          ...DialogSettings.ALERT,
          data: {
            title: 'Remove Deal',
            message: `You can't remove this contact from the deal because it's primary contact. Please update the primary contact with another one in <a href="/pipeline?deals=${deal?._id}">${deal?.title}</a> and try again.`
          }
        });
        return;
      }
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          position: { top: '100px' },
          data: {
            title: 'Remove deal',
            message: 'Are you sure to remove this contact from this deal?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Confirm'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.dialog
              .open(ConfirmComponent, {
                ...DialogSettings.CONFIRM,
                data: {
                  title: 'Delete Deal',
                  message:
                    'Do you want to remove all the data and all the activities related this deal from contact?',
                  cancelLabel: 'No',
                  confirmLabel: 'Yes'
                }
              })
              .afterClosed()
              .subscribe((confirm) => {
                if (confirm === true) {
                  this.dealsService
                    .updateContact({
                      dealId: deal._id,
                      action: 'remove',
                      ids: [this.contactId]
                    })
                    .subscribe((status) => {
                      if (status) {
                        this.contactDetailInfoService.callbackForRemoveContactAction(
                          deal._id,
                          'deal'
                        );
                        const selectedContact =
                          this.storeService.selectedContact.getValue();
                        const index = selectedContact.details.deals.findIndex(
                          (e) => e._id == deal._id
                        );
                        selectedContact.details.deals.splice(index, 1);
                        selectedContact.activity.forEach((e, i) => {
                          if (e['type'] == 'deals' && e['deals'] == deal._id) {
                            selectedContact.activity.splice(i, 1);
                          }
                        });
                        this.storeService.selectedContact.next(selectedContact);

                        // this.reloadLatest();
                      }
                    });
                }
                if (confirm === false) {
                  this.dealsService
                    .updateContact({
                      dealId: deal._id,
                      action: 'remove',
                      ids: [this.contactId],
                      deleteAllData: false
                    })
                    .subscribe((status) => {
                      if (status) {
                        this.contactDetailInfoService.callbackForRemoveContactAction(
                          deal._id,
                          'deal'
                        );
                        const selectedContact =
                          this.storeService.selectedContact.getValue();
                        const index = selectedContact.details.deals.findIndex(
                          (e) => e._id == deal._id
                        );
                        selectedContact.details.deals.splice(index, 1);
                        selectedContact.activity.forEach((e, i) => {
                          if (e['type'] == 'deals' && e['deals'] == deal._id) {
                            selectedContact.activity.splice(i, 1);
                          }
                        });
                        this.storeService.selectedContact.next(selectedContact);

                        // this.reloadLatest();
                      }
                    });
                }
              });
          }
        });
    }
  }
}
