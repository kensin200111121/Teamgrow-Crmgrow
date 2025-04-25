import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ACTION_CAT } from '@constants/variable.constant';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-action-step',
  templateUrl: './action-step.component.html',
  styleUrls: ['./action-step.component.scss']
})
export class ActionStepComponent implements OnInit {
  @Input('category') category;
  @Input('hasChild') hasChild;
  @Input('action') action;
  @Input('condHasChild') condHasChild;
  @Output() insertStep = new EventEmitter();
  @Output() editAction = new EventEmitter();
  @Output() editEvent = new EventEmitter();
  @Output() removeEvent = new EventEmitter();

  timezone;

  constructor(private authService: AuthService) {
    this.timezone = this.authService.getUserInfoItem('time_zone');
  }

  ngOnInit() {}

  addNextStep() {
    this.insertStep.emit(this.action);
  }
  addCondNext(cond) {
    if (cond == 'right') {
      this.insertStep.emit(this.action.sub_actions[0]);
    } else {
      this.insertStep.emit(this.action.sub_actions[1]);
    }
  }

  editActionFn(action) {
    this.editAction.emit(action);
  }

  edit(action) {
    this.editEvent.emit(action);
  }

  remove(action) {
    this.removeEvent.emit(action);
  }

  ActionCategory = ACTION_CAT;
  ActionTypes = {
    follow_up: 'Follow Up',
    note: 'Note',
    email: 'Email',
    send_text_video: 'Send Video(SMS)',
    send_email_video: 'Send Video(Email)',
    send_text_pdf: 'Send PDF(SMS)',
    send_email_pdf: 'Send PDF(Email)',
    send_text_image: 'Send Image(SMS)',
    send_email_image: 'Send Image(Email)'
  };

  ConditionActions = {
    watched_video: 'Watched Video',
    watched_pdf: 'Watched PDF',
    watched_image: 'Watched Image'
  };
}
