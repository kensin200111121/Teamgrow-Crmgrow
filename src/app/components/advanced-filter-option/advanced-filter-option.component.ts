import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SearchOption } from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-advanced-filter-option',
  templateUrl: './advanced-filter-option.component.html',
  styleUrls: ['./advanced-filter-option.component.scss']
})
export class AdvancedFilterOptionComponent implements OnInit {
  selectedTab = 'own';
  constructor(
    private dialogRef: MatDialogRef<AdvancedFilterOptionComponent>,
    private contactService: ContactService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.selectedTab = this.data.selectedTab;
  }

  ngOnInit(): void {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  applyFilter($event): void {
    const currentOption = this.contactService.searchOption.getValue();
    this.contactService.searchOption.next(
      new SearchOption().deserialize({
        ...currentOption,
        ...$event
      })
    );
    this.dialogRef.close({
      state: 'filtering'
    });
  }
}
