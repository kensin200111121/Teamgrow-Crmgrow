import { Component, OnInit, Inject } from '@angular/core';
import { ContactService } from '@services/contact.service';
import * as _ from 'lodash';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JSONParser } from '@utils/functions';
import { MAX_COLUMN_COUNT } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';

type Column = {
  id: string;
  name: string;
  additional_field?: boolean;
};

@Component({
  selector: 'app-column-edit',
  templateUrl: './column-edit.component.html',
  styleUrls: ['./column-edit.component.scss']
})
export class ColumnEditComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<ColumnEditComponent>,
    public contactService: ContactService,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  selectedColumns: string[] = [];
  filteredColumns: Column[] = [];
  searchStr = '';
  private DEFAULT_COLUMNS = this.data.defaultColumns;
  private CUSTOM_COLUMNS = this.data.customColumns;
  private KEY_NAME = this.data.columnsTarget;
  private ALL_COLUMNS: Column[] = [];
  COLUMN_DIC: Record<string, Column> = {};

  ngOnInit() {
    const columns = localStorage.getCrmItem(this.KEY_NAME);

    this.ALL_COLUMNS = [...this.DEFAULT_COLUMNS];
    for (let i = 0; i < this.CUSTOM_COLUMNS.length; i++) {
      this.ALL_COLUMNS.push({
        id: this.CUSTOM_COLUMNS[i].id,
        name: this.CUSTOM_COLUMNS[i].name,
        additional_field: true
      });
    }
    this.COLUMN_DIC = this.ALL_COLUMNS.reduce(
      (result, current) => ({ ...result, [current.id]: current }),
      {}
    );
    if (columns) {
      const storedColumns = JSONParser(columns);
      const selectedColumnsTmp =
        typeof storedColumns[0] !== 'string'
          ? storedColumns
              .filter((e) => e.selected)
              .sort((a, b) => a.order < b.order)
              .map((e) => e.id)
          : storedColumns;

      this.selectedColumns = selectedColumnsTmp.filter(
        (e: string) => !!this.COLUMN_DIC[e]
      );
    }
    if (!this.selectedColumns.length) {
      const defaultColumns = this.DEFAULT_COLUMNS.filter((e) => e.selected).map(
        (e) => e.id
      );
      this.selectedColumns = defaultColumns.filter(
        (e: string) => !!this.COLUMN_DIC[e]
      );
    }
    this.filteredColumns = this.ALL_COLUMNS;
  }

  /**
   * Change the search str
   */
  changeSearchStr(): void {
    if (this.searchStr) {
      this.filteredColumns = _.filter(this.ALL_COLUMNS, (e: Column) => {
        return e.name.toLowerCase().indexOf(this.searchStr.toLowerCase()) > -1;
      });
    } else {
      this.filteredColumns = this.ALL_COLUMNS;
    }
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filteredColumns = this.ALL_COLUMNS;
  }

  toggleColumn(event: Event, col: Column): void {
    event.preventDefault();
    const pos = this.selectedColumns.indexOf(col.id);
    if (pos !== -1) {
      this.selectedColumns.splice(pos, 1);
    } else {
      if (this.selectedColumns.length >= MAX_COLUMN_COUNT) {
        this.toastr.error('Max column count should be ' + MAX_COLUMN_COUNT);
        (event.target as HTMLInputElement).checked = false;
        return;
      }
      this.selectedColumns.push(col.id);
    }
  }

  removeSelectedColumn(colId: string): void {
    const pos = this.selectedColumns.indexOf(colId);
    if (pos !== -1) {
      this.selectedColumns.splice(pos, 1);
    }
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      this.selectedColumns,
      event.previousIndex,
      event.currentIndex
    );
  }

  save(): void {
    localStorage.setCrmItem(
      this.KEY_NAME,
      JSON.stringify(this.selectedColumns)
    );
    this.dialogRef.close({
      selectedColumns: this.selectedColumns
    });
    return;
  }
}
