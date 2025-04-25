import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-auto-complete-task',
  templateUrl: './auto-complete-task.component.html',
  styleUrls: ['./auto-complete-task.component.scss']
})
export class AutoCompleteTaskComponent implements OnInit {
  saving: false;
  constructor(
    private dialogRef: MatDialogRef<AutoCompleteTaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    console.log("data", this.data);
    if(this.data && this.data.length){
      
    }
  }
  close() {
    this.dialogRef.close();
  }
}
