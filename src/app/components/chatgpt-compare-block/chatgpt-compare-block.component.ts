import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ComparisonData } from '@app/utils/data.types';
@Component({
  selector: 'app-chatgpt-compare-block',
  templateUrl: './chatgpt-compare-block.component.html',
  styleUrls: ['./chatgpt-compare-block.component.scss']
})
export class ChatGptCompareBlockComponent {
  id: string;
  personTitle: string;
  resultContent: string;
  @Input() set compData(val: ComparisonData) {
    if (val) {
      this.id = val?.id;
      this.personTitle = val?.person?.title;
      this.resultContent = val.resultContent;
    }
  }
  @Output() removeMe = new EventEmitter<string>();
  @Output() insertAnswer = new EventEmitter<string>();
  isSending: boolean;
  constructor() {}
  sendQuestion() {}
  sendAnswer(): void {
    this.insertAnswer.emit(this.resultContent);
  }
  closeMe(): void {
    this.removeMe.emit(this.id);
  }
}
