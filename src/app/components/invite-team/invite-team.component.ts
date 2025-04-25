import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { User } from '@models/user.model';
import { TeamService } from '@services/team.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-invite-team',
  templateUrl: './invite-team.component.html',
  styleUrls: ['./invite-team.component.scss']
})
export class InviteTeamComponent implements OnInit {
  newMembers: User[] = [];
  oldMembers: User[] = [];
  joinLink = '';
  teamId = '';
  team;

  inviteSubscription: Subscription;
  inviting = false;
  resentSubscription: Subscription[];
  resendingMembers: string[] = []; // user id | referral emails
  cancelSubscription: Subscription[];
  cancelingMembers: string[] = []; // userid | referral email
  canceling = false;
  resending = false;
  selectedEmails = [];
  resendEmail = '';
  cancelEmail = '';

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<InviteTeamComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private teamService: TeamService,
    private toast: ToastrService,
    private clipboard: Clipboard,
    public sspaService: SspaService
  ) {
    if (this.data._id) {
      this.teamId = this.data._id;
      this.team = this.data;
    }
    if (this.data.join_link) {
      this.joinLink = `https://crmgrow.com/invite_ref=${this.data.join_link}`;
    }
    if (this.data.invites) {
      this.data.invites.forEach((e) => {
        this.oldMembers.push(new User().deserialize(e));
      });
    }
    if (this.data.referrals) {
      this.data.referrals.forEach((e) => {
        if (e) {
          const user_name = e.user_name ? e.user_name : e.split('@')[0];
          this.oldMembers.push(
            new User().deserialize({
              email: e,
              user_name
            })
          );
        }
      });
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  /**
   * add member to the new list
   * @param event: Selected User data
   */
  addMember(event: User): void {
    let searchQ = {};
    if (event._id) {
      searchQ = { _id: event._id };
    } else {
      searchQ = { email: event.email };
    }
    const positionInOld = _.findIndex(this.oldMembers, searchQ);
    if (positionInOld !== -1) {
      return;
    }
    const position = _.findIndex(this.newMembers, searchQ);
    if (position === -1) {
      this.newMembers.push(event);
    }
  }

  /**
   * remove member from the new invitation list
   * @param event: Selected user data
   */
  removeMember(event: User): void {
    let searchQ = {};
    if (event._id) {
      searchQ = { _id: event._id };
    } else {
      searchQ = { email: event.email };
    }
    const position = _.findIndex(this.newMembers, searchQ);
    if (position !== -1) {
      this.newMembers.splice(position, 1);
    }
  }

  /**
   * resend the invitation to the User or Referrals
   * @param event: User
   */
  resendInvitation(member): void {
    if (member) {
      const emails = [member.email];
      this.resendEmail = member.email;
      this.resending = true;
      this.inviteSubscription = this.teamService
        .inviteUsers(this.teamId, emails)
        .subscribe(
          () => {
            this.resending = false;
            // this.dialogRef.close();
          },
          () => {
            this.resending = false;
          }
        );
    }
  }

  /**
   * cancel the invitation
   * @param event: User
   */
  cancelInvitation(member): void {
    if (member) {
      this.dialog
        .open(ConfirmComponent, {
          maxWidth: '360px',
          width: '96vw',
          data: {
            title: 'Cancel Invitation',
            message: 'Are you sure to cancel this invitation?',
            cancelLabel: 'No',
            confirmLabel: 'Ok'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const emails = [member.email];
            this.cancelEmail = member.email;
            this.canceling = true;
            this.teamService.cancelInvite(this.teamId, emails).subscribe(
              (response) => {
                this.canceling = false;
                if (member._id) {
                  this.team.invites.some((e, index) => {
                    if (e.email === member.email) {
                      this.team.invites.splice(index, 1);
                      return true;
                    }
                  });
                } else {
                  this.team.referrals.some((e, index) => {
                    if (e === member.email) {
                      this.team.referrals.splice(index, 1);
                      return true;
                    }
                  });
                }
                const searchQ = { email: member.email };
                const positionInOld = _.findIndex(this.oldMembers, searchQ);
                if (positionInOld !== -1) {
                  this.oldMembers.splice(positionInOld, 1);
                }
                // this.toast.success(
                //   'You cancelled the invitation successfully.'
                // );
              },
              (err) => {
                this.canceling = false;
              }
            );
          }
        });
    }
  }

  /**
   * Check if the current user is resending
   * @param member : Confirm User
   */
  isResending(member: User): boolean {
    const identifier = member._id || member.email;
    const position = this.resendingMembers.indexOf(identifier);
    if (position !== -1) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Check if the current user is canceling
   * @param member
   */
  isCanceling(member: User): boolean {
    const identifier = member._id || member.email;
    const position = this.cancelingMembers.indexOf(identifier);
    if (position !== -1) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Send Invitation to the new members
   */
  sendInvitation(): void {
    if (!this.selectedEmails.length) {
      this.dialogRef.close();
      return;
    } else {
      // Send Invitation
      const emails = [];
      for (const user of this.selectedEmails) {
        emails.push(user.email);
      }
      this.inviting = true;
      this.inviteSubscription = this.teamService
        .inviteUsers(this.teamId, emails)
        .subscribe(
          (res) => {
            this.inviting = false;
            if (res && res.status) {
              this.dialogRef.close({
                invitations: res['data']['invites'],
                referrals: res['data']['referrals']
              });
            }
          },
          () => {
            this.inviting = false;
          }
        );
    }
  }

  copyLink(): void {
    this.clipboard.copy(this.joinLink);
    this.toast.success('Copied the link to clipboard');
  }
}
