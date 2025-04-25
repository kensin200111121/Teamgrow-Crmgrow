import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActionItem } from '@utils/data.types';

@Component({
  selector: 'app-actions-bar',
  templateUrl: './actions-bar.component.html',
  styleUrls: ['./actions-bar.component.scss']
})
export class ActionsBarComponent implements OnInit {
  isActiveFlag = false;
  isShow = false;
  @Output() doCommand: EventEmitter<any> = new EventEmitter();
  @Input('actions') actions: ActionItem[] = [];
  @Input()
  public set isActive(val: number) {
    if (val) {
      this.isActiveFlag = true;
    } else {
      this.isActiveFlag = false;
      this.isShow = true;
    }
  }
  constructor() {}

  ngOnInit(): void {}

  /**
   * Hide action bar
   */
  hide(): void {
    this.isShow = false;
  }
  /**
   * Show action bar
   */
  show(): void {
    this.isShow = true;
  }

  /**
   * Emit the event to run the command
   * @param command: Command Name
   */
  runCommand(command: any): void {
    this.doCommand.emit(command);
  }
}
