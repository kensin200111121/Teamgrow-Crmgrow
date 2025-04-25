import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { ContactService } from '@app/services/contact.service';
import { TeamService } from '@app/services/team.service';
import { UserService } from '@app/services/user.service';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { ConfirmShareContactsComponent } from '../confirm-share-contacts/confirm-share-contacts.component';

@Component({
  selector: 'app-contact-move',
  templateUrl: './contact-move.component.html',
  styleUrls: ['./contact-move.component.scss']
})
export class ContactMoveComponent implements OnInit {
  contacts = [];
  submitted = false;
  internalOnly = false;
  loading = false;
  userId;
  role = 'viewer';
  selectedTeam;
  members = [];
  selectedMember;
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
  selectedOption = this.sharingOptions[0];
  selectedOptionId = 1;
  internalTeamCount = 0;
  communityCount = 0;

  constructor(
    private dialogRef: MatDialogRef<ContactMoveComponent>,
    private teamService: TeamService,
    private contactService: ContactService,
    private toastr: ToastrService,
    private userService: UserService,
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.teamService.loadAll(true);
  }

  ngOnInit(): void {
    if (this.data) {
      this.contacts = this.data.contacts;
    }
    const profile = this.userService.profile.getValue();
    if (profile) {
      this.userId = profile._id;
    }
    this.loadTeam();
  }

  loadTeam(): void {
    this.teamService.teams$.subscribe((res) => {
      const teams = res;
      const internalTeam = teams.filter((e) => e.is_internal);
      if (internalTeam.length) {
        this.internalTeamCount = internalTeam.length;
        this.communityCount = teams.length - internalTeam.length;
        this.selectTeam(internalTeam[0]);
      } else {
        this.communityCount = teams.length;
      }
      if (this.internalOnly) {
        this.communityCount = 0;
      }
    });
    this.teamService.loadAll(false);
  }

  selectTeam($event): void {
    if ($event) {
      this.selectedTeam = $event;
      this.members = [];
      for (const owner of this.selectedTeam.owner) {
        this.members.push(owner);
        if (owner._id === this.userId) {
          this.role = 'owner';
        }
      }
      for (const editor of this.selectedTeam.editors) {
        this.members.push(editor);
        if (editor._id === this.userId) {
          this.role = 'editor';
        }
      }
      for (const member of this.selectedTeam.members) {
        this.members.push(member);
        if (member._id === this.userId && this.role !== 'editor') {
          this.role = 'viewer';
        }
      }

      this.members = _.uniqBy(this.members, '_id');
      // remove yourself from members.
      const index = this.members.findIndex((item) => item._id === this.userId);
      if (index >= 0) {
        this.members.splice(index, 1);
      }

      this.changeDetectorRef.detectChanges();
    } else {
      this.selectedTeam = null;
      this.members = [];
    }
  }

  selectMember($event): void {
    if ($event) {
      this.selectedMember = $event;
    } else {
      this.selectedMember = null;
    }
  }

  moveContact(): void {
    this.submitted = true;
    if (!this.selectedTeam || !this.selectedMember || !this.contacts.length) {
      return;
    }
    this.loading = true;
    let users;
    let mode = 'single';
    if (this.selectedMember === 'allMembers') {
      users = this.selectedTeam.members.map((member) => member._id);
      const owners = this.selectedTeam.owner.map((e) => e._id);
      users = [...users, ...owners];
      mode = 'all_member';
    } else if (this.selectedMember === 'round_robin') {
      mode = 'round_robin';
    } else {
      users = [this.selectedMember._id];
    }

    let type = 1;
    if (this.selectedOptionId === 1) {
      type = 1;
    } else if (this.selectedOptionId === 2) {
      type = 3;
    }

    this.contactService
      .shareContacts({
        team: this.selectedTeam._id,
        user: users,
        contacts: this.contacts.map((e) => e._id),
        type,
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
              this.dialogRef.close({ data: res.data });
            }
          } else {
            this.toastr.error(res.error, 'Move contacts to team member', {
              timeOut: 5000
            });
            this.dialogRef.close();
          }
        }
      });
  }

  goToStep(step): void {
    this.step = step;
  }

  selectSharingOptions(): void {
    this.selectedOption = this.sharingOptions[this.selectedOptionId - 1];
  }
}
