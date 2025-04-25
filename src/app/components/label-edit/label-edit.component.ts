import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Label } from '@models/label.model';
import { LABEL_COLORS } from '@constants/variable.constants';
import { LabelEditColorComponent } from '@components/label-edit-color/label-edit-color.component';
import { Subscription } from 'rxjs';
import { LabelService } from '@services/label.service';
import { LabelItem } from '@utils/data.types';

@Component({
  selector: 'app-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss']
})
export class LabelEditComponent implements OnInit {
  LABEL_COLORS = LABEL_COLORS;
  label: Label = new Label();
  labels: LabelItem[] = [];

  existingName = false;
  saving = false;
  saveSubscription: Subscription;

  constructor(
    private labelService: LabelService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<LabelEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Label
  ) {
    this.labelService.labelItems$.subscribe((res) => {
      this.labels = res;
    });
    this.label = new Label().deserialize(this.data);
  }

  ngOnInit(): void {}

  addColor(): void {
    this.dialog
      .open(LabelEditColorComponent, {
        position: { top: '400px' },
        width: '100vw',
        maxWidth: '400px',
        maxHeight: '400px'
      })
      .afterClosed()
      .subscribe((color) => {
        if (color) {
          this.label.color = color;
        }
      });
  }

  selectColor(color: string): void {
    this.label.color = color;
    this.label.mine = true;
  }

  onChangeLabelName(): void {
    const label = this.labels.find(
      (e) => e.label.name.toLocaleLowerCase() === this.label.name.toLocaleLowerCase() && e.label._id !== this.label._id
    );
    if (label) {
      this.existingName = true;
    } else {
      this.existingName = false;
    }
  }

  editLabel(): void {
    if (this.existingName) return;
    this.label.mine = true;
    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.labelService
      .updateLabel(this.label._id, {
        ...this.label,
        _id: undefined
      })
      .subscribe((status) => {
        this.saving = false;
        if (status) {
          this.labelService.update$(this.label);
          this.dialogRef.close();
        }
      });
  }
}
