import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { LabelService } from '@services/label.service';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { Label } from '@models/label.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LabelEditColorComponent } from '@components/label-edit-color/label-edit-color.component';
import { LabelEditComponent } from '@components/label-edit/label-edit.component';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manage-label',
  templateUrl: './manage-label.component.html',
  styleUrls: ['./manage-label.component.scss']
})
export class ManageLabelComponent implements OnInit {
  existingName = false;
  loading = false;
  newLabel: Label = new Label().deserialize({
    color: '#000',
    name: ''
  });
  labelLength = 0;
  @Output() onClose = new EventEmitter();
  @Output() showDialog = new EventEmitter();
  saveSubscription: Subscription;
  constructor(private dialog: MatDialog, public labelService: LabelService) {}

  ngOnInit(): void {
    this.labelService.labels$.subscribe((labels) => {
      this.labelLength = 0;
      labels.forEach((e) => {
        if (e.role !== 'admin') {
          this.labelLength++;
        }
      });
    });
  }

  editLabelColor(): void {
    this.showDialog.emit(true);
    this.dialog
      .open(LabelEditColorComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        maxHeight: '400px'
      })
      .afterClosed()
      .subscribe((res) => {
        this.showDialog.emit(false);
        if (res) {
          this.newLabel.color = res;
        }
      });
  }

  onChangeLabelName(): void {
    const labels = this.labelService.labels.getValue();
    const label = labels.find((e) => e.name === this.newLabel.name);
    if (label) {
      this.existingName = true;
    } else {
      this.existingName = false;
    }
  }

  saveLabel(form: NgForm): void {
    if (this.newLabel.name.replace(/\s/g, '').length == 0) {
      this.newLabel.name = '';
      return;
    }
    if (this.existingName) return;
    this.loading = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.labelService
      .createLabel(
        this.newLabel.deserialize({ priority: (this.labelLength + 1) * 1000 })
      )
      .subscribe((newLabel) => {
        this.loading = false;
        if (newLabel) {
          this.labelService.create$(newLabel);
          this.newLabel = new Label().deserialize({
            color: '#000',
            name: ''
          });
          form.resetForm();
        }
      });
  }

  editLabel(label: Label): void {
    this.showDialog.emit(true);
    this.dialog
      .open(LabelEditComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        maxHeight: '400px',
        disableClose: true,
        data: label
      })
      .afterClosed()
      .subscribe((res) => {
        this.showDialog.emit(false);
      });
  }

  removeLabel(label: Label): void {
    this.showDialog.emit(true);
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete status',
        message: 'Are you sure to delete the status?',
        cancelLabel: 'No',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });
    dialog.afterClosed().subscribe((res) => {
      this.showDialog.emit(false);
      if (res) {
        this.labelService.deleteLabel(label._id).subscribe((status) => {
          if (status) {
            this.labelService.delete$(label._id);
          }
        });
      }
    });
  }

  drop(event: CdkDragDrop<string[]>): void {
    this.labelService.changeOrder(event.previousIndex, event.currentIndex);
  }

  close(): void {
    this.onClose.emit();
  }
}
