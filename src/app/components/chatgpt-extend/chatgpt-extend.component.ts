import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TabItem, ComparisonData } from '@utils/data.types';
import { ToastrService } from 'ngx-toastr';
import { Personality } from '@app/models/personality.model';
import { IntegrationService } from 'src/app/services/integration.service';
import { PersonalityService } from '@app/services/personality.service';
import { MatDialog } from '@angular/material/dialog';
import { PersonalityManagerComponent } from '../personality-manager/personality-manager.component';
@Component({
  selector: 'app-chatgpt-extend',
  templateUrl: './chatgpt-extend.component.html',
  styleUrls: ['./chatgpt-extend.component.scss']
})
export class ChatGptExtendComponent {
  tabs: TabItem[] = [
    { label: 'Creator', id: 'creator', icon: '' },
    { label: 'Comparison', id: 'comparison', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  message = '';
  questionStr: string;
  isSending = false;
  adjustMode = false;
  creator: Personality;
  adjustStr: string;

  comparisons: ComparisonData[] = [];
  allPersons: Personality[] = [];
  remainPersons: Personality[] = [];
  @Input() creatorResultContent = '';
  @Output() setVisible = new EventEmitter();
  @Output() getGptResponse = new EventEmitter<string>();
  gptMode: any;
  constructor(
    private toastr: ToastrService,
    private integrationService: IntegrationService,
    public personalityService: PersonalityService,
    private dialog: MatDialog
  ) {
    this.personalityService.personalities$.subscribe((res) => {
      if (res?.length) {
        const userPersons = res.filter((item) => item.role !== 'admin');
        userPersons.sort((x, y) => (y.title > x.title ? 1 : -1));
        const adminPersons = res.filter((item) => item.role === 'admin');
        adminPersons.sort((x, y) => (x.title > y.title ? 1 : -1));
        this.allPersons = [...adminPersons, ...userPersons];
      }
    });
  }

  ngOnInit() {}
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    if (tab.id === 'comparison') {
      if (this.creator && !this.comparisons.length)
        this.comparisons.push({
          id: this.creator._id,
          person: this.creator,
          resultContent: ''
        });
    }
  }
  hideMe(): void {
    this.setVisible.emit();
  }
  clearQuestionStr(): void {
    this.questionStr = '';
  }
  clearAdjustStr(): void {
    this.adjustStr = '';
  }
  getPersonInfo(person: Personality): void {
    if (this.selectedTab.id === 'creator') this.creator = person;
    else {
      this.comparisons = [];
      this.comparisons.push({
        id: person._id,
        person: person,
        resultContent: ''
      });
      this.updateRemainPersons();
    }
  }

  compareContent(): void {
    this.comparisons = [];
    if (this.creator) {
      this.comparisons.push({
        id: this.creator._id,
        person: this.creator,
        resultContent: this.creatorResultContent
      });
    } else {
      this.comparisons.push({
        id: '',
        person: null,
        resultContent: this.creatorResultContent
      });
    }

    this.updateRemainPersons();
    this.selectedTab = this.tabs[1];
  }
  adjustContent(): void {
    this.adjustMode = true;
  }
  insertAnswer(answer: string): void {
    this.getGptResponse.emit(answer);
    this.creatorResultContent = '';
    this.questionStr = '';
  }
  sendQuestion(creationType: string): void {
    if (!this.questionStr) {
      this.toastr.error('Please insert question');
      return;
    }
    if (this.isSending) return;
    let content = 'Please make below sentences more flexible.';
    switch (creationType) {
      case 'creator':
        content = this.creator?.content + ', ' + this.questionStr;
        break;
      case 'comparison':
        content = this.comparisons[0].person.content + ', ' + this.questionStr;
        break;
      default:
        break;
    }

    const data = {
      content
    };
    this.isSending = true;
    this.integrationService.chatGpt(data).subscribe((res) => {
      if (res?.content) {
        switch (creationType) {
          case 'creator':
            this.creatorResultContent = res.content;
            break;
          case 'comparison':
            this.comparisons[0].resultContent = res.content;
            break;
          default:
            break;
        }
      }
      this.isSending = false;
    });
  }

  sendAdjustOrder(): void {
    if (!this.adjustStr) {
      this.toastr.error('Please insert adjust order');
      return;
    }
    if (this.isSending) return;
    const content = this.creatorResultContent + ' ' + this.adjustStr;
    const data = {
      content
    };
    this.isSending = true;
    this.integrationService.chatGpt(data).subscribe((res) => {
      if (res?.content) {
        this.creatorResultContent = res.content;
      }
      this.isSending = false;
      this.adjustMode = false;
    });
  }
  updateRemainPersons(): void {
    this.remainPersons = [...this.allPersons];
    if (!this.comparisons.length) return;
    this.remainPersons = this.allPersons.filter(
      (p) => !this.comparisons.some((c) => p._id === c.person?._id)
    );
  }
  addComparison(person: Personality): void {
    if (this.isSending) return;
    const content = person.content + ', ' + this.questionStr;

    const data = {
      content
    };
    this.isSending = true;
    this.integrationService.chatGpt(data).subscribe((res) => {
      if (res?.content) {
        this.comparisons.push({
          id: person._id,
          person: person,
          resultContent: res.content
        });
        this.isSending = false;
        this.updateRemainPersons();
      }
    });
  }
  removeComparison(id: string): void {
    const _newArray = this.comparisons.filter((c) => c.id !== id);
    this.comparisons = [..._newArray];
    this.updateRemainPersons();
  }

  managePersonality(): void {
    const dialog = this.dialog.open(PersonalityManagerComponent, {
      data: {}
    });
    dialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    dialog.afterClosed().subscribe((res) => {
      if (res && res.status) {
        console.log('response', res);
      }
      this.updateRemainPersons();
    });
  }
}
