import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';

@Component({
  selector: 'app-company-input',
  templateUrl: './company-input.component.html',
  styleUrls: ['./company-input.component.scss']
})
export class CompanyInputComponent implements OnInit {
  @Input()
  public set user(value) {
    this.originalStageTitle = value.title;
    this.currentUser = value;
  }
  @Output() stageChange = new EventEmitter();
  originalStageTitle = '';
  currentUser: User = new User();
  updateSubscription: Subscription;
  updating = false;

  constructor() {}

  ngOnInit(): void {}

  saveStage(event): void {
    if (this.originalStageTitle === this.currentUser.company) {
      return;
    }
    this.save();
  }

  checkAndSave(event): void {
    if (event.keyCode === 13) {
      if (this.originalStageTitle === this.currentUser.company) {
        return;
      }
      this.save();
    }
  }

  save(): void {
    // this.updating = true;
    // this.updateSubscription && this.updateSubscription.unsubscribe();
    // this.updateSubscription = this.dealService
    //   .updateStage(this.currentStage._id, this.currentStage.title)
    //   .subscribe((res) => {
    //     this.updating = false;
    //     if (res) {
    //       this.originalStageTitle = this.currentStage.title;
    //       this.toast.success('', 'Deal Stage is updated successfully.', {
    //         closeButton: true
    //       });
    //     }
    //   });
  }
}
