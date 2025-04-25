import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TeamService } from '@services/team.service';
import { UserService } from '@services/user.service';
import { ContactService } from '@services/contact.service';
import { SelectContactComponent } from '@components/select-contact/select-contact.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmShareContactsComponent } from '@components/confirm-share-contacts/confirm-share-contacts.component';
import * as _ from 'lodash';
import { environment } from '@environments/environment';
@Component({
  selector: 'app-team-contact-share',
  templateUrl: './team-contact-share.component.html',
  styleUrls: ['./team-contact-share.component.scss']
})
export class TeamContactShareComponent implements OnInit {
  team: any;
  members: any[] = [];
  contacts: any[] = [];
  member;

  submitted = false;
  contactOverflow = false;
  loading = false;
  userId;
  role = 'viewer';
  internalOnly = true;

  @ViewChild('contactSelector') contactSelector: SelectContactComponent;

  constructor(
    private dialogRef: MatDialogRef<TeamContactShareComponent>,
    private contactService: ContactService,
    private userService: UserService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    const profile = this.userService.profile.getValue();

    if (environment.isSspa) {
      this.internalOnly = true;
    } else if (profile?.user_version < 2.3) {
      this.internalOnly = false;
    }

    if (this.data) {
      this.team = this.data.team;
      this.userService.profile$.subscribe((res) => {
        if (res) {
          this.userId = res._id;
        }
      });

      const members = [];
      const ownerIds = [];
      for (const owner of this.team.owner) {
        if (owner._id !== this.userId) {
          members.push(owner);
        } else {
          this.role = 'owner';
        }
        ownerIds.push(owner._id);
      }
      for (const member of this.team.members) {
        if (member._id !== this.userId && ownerIds.includes(this.userId)) {
          members.push(member);
        }
        if (member._id === this.userId) {
          this.role = member.role;
        }
      }
      this.members = members;
    }
  }

  shareContacts(): void {
    this.submitted = true;
    if (!this.team || !this.member || !this.contacts.length) {
      return;
    }
    this.loading = true;
    let users;
    let mode = 'single';
    if (this.member === 'allMembers') {
      users = this.team.members.map((member) => member._id);
      mode = 'all_member';
    } else if (this.member === 'round_robin') {
      mode = 'round_robin';
    } else {
      users = [this.member._id];
    }
    this.contactService
      .shareContacts({
        team: this.team._id,
        user: users,
        contacts: this.contacts.map((e) => e._id),
        type: 2,
        mode
      })
      .subscribe((res) => {
        this.loading = false;
        if (res) {
          if (res.status) {
            if (res.error?.length > 0) {
              const errors = _.groupBy(
                _.uniqBy(res.error, 'contact._id'),
                'error'
              );
              this.dialog.open(ConfirmShareContactsComponent, {
                maxHeight: 500,
                disableClose: true,
                data: {
                  title: 'Share contacts',
                  additional: errors,
                  message: 'You failed to share these following contacts.'
                }
              });

              if (res.error.length !== this.contacts.length) {
                this.dialogRef.close({ data: res.data });
              } else {
                this.dialogRef.close();
              }
            } else {
              this.dialogRef.close({ data: res.data });
            }
          } else {
            this.toastr.error(res.error, 'Share contacts to team member', {
              timeOut: 5000
            });
            this.dialogRef.close();
          }
        }
      });
  }

  selectMember(member): any {
    if (member) {
      this.member = member;
    }
  }

  addContacts(contact): any {
    if (contact) {
      if (this.contacts.length === 15) {
        this.contactOverflow = true;
        return;
      } else if (contact && this.contacts.length < 15) {
        const index = this.contacts.findIndex(
          (item) => item._id === contact._id
        );
        if (index < 0) {
          this.contacts.push(contact);
        }
      }
    }
    this.contactSelector.clear();
  }

  removeContact(contact): void {
    const index = this.contacts.findIndex((item) => item._id === contact._id);
    if (index >= 0) {
      this.contacts.splice(index, 1);
      this.contactOverflow = false;
    }
  }
}
