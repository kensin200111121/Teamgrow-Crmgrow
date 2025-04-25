import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Action } from '@app/enums/sphere-action.enum';
import { ListType } from '@app/enums/sphere-list.enum';
import { Contact } from '@app/models/contact.model';
import { SphereService } from '@app/services/sphere.service';
import { SendEmailComponent } from '../send-email/send-email.component';
import { SendTextComponent } from '../send-text/send-text.component';
import { HandlerService } from '@app/services/handler.service';
import { DialerService } from '@app/services/dialer.service';
@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit {
  contacts: Contact[] = [];
  isLoading = false;
  hasMore = true;

  @Input() title: string;
  @Input() type: ListType;

  get isEmptyLoading(): boolean {
    return this.isLoading && !this.contacts?.length;
  }

  get isEmpty(): boolean {
    return !this.contacts?.length;
  }

  get isLoadingMore(): boolean {
    return this.isLoading && this.contacts?.length && this.hasMore;
  }

  constructor(
    private sphereService: SphereService,
    private handlerService: HandlerService,
    private dialerService: DialerService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;

    const data = {
      skip: this.contacts?.length,
      type: this.type
    };

    this.sphereService.load(data).subscribe((result) => {
      const contacts = result;
      this.contacts = [...this.contacts, ...contacts];
      this.isLoading = false;
      this.hasMore = !!(result.length >= 10);
    });
  }

  handleItemAction(item: Contact, action: Action): void {
    switch (action) {
      case Action.COMPLETE:
        this.callbackForAction(item);
        break;
      case Action.CALL:
        this.call(item);
        break;
      case Action.EMAIL:
        this.email(item);
        break;
      case Action.TEXT:
        this.text(item);
        break;
    }
    return;
  }

  private callbackForAction(contact: Contact): void {
    this.contacts.some((e, index) => {
      if (e._id === contact._id) {
        this.contacts.splice(index, 1);
        return true;
      }
    });
  }

  private email(contact: Contact): void {
    const dialog = this.dialog.open(SendEmailComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        contact,
        type: 'contact_email'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.callbackForAction(contact);
      }
    });
  }

  private text(contact: Contact): void {
    const dialog = this.dialog.open(SendTextComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        type: 'single',
        contact: contact
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.callbackForAction(contact);
      }
    });
  }

  private call(contact: Contact): void {
    const contacts = [
      {
        contactId: contact._id,
        numbers: [contact.cell_phone],
        name: contact.fullName
      }
    ];
    this.dialerService.makeCalls(contacts);
  }
}
