import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResourceBrowserBase } from '@components/resource-browser-base/resource-browser-base.component';
import {
  AutomationItem,
  FilterTypeItem
} from '@core/interfaces/resources.interface';
import { AutomationListService } from '@services/automation-list.service';
import {
  AutomationType,
  ListType,
  ResourceCategory
} from '@core/enums/resources.enum';

@Component({
  selector: 'app-automation-browser',
  templateUrl: './automation-browser.component.html',
  styleUrls: ['./automation-browser.component.scss']
})
export class AutomationBrowserComponent
  extends ResourceBrowserBase<
    AutomationItem,
    AutomationListService,
    AutomationType
  >
  implements OnInit, OnDestroy
{
  DISPLAY_COLUMNS = ['select', 'title', 'action-count'];
  LIST_TYPE: ListType = ListType.OWN;
  SORT_TYPES: FilterTypeItem<AutomationType>[] = [
    { id: AutomationType.ALL, label: 'All types' },
    { id: AutomationType.FOLDER, label: 'Folder' },
    { id: AutomationType.CONTACT, label: 'Contact' },
    { id: AutomationType.DEAL, label: 'Deal' }
  ];
  sortType = this.SORT_TYPES[0];
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.AUTOMATION;

  sharing = false;
  shareSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    protected dialogRef: MatDialogRef<AutomationBrowserComponent>,
    protected service: AutomationListService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    super();
    if (this.data.hideAutomations && this.data.hideAutomations.length > 0) {
      this.hideItems = this.data.hideAutomations;
    }
  }

  ngOnInit(): void {
    this.goToFolder('');
  }

  ngOnDestroy(): void {}
}
