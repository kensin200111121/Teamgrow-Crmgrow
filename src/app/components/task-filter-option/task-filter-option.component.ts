import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TaskSearchOption } from '@models/searchOption.model';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-task-filter-option',
  templateUrl: './task-filter-option.component.html',
  styleUrls: ['./task-filter-option.component.scss']
})
export class TaskFilterOptionComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<TaskFilterOptionComponent>,
    private taskService: TaskService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  ngOnInit(): void {}
  closeDialog(): void {
    this.dialogRef.close();
  }

  applyFilter($event): void {
    const currentOption = this.taskService.searchOption.getValue();
    this.taskService.searchOption.next(
      new TaskSearchOption().deserialize({
        ...currentOption,
        ...$event
      })
    );
    this.dialogRef.close({
      state: 'filtering'
    });
  }
}
