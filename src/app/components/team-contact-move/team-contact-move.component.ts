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
@Component({
  selector: 'app-team-contact-move',
  templateUrl: './team-contact-move.component.html',
  styleUrls: ['./team-contact-move.component.scss']
})
export class TeamContactMoveComponent implements OnInit {
  team: any;
  members: any[] = [];
  contacts: any[] = [];
  member;

  submitted = false;
  contactOverflow = false;
  loading = false;
  userId;
  role = 'viewer';
  step = 1;
  sharingOptions = [
    {
      id: 1,
      value: 'Transfer',
      comment:
        'Transfer contacts help, Would you transfer contacts? Yes, please'
    },
    {
      id: 2,
      value: 'Clone',
      comment: 'Clone contacts help, Would you clone contacts? Yes, please'
    }
  ];

  selectedOption = this.sharingOptions[1];
  selectedOptionId = 1;

  @ViewChild('contactSelector') contactSelector: SelectContactComponent;

  constructor(
    private dialogRef: MatDialogRef<TeamContactMoveComponent>,
    private contactService: ContactService,
    private userService: UserService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    if (this.data) {
      console.log(this.data);
      this.team = this.data.team;
      this.step = this.data.step;
      this.selectedOptionId = this.data.optionId;
      this.selectedOption = this.sharingOptions[this.selectedOptionId - 1];
      console.log(this.selectedOption);
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
    let shared_all_member = false;
    if (this.member === 'allMembers') {
      users = this.team.members.map((member) => member._id);
      shared_all_member = true;
    } else {
      users = [this.member._id];
    }

    let type = 1;
    if (this.selectedOptionId === 1) {
      type = 1;
    } else if (this.selectedOptionId === 2) {
      type = 3;
    }

    this.contactService
      .shareContacts({
        team: this.team._id,
        user: users,
        contacts: this.contacts.map((e) => e._id),
        type: this.selectedOption.id,
        shared_all_member
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
                  title: this.selectedOption.value + ' contacts',
                  additional: errors,
                  message:
                    'You failed to ' +
                    this.selectedOption.value.toLowerCase() +
                    ' these following contacts.'
                }
              });

              if (res.error.length !== this.contacts.length) {
                this.dialogRef.close({ data: res.data });
              } else {
                this.dialogRef.close();
              }
            } else {
              if (this.selectedOption.id === 2) {
                this.dialogRef.close({ data: res.data });
              } else {
                this.dialogRef.close();
              }
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
  goToStep(step): void {
    this.step = step;
  }
  selectSharingOptions(): void {
    this.selectedOption = this.sharingOptions[this.selectedOptionId - 1];
  }
}
