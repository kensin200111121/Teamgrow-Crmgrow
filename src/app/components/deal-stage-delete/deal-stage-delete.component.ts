import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from '@services/deals.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { DealStage } from '@models/deal-stage.model';
import { ToastrService } from 'ngx-toastr';
import { ConfirmComponent } from '@components/confirm/confirm.component';

@Component({
  selector: 'app-deal-stage-delete',
  templateUrl: './deal-stage-delete.component.html',
  styleUrls: ['./deal-stage-delete.component.scss']
})
export class DealStageDeleteComponent implements OnInit {
  stages: any[] = [];
  selectedstage: DealStage = new DealStage();
  targetStage = '';
  saving = false;

  constructor(
    private dealsService: DealsService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<DealStageDeleteComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...this.stages, ...res];
      if (this.data.deleteId == this.stages[0]._id) {
        this.targetStage = this.stages[1]._id;
      } else {
        this.targetStage = this.stages[0]._id;
      }
      this.stages.forEach((stage) => {
        if (stage._id == this.data.deleteId) {
          this.selectedstage = stage;
        }
      });
    });
  }

  moveDeal(): void {
    this.saving = true;
    const index = this.stages.findIndex(
      (item) => item._id === this.targetStage
    );
    if (index >= 0) {
      const targetStage = this.stages[index];
      if (targetStage.automation) {
        this.dialog
          .open(ConfirmComponent, {
            maxWidth: '360px',
            width: '96vw',
            data: {
              title: 'Assign Automation',
              message:
                'There is a stage automation assigned in destination stage. Will you assign that stage automation to the moving deals?',
              confirmLabel: 'Yes, Assign',
              cancelLabel: 'No'
            }
          })
          .afterClosed()
          .subscribe((answer) => {
            this.dealsService
              .deleteStage(this.data.deleteId, this.targetStage, answer)
              .subscribe((res) => {
                this.saving = false;
                if (res) {
                  // this.toastr.success(
                  //   'Deal Stage has been deleted and associated contacts has been moved to a different stage.'
                  // );
                  this.dialogRef.close(this.targetStage);
                }
              });
          });
      } else {
        this.dealsService
          .deleteStage(this.data.deleteId, this.targetStage)
          .subscribe((res) => {
            this.saving = false;
            if (res) {
              // this.toastr.success(
              //   'Deal Stage has been deleted and associated contacts has been moved to a different stage.'
              // );
              this.dialogRef.close(this.targetStage);
            }
          });
      }
    }
  }
}
