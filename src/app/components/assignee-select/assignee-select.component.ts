import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';

import * as _ from 'lodash';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '@services/user.service';
import { Assignee } from '@models/user.model';

@Component({
  selector: 'app-assignee-select',
  templateUrl: './assignee-select.component.html',
  styleUrls: ['./assignee-select.component.scss']
})
export class AssigneeSelectComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input()
  public set value(val: string) {
    this.userService.accounts$.subscribe((res) => {
      if (res?.accounts?.length) {
        this.userList =
          res?.accounts.map((e) => {
            return {
              _id: e._id,
              user_name: e.user_name,
              picture_profile: e.picture_profile,
              avatar_name: e.avatarName
            };
          }) || [];
        if (typeof val !== 'undefined') {
          if (this.userList.length) {
            const selected = _.find(this.userList, (e) => e._id === val);
            this.formControl.setValue(selected, { emitEvent: false });
          }
        }
      }
    });
  }
  @Output() valueChange = new EventEmitter();
  @Input('type') type = ''; // form style input
  @Input('mode') mode = ''; // form style input
  @Input('disabled') disabled = true;
  @ViewChild('inputField') trigger: ElementRef;
  @ViewChild(MatAutocompleteTrigger)
  autocompleteTrigger: MatAutocompleteTrigger;
  formControl: UntypedFormControl = new UntypedFormControl();
  selectedAssignee: Assignee;
  userList: Assignee[] = [];
  teamMemberAvatarColors = {};

  protected _onDestroy = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.accounts$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((res) => {
        this.userList =
          res?.accounts.map((e) => {
            return {
              _id: e._id,
              user_name: e.user_name,
              picture_profile: e.picture_profile,
              avatar_name: e.avatarName
            };
          }) || [];
      });

    this.formControl.valueChanges.subscribe((value) => {
      if (value && value._id) {
        if (value._id === 'unassign') {
          this.formControl.setValue(null);
        }
        this.valueChange.emit(value._id);
      } else {
        this.valueChange.emit('');
      }
    });
    if (this.disabled) this.formControl.disable();
    else this.formControl.enable();

    this.userService.teamInfo$.subscribe((teamInfo) => {
      this.teamMemberAvatarColors = {};
    
      if (teamInfo?.data?.organization?.members) {
        this.teamMemberAvatarColors = teamInfo.data.organization.members.reduce((acc, member) => {
    
          if (member?.user && member.avatar_color) {
            acc[member.user] = member.avatar_color;
          }
          return acc;
        }, {});
      }
    });
  }

  getAssigneeAvatarColor(assigneeId): string {
    return this.teamMemberAvatarColors[assigneeId] || '';
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onChangeAssignee(event: MatAutocompleteSelectedEvent): void {}

  ngAfterViewInit(): void {}

  focusField(): void {
    this.trigger.nativeElement.focus();
    this.trigger.nativeElement.blur();
  }

  closePopups() {
    if (this.autocompleteTrigger && this.autocompleteTrigger.panelOpen) {
      this.autocompleteTrigger.closePanel();
    }
  }
}
