import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { DealStage } from '@models/deal-stage.model';
import { DealsService } from '@services/deals.service';

@Component({
  selector: 'app-stage-input',
  templateUrl: './stage-input.component.html',
  styleUrls: ['./stage-input.component.scss']
})
export class StageInputComponent implements OnInit {
  @Input()
  public set stage(value) {
    this.originalStageTitle = value.title;
    this.currentStage = value;
  }
  @Output() stageChange = new EventEmitter();
  originalStageTitle = '';
  currentStage = new DealStage();

  updateSubscription: Subscription;
  updating = false;

  constructor(
    private dealService: DealsService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {}

  saveStage(event): void {
    if (this.originalStageTitle === this.currentStage.title) {
      return;
    }
    this.save();
  }

  checkAndSave(event): void {
    if (event.keyCode === 13) {
      if (this.originalStageTitle === this.currentStage.title) {
        return;
      }
      this.save();
    }
  }

  save(): void {
    this.updating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    const request = {
      title: this.currentStage.title
    };
    this.updateSubscription = this.dealService
      .updateStage(this.currentStage._id, request)
      .subscribe((res) => {
        this.updating = false;
        if (res) {
          this.originalStageTitle = this.currentStage.title;
          this.dealService.updatePageStages(this.currentStage._id, request);
        }
      });
  }
}
