import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TeamService } from '@services/team.service';
import { ContactService } from '@services/contact.service';
import { UserService } from '@services/user.service';
import { ConfirmShareContactsComponent } from '@components/confirm-share-contacts/confirm-share-contacts.component';
import * as _ from 'lodash';
import { environment } from '@environments/environment';
@Component({
  selector: 'app-contact-share',
  templateUrl: './contact-share.component.html',
  styleUrls: ['./contact-share.component.scss']
})
export class ContactShareComponent implements OnInit {
  contacts = [];
  internalOnly = true;
  submitted = false;
  loading = false;
  userId;
  role = 'viewer';
  selectedTeam;
  members = [];
  selectedMember;
  internalTeamCount = 0;
  communityCount = 0;

  constructor(
    private dialogRef: MatDialogRef<ContactShareComponent>,
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
    if (environment.isSspa) {
      this.internalOnly = true;
    } else if (profile?.user_version < 2.3) {
      this.internalOnly = false;
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
      this.members = [
        ...this.selectedTeam.owner,
        ...this.selectedTeam.editors,
        ...this.selectedTeam.members
      ];
      this.role = 'owner';

      this.members = _.uniqBy(this.members, '_id');
      // remove yourself from members.
      const index = this.members.findIndex((item) => item._id === this.userId);
      if (index >= 0) {
        this.members.splice(index, 1);
      }

      if (this.role !== 'owner') {
        this.members = this.members.filter(
          (e) =>
            this.selectedTeam.owner.findIndex(
              (owner) => owner._id === e._id
            ) !== -1
        );
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

  shareContact(): void {
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

    this.contactService
      .shareContacts({
        team: this.selectedTeam._id,
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
}
