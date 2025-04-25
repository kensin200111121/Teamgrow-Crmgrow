import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'app-chatgpt-button',
  templateUrl: './chatgpt-button.component.html',
  styleUrls: ['./chatgpt-button.component.scss']
})
export class ChatGptButtonComponent {
  @Input() enabled = true;
  @Output() setAiMode = new EventEmitter<boolean>();
  constructor() {}

  setAICreateMode(createMode = true): void {
    this.setAiMode.emit(createMode);
  }
}
