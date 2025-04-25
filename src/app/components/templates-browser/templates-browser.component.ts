import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { STATUS } from '@constants/variable.constants';
import { searchReg } from '@app/helper';
import { TemplatesService } from '@services/templates.service';
import { ThemeService } from '@services/theme.service';

@Component({
  selector: 'app-templates-browser',
  templateUrl: './templates-browser.component.html',
  styleUrls: ['./templates-browser.component.scss']
})
export class TemplatesBrowserComponent implements OnInit {
  TEMPLATE_COLUMNS = ['title', 'template-content', 'template-material'];
  STATUS = STATUS;

  searchTemplateStr = '';
  selectedTemplate;
  emailTemplates = [];
  newsletters = [];
  templates = [];
  filteredResult = [];
  templatePage: number = 1;
  @Output() onClose = new EventEmitter();
  @Output() onOpen = new EventEmitter();
  constructor(
    public templateService: TemplatesService,
    public themeService: ThemeService // private dialogRef: MatDialogRef<TemplatesBrowserComponent>
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.themeService.getNewsletters();
    this.templateService.loadOwnImpl().subscribe((templates) => {
      const emailTemplates = templates.filter((e) => e.type === 'email');
      this.emailTemplates = [...emailTemplates];
      this.mergeTemplatesNewsletters();
    });

    this.themeService.newsletters$.subscribe((res) => {
      this.newsletters = [...res];
      this.mergeTemplatesNewsletters();
    });
  }

  mergeTemplatesNewsletters(): void {
    this.templates = [...this.emailTemplates, ...this.newsletters];
    this.filteredResult = this.templates;
  }

  changeTemplateSearchStr(event: string): void {
    const filtered = this.templates.filter((template) => {
      const str =
        template.title + ' ' + template.content + ' ' + template.subject;
      return searchReg(str, event);
    });
    this.filteredResult = filtered;
    this.searchTemplateStr = event;
    this.templatePage = 1;
  }

  selectTemplate(template): void {
    this.selectedTemplate = template;
  }

  closeDrawer(isSave): void {
    if (!isSave) {
      this.onClose.emit();
    } else {
      this.onClose.emit(this.selectedTemplate);
    }
  }
}
