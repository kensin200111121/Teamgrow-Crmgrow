import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Automation } from '@models/automation.model';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-select-automation',
  templateUrl: './select-automation.component.html',
  styleUrls: ['./select-automation.component.scss']
})
export class SelectAutomationComponent implements OnInit {
  tag_id = '';
  selectedAutomation: string = '';
  saving = false;
  garbage: Garbage = new Garbage();
  garbageSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<SelectAutomationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private toast: ToastrService
  ) {
    if (this.data) {
      this.tag_id = this.data.tag_id;
    }
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
      if (!this.garbage.tag_automation) {
        this.garbage.tag_automation = {};
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt._id;
  }

  assign(): void {
    if (!this.selectedAutomation) {
      return;
    }
    this.saving = true;
    this.garbage.tag_automation[this.tag_id] = this.selectedAutomation;
    this.userService
      .updateGarbage({ tag_automation: this.garbage.tag_automation })
      .subscribe(() => {
        this.saving = false;
        this.userService.updateGarbageImpl({
          tag_automation: this.garbage.tag_automation
        });
        this.dialogRef.close(this.selectedAutomation);
      });
  }
}
