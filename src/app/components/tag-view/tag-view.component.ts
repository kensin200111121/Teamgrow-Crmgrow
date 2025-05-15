/**
 * A reusable collapsible settings section component that:
 * - Accepts title and status as input properties
 * - Emits events when the collapsed state changes
 * - Manages expand/collapse UI interactions
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tag-view',
  templateUrl: './tag-view.component.html',
  styleUrls: ['./tag-view.component.scss']
})
export class TagViewComponent {
  @Input() label: string;
  @Input() className: string;
}
