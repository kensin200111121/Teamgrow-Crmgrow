import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Material } from '@models/material.model';
import { StoreService } from '@services/store.service';
import { Subscription } from 'rxjs';
import { MaterialService } from '@services/material.service';

@Component({
  selector: 'app-case-material-confirm',
  templateUrl: './case-material-confirm.component.html',
  styleUrls: ['./case-material-confirm.component.scss']
})
export class CaseMaterialConfirmComponent implements OnInit {
  DISPLAY_COLUMNS = ['select', 'material_name', 'type'];
  selection: any[] = [];
  multiple = false;
  selectedOption = 1;
  selectedMaterials = [];
  materials = [];
  filteredMaterials = [];
  loadSubscription: Subscription;
  submitted = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CaseMaterialConfirmComponent>,
    private storeService: StoreService,
    private materialService: MaterialService,
    public sspaService: SspaService
  ) {
    if (this.data && this.data.materials) {
      this.selectedMaterials = this.data.materials;
    }
    this.materialService.loadMaterial(true);
    this.loadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        if (materials) {
          this.materials = materials;
          if (materials.length > 0) {
            this.filteredMaterials = [];
            for (const material of this.selectedMaterials) {
              const index = this.materials.findIndex(
                (item) => item._id === material._id || item._id === material
              );
              if (index >= 0) {
                this.filteredMaterials.push(this.materials[index]);
              }
            }
          }
        }
      }
    );
    if (this.data && this.data.review !== undefined) {
      this.selectedOption = this.data.review;
    }
  }

  ngOnInit(): void {}

  selectOption(option): void {
    this.selectedOption = option;
  }

  confirm(): void {
    if (this.selectedOption === 2 && this.selection.length === 0) {
      this.submitted = true;
      return;
    }
    this.dialogRef.close({
      review: this.selectedOption,
      primary: this.selection[0]
    });
  }

  toggleElement(element: Material): void {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      this.selection.splice(pos, 1);
    } else {
      this.selection.push(element._id);
    }
  }

  isSelected(element: Material): boolean {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }

  selectMaterial(element: Material): void {
    if (this.multiple) {
      return;
    }
    if (element.material_type === 'folder') {
      return;
    }
    this.selection = [element._id];
  }
  close(){
    this.dialogRef.close();
  }
}
