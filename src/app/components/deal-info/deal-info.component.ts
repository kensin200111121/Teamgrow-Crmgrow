import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { SspaService } from '@app/services/sspa.service';
import { UserService } from '@app/services/user.service';
import { DealCustomFieldEdit } from '../deal-custom-field-edit/deal-custom-field-edit.component';
import { MatDialog } from '@angular/material/dialog';
import { Account } from '@app/models/user.model';
import { DealsService } from '@app/services/deals.service';
import { Subscription } from 'rxjs';
import { CustomFieldService } from '@app/services/custom-field.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-deal-info',
  templateUrl: './deal-info.component.html',
  styleUrls: ['./deal-info.component.scss']
})
export class DealInfoComponent implements OnInit {
  @Input() deal: any;

  primaryContact;
  otherContacts = [];
  additional_fields: any[] = [];
  memberIds: string[] = [];
  contacts = [];
  private customFieldSubscription: Subscription;

  constructor(
    public sspaService: SspaService,
    public userService: UserService,
    private dealService: DealsService,
    private dialog: MatDialog,
    private customFieldService: CustomFieldService,
    public router: Router,
  ) {
    this.customFieldService.loadDealFields(true);
  }

  ngOnInit(): void {
    this.customFieldSubscription && this.customFieldSubscription.unsubscribe();
    this.customFieldService.dealFields$.subscribe((_fields) => {
      this.additional_fields = _fields;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.deal && this.deal) {
      const members = [];
      this.memberIds = (this.deal?.main?.team_members || []).map((e) => {
        members.push(new Account().deserialize(e));
        return e._id;
      });
      this.deal.main.team_members = members;
      const primaryId = this.deal?.primary_contact;
      const contacts = this.deal?.contacts || [];
      if (primaryId) {
        this.primaryContact = contacts.find((item) => item._id === primaryId);
        this.otherContacts = contacts.filter((item) => item._id !== primaryId);
      }

      if (this.deal.main) {
        const { additional_field } = this.deal.main;
        if (additional_field) {
          this.additional_fields = this.additional_fields.map((item) => {
            if (additional_field.hasOwnProperty(item.name)) {
              return {
                ...item,
                value: additional_field[item.name]
              };
            }
            return item;
          });
        }
      }
    }
  }

  editCustomField(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.dialog
      .open(DealCustomFieldEdit, {
        width: '98vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          additional_fields: { ...this.deal.main.additional_field }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.deal.main.additional_field = res;
          this.additional_fields = [];
          this.additional_fields = Object.entries(res).map(([name, value]) => ({
            name,
            value
          }));
          this.dealService
            .editDeal(this.deal.main._id, {
              ...this.deal.main,
              additional_field: res
            })
            .subscribe((_res) => {});
        }
      });
  }

  convertCommision(commission): string {
    if (commission && commission?.unit === '$')
      return `$${commission?.value || 0}`;
    else if (commission && commission?.unit === '%')
      return `${commission?.value || 0}%`;
    else return '-';
  }

  getAvatar(contact: any) {
    if (contact) {
      const firstname = contact.first_name
        ? contact.first_name[0].toUpperCase()
        : '';
      const lastname = contact.last_name
        ? contact.last_name[0].toUpperCase()
        : '';
      return `${firstname}${lastname}`;
    }
    return '-';
  }

  openContact(contact: any): void {
    this.router.navigate(['/contacts/' + contact._id]);
  }
}
