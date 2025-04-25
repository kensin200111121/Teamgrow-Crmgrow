import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { COLORS } from '@constants/variable.constants';

@Component({
  selector: 'app-label-edit-color',
  templateUrl: './label-edit-color.component.html',
  styleUrls: ['./label-edit-color.component.scss']
})
export class LabelEditColorComponent implements OnInit {
  color;
  saving = false;

  constructor(private dialogRef: MatDialogRef<LabelEditColorComponent>) {}

  ngOnInit(): void {}

  handleChange(evt: any): void {
    this.color = evt.color.hex;
  }

  changeColor(): void {
    this.saving = true;
    this.dialogRef.close(this.color);
  }

  COLORS = COLORS;
}
