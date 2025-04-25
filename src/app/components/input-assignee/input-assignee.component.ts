import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import * as _ from 'lodash';
import { UserService } from '@services/user.service';
import { Account, User } from '@models/user.model';
import { AssigneeCondition } from '@models/searchOption.model';

@Component({
  selector: 'app-input-assignee',
  templateUrl: './input-assignee.component.html',
  styleUrls: ['./input-assignee.component.scss']
})
export class InputAssigneeComponent implements OnInit {
  @Input('selectedAssignee') selectedAssignee: AssigneeCondition[] = [];
  @Input() selectionType: 'dropdown' | 'checkbox' = 'dropdown';
  @Output() onSelect = new EventEmitter();
  
  USERS: any[];
  allUserList: Account[] = [];
  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUserList();
  }

  isChecked(assignee: Account): boolean {
    return this.selectedAssignee.some(a => a._id === assignee._id);
  }

  toggleCheckbox(assignee: Account, checked: boolean): void {
    if (checked) {
      const exists = this.selectedAssignee.some(a => a._id === assignee._id);
      if (!exists) {
        this.selectedAssignee.push({
          _id: assignee._id,
          user_name: assignee.user_name
        });
      }
    } else {
      this.remove(assignee._id);
    }
    this.onSelect.emit();
  }

  remove(user_id: string): void {
    _.remove(this.selectedAssignee, (e) => {
      return e._id === user_id;
    });
    this.loadUserList();
    this.onSelect.emit();
  }

  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const user_id = evt.option.value;
    const index = _.findIndex(this.selectedAssignee, function (e) {
      return e._id === user_id;
    });
    if (index === -1) {
      const i = _.findIndex(this.allUserList, function(e){
        return e._id === user_id;
      });
      if (i !== -1) {
        const user = {
          _id: this.allUserList[i]._id,
          user_name: this.allUserList[i].user_name,
        }
        this.selectedAssignee.push(user);
      }
    }
    this.loadUserList();
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.onSelect.emit();
  }

  loadUserList(): void {
    this.USERS = [];
    this.userService.accounts$.subscribe((res) => {
      if (res?.accounts?.length) {
        this.allUserList = res.accounts;
        if (this.selectedAssignee.length) {
          this.allUserList.forEach((user) => {
            const index = _.findIndex(this.selectedAssignee, function (e) {
              return e._id === user._id;
            });
            if (index === -1) {
              this.USERS.push(user);
            }
          });
        } else {
          this.USERS = this.allUserList;
        }
      }      
    })    
  }
}
