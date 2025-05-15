import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { ActionItem } from '@utils/data.types';

@Component({
  selector: 'app-actions-header',
  templateUrl: './actions-header.component.html',
  styleUrls: ['./actions-header.component.scss']
})
export class ActionsHeaderComponent implements OnInit {
  @Input('disableActions') disableActions: ActionItem[] = [];
  @Input('iconSize') iconSize = '';
  @Input('actions')
  public set actions(_actions: ActionItem[]) {
    if (!this._actions.length) {
      this._actions = _actions;
      if (_actions.length < 7) {
        this.showActions = _actions;
      } else {
        this.showActions = _actions.slice(0, 5);
        this.moreActions = _actions.slice(5);
      }
    }
  }
  @Output() doCommand: EventEmitter<any> = new EventEmitter();

  _actions: ActionItem[] = [];
  showActions: ActionItem[] = [];
  moreActions: ActionItem[] = [];

  @ViewChild('moreDrop') moreDrop: NgbDropdown;

  constructor() {}

  ngOnInit(): void {}

  runCommand(command: any, isMore = false): void {
    if (command.loading) {
      return;
    }
    this.doCommand.emit(command);
    if (isMore && command.command !== 'download') {
      setTimeout(() => {
        this.moreDrop.open();
      }, 50);
    }
  }

  hasProp(action: ActionItem, property: string): boolean {
    return action.hasOwnProperty(property);
  }

  isDisableAction(action): boolean {
    if (action.label) {
      const index = this.disableActions?.findIndex(
        (item) => item.label === action.label
      );
      if (index >= 0) {
        return true;
      }
    }
    return false;
  }
}
