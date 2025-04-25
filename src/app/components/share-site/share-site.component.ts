import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ContactService } from '@services/contact.service';
import { validateEmail } from '@app/helper';
import { Labels, TeamLabel } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog
} from '@angular/material/dialog';
import { EmailService } from '@services/email.service';
import { NotifyComponent } from '@components/notify/notify.component';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Contact } from '@models/contact.model';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-share-site',
  templateUrl: './share-site.component.html',
  styleUrls: ['./share-site.component.scss']
})
export class ShareSiteComponent implements OnInit {
  labelSearchedContacts: Contact[] = [];
  selectedContacts: Contact[] = [];

  labelSearching = false;
  labelSearchSubscription: Subscription;

  email: any = {
    subject: 'You have to check out crmgrow.com',
    content: `<p>Hi {contact_first_name},</p><br/><p>Wanted to share with you the agent attraction software that has helped me take my recruiting to the next level. It’s a game changer! </p><p>There is a 14 day free trial and then it’s only $49 per month. You should check it out risk free and see the power of it: </p><p><a href="{platform_url}">www.crmgrow.com</a> </p><br/><p>Thanks,</p>`
  };
  platform_url = '';

  sharing = false;
  shareSubscription: Subscription;

  isOpen = false;
  submitted = false;

  labels = [{ id: 'unset', text: 'Unset' }, ...Labels];
  selectedTemplate = { subject: '', content: '' };

  @ViewChild('emailEditor') htmlEditor: HtmlEditorComponent;
  @ViewChild('teamTrigger') teamTrigger: HTMLElement;

  connectedPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      overlayX: 'end',
      originY: 'bottom',
      overlayY: 'top'
    }
  ];

  constructor(
    private contactService: ContactService,
    private emailService: EmailService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ShareSiteComponent>,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.changeLabel();
    if (this.data && this.data.share_url) {
      this.platform_url = this.data.share_url;
    }
    this.email.content = this.email.content.replace(
      '{platform_url}',
      this.platform_url
    );
  }

  addContact(contact: Contact): void {
    const pos = _.findIndex(
      this.selectedContacts,
      (e) => e._id === contact._id
    );
    if (pos === -1) {
      this.selectedContacts.push(contact);
    }
  }

  addAllLabelSearched(): void {
    this.labelSearchedContacts.forEach((e) => {
      const pos = _.findIndex(this.selectedContacts, (e) => e._id === e._id);
      if (pos === -1) {
        this.selectedContacts.splice(0, 0, e);
      }
    });
    this.isOpen = false;
  }

  changeLabel(evt = null): void {
    let label = TeamLabel;
    if (evt) {
      label = evt.value;
    }
    this.labelSearching = true;
    this.labelSearchSubscription && this.labelSearchSubscription.unsubscribe();
    this.labelSearchSubscription = this.contactService
      .filter({ label })
      .subscribe(
        (res) => {
          this.labelSearching = false;
          const contacts = [];
          res.forEach((e) => {
            if (e.email) {
              const contact = {
                name:
                  e.first_name || e.last_name
                    ? (e.first_name || '') + ' ' + (e.last_name || '')
                    : '',
                first_name: e.first_name,
                last_name: e.last_name,
                email: e.email
              };
              contacts.push(new Contact().deserialize(contact));
            }
          });
          this.labelSearchedContacts = contacts;
        },
        (err) => {
          this.labelSearching = false;
        }
      );
  }

  share(): void {
    this.submitted = true;
    if (!this.selectedContacts.length) {
      return;
    }
    if (!this.email.subject) {
      return;
    }
    if (!this.email.content) {
      return;
    }

    if (
      this.email.content.indexOf(this.platform_url) === -1 &&
      this.email.content.indexOf('{platform_url}')
    ) {
      this.dialog.open(NotifyComponent, {
        width: '100vw',
        maxWidth: '360px',
        data: {
          message:
            'Please make sure the email content contains the platform share link.'
        }
      });
      return;
    }

    this.sharing = true;
    this.emailService
      .shareUrl({
        contacts: this.selectedContacts,
        content: this.email.content,
        subject: this.email.subject,
        videos: []
      })
      .subscribe(
        (res) => {
          this.sharing = false;
          this.dialogRef.close();
        },
        (err) => {
          this.sharing = false;
        }
      );
  }

  openLabelContacts(): void {
    this.isOpen = true;
  }

  closeOverlay(event: MouseEvent): void {
    const target = <HTMLInputElement>event.target;
    if (target === this.teamTrigger) {
      return;
    }
    this.isOpen = false;
  }

  insertEmailContentValue(value: string): void {
    this.htmlEditor.insertEmailContentValue(value);
  }

  selectTemplate(event): void {
    this.selectedTemplate = event;
    this.email.subject = this.selectedTemplate.subject;
  }
}
