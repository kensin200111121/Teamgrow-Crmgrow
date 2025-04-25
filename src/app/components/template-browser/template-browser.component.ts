import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { TemplatesService } from '@services/templates.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResourceBrowserBase } from '@components/resource-browser-base/resource-browser-base.component';
import { TemplateListService } from '@services/template-list.service';
import {
  FilterTypeItem,
  SortTypeItem,
  TemplateItem
} from '@core/interfaces/resources.interface';
import {
  ListType,
  ResourceCategory,
  TemplateType
} from '@core/enums/resources.enum';

@Component({
  selector: 'app-template-browser',
  templateUrl: './template-browser.component.html',
  styleUrls: ['./template-browser.component.scss']
})
export class TemplateBrowserComponent
  extends ResourceBrowserBase<TemplateItem, TemplateListService, TemplateType>
  implements OnInit, OnDestroy
{
  DISPLAY_COLUMNS = ['select', 'title', 'template-content', 'template-type'];
  LIST_TYPE: ListType = ListType.OWN;
  SORT_TYPES: FilterTypeItem<TemplateType>[] = [
    { id: TemplateType.ALL, label: 'All types' },
    { id: TemplateType.FOLDER, label: 'Folder' },
    { id: TemplateType.EMAIL, label: 'Email' },
    { id: TemplateType.TEXT, label: 'Text' }
  ];
  sortType = this.SORT_TYPES[0];
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.TEMPLATE;
  sharing = false;

  constructor(
    protected service: TemplateListService,
    protected dialogRef: MatDialogRef<TemplateBrowserComponent>,
    public templatesService: TemplatesService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    super();
    if (this.data.hideTemplates && this.data.hideTemplates.length > 0) {
      this.hideItems = this.data.hideTemplates;
    }
  }

  ngOnInit(): void {
    this.goToFolder('');
  }

  ngOnDestroy(): void {}
}
