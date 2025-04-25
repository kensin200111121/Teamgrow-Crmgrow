import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-contact-delete',
  templateUrl: './contact-delete.component.html',
  styleUrls: ['./contact-delete.component.scss']
})
export class ContactDeleteComponent implements OnInit {
  deletePercent = 0;
  deletedCount = 0;
  allCount = 0;
  constructor(public dialogRef: MatDialogRef<ContactDeleteComponent>) {}

  ngOnInit(): void {}
}
