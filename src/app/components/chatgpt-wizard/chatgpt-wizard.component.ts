import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { IntegrationService } from 'src/app/services/integration.service';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import { StripTagsPipe } from 'ngx-pipes';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-chatgpt-wizard',
  templateUrl: './chatgpt-wizard.component.html',
  styleUrls: ['./chatgpt-wizard.component.scss'],
  providers: [StripTagsPipe]
})
export class ChatGptWizardComponent {
  
  questionStr: string;
  isSending = false;
  gptMode = 'insertMode';
  planeText = '';

  @ViewChild('mainDrop') dropdown: NgbDropdown;
  private _data = new BehaviorSubject<string>('');
  @Input()
  set baseContent(value) {
    this._data.next(value);
  };
  get baseContent() {
    return this._data.getValue();
  }
  

  @Output() getGptResponse = new EventEmitter<{
    content: string;
    gptMode: string;
  }>();
  constructor(
    private integrationService: IntegrationService,
    private toastr: ToastrService,
    private stripTags: StripTagsPipe,
  ) {}

  ngOnInit() {
    this._data
      .subscribe(x => {
        this.planeText = this.stripTags.transform(this.baseContent || '').trim();
      });
  }  
  clearQuestionStr(): void {
    this.questionStr = '';
  }

  sendQuestion(): void {
    if (!this.questionStr) {
      this.toastr.warning('Please insert question');
      return;
    }
    let content = '';
    if (this.gptMode === 'insertMode') content = this.questionStr;
    else content = this.planeText + '\n\n' + this.questionStr;
    const data = {
      content
    };
    this.isSending = true;
    this.integrationService.chatGpt(data).subscribe((res) => {
      if (res?.content) {
        this.dropdown.close();
        this.getGptResponse.emit({ content: res.content, gptMode: this.gptMode });
        this.questionStr = '';
      }
      this.isSending = false;
    });
  }
}
