/**
 * A reusable collapsible settings section component that:
 * - Accepts title and status as input properties
 * - Emits events when the collapsed state changes
 * - Manages expand/collapse UI interactions
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-collapsable-settings',
  templateUrl: './collapsable-settings.component.html',
  styleUrls: ['./collapsable-settings.component.scss']
})
export class CollapsableSettingsComponent {
  @Input() title: string;
  @Input() status: string;
  @Output() collapsedChange = new EventEmitter();
  onChangeStatus() {
    this.collapsedChange.emit();
  }
}
