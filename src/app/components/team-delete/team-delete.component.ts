import { Component, OnInit, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TeamService } from '@services/team.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmLeaveTeamComponent } from '../../components/confirm-leave-team/confirm-leave-team.component';
import { UserService } from '../../services/user.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team-delete',
  templateUrl: './team-delete.component.html',
  styleUrls: ['./team-delete.component.scss']
})
export class TeamDeleteComponent implements OnInit {
  updating = false;
  team;
  submitted = false;
  userId = '';
  leaveTeamSubscription: Subscription;
  profileSubscription: Subscription;
  constructor(
    private teamService: TeamService,
    private toast: ToastrService,
    private dialogRef: MatDialogRef<TeamDeleteComponent>,
    private dialog: MatDialog,
    private router: Router,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.team) {
      this.team = { ...this.data.team };
    }
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res._id) {
        this.userId = res._id;
      }
    });
  }

  ngOnInit(): void {}
  deleteTeam(): void {
    this.updating = true;
    this.leaveTeamSubscription &&
      this.leaveTeamSubscription.unsubscribe();
    this.leaveTeamSubscription = this.teamService
      .ableLeaveTeam(this.team._id, this.userId)
      .subscribe((res) => {
        if (res.failed?.length > 0) {
          this.updating = false;
          this.dialogRef.close();
          this.dialog.open(ConfirmLeaveTeamComponent, {
            position: { top: '100px' },
            width: '657px',
            maxWidth: '657px',
            disableClose: true,
            data: {
              title: 'Leave Team',
              additional: res.failed,
              message:
                "To delete, you must stop sharing the following items with this community. Once you've stopped sharing these items, try to delete again."
            }
          });
        } else {
          this.teamService.delete(this.team._id).subscribe(
            (res) => {
              this.updating = false;
              this.router.navigate(['/community']);
              this.dialogRef.close(res);
            },
            (err) => {
              this.updating = false;
              this.dialogRef.close();
            }
          );
        }
      });    
  }
}
