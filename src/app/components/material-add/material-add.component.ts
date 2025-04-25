import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { TabItem } from '@utils/data.types';
import { MaterialService } from '@services/material.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StoreService } from '@services/store.service';
import { STATUS } from '@constants/variable.constants';

@Component({
  selector: 'app-material-add',
  templateUrl: './material-add.component.html',
  styleUrls: ['./material-add.component.scss']
})
export class MaterialAddComponent implements OnInit {
  STATUS = STATUS;
  tabs: TabItem[] = [
    { icon: 'i-icon i-video', label: 'VIDEO', id: 'videos' },
    { icon: 'i-icon i-pdf', label: 'PDF', id: 'pdfs' },
    { icon: 'i-icon i-image', label: 'IMAGE', id: 'images' }
  ];
  selectedTab: TabItem = this.tabs[0];

  videos = [];
  pdfs = [];
  images = [];
  selectedMaterials = [];
  selectedMaterialIds = [];
  hideMaterials = [];
  mode = '';

  constructor(
    private dialogRef: MatDialogRef<MaterialAddComponent>,
    private materialService: MaterialService,
    public storeService: StoreService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.type) {
      this.mode = this.data.type;
    }
    if (this.data && this.data.hideMaterials) {
      this.data.hideMaterials.forEach((e) => {
        this.hideMaterials.push(e._id);
      });
    }
    if (this.data && this.data.materials) {
      this.selectedMaterials = this.data.materials;
    }
    this.materialService.loadVideos();
    this.materialService.loadPdfs();
    this.materialService.loadImages();

    for (let i = 0; i < this.selectedMaterials.length; i++) {
      const material = this.selectedMaterials[i];
      this.selectedMaterialIds.push(material._id);
    }
  }

  ngOnDestroy(): void {}

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  /**
   * Toggle Material
   * @param material : Material (Video | PDF | Image)
   */
  toggleMaterial(material: any): void {
    const index = this.selectedMaterials.findIndex(
      (item) => item._id === material._id
    );
    if (index !== -1) {
      this.selectedMaterials.splice(index, 1);
      this.selectedMaterialIds.splice(index, 1);
    } else {
      if (this.mode == 'filter') {
        this.selectedMaterials = [];
        this.selectedMaterialIds = [];
        this.selectedMaterials.push(material);
        this.selectedMaterialIds.push(material._id);
      } else {
        this.selectedMaterials.push(material);
        this.selectedMaterialIds.push(material._id);
      }
    }
  }

  /**
   * Deselect the Material
   * @param material : Material Object
   */
  deselectMaterial(material: any): void {
    const index = this.selectedMaterials.findIndex(
      (item) => item._id === material._id
    );
    if (index >= 0) {
      this.selectedMaterials.splice(index, 1);
      this.selectedMaterialIds.splice(index, 1);
    }
  }

  getMaterialType(material: any): string {
    if (material.type) {
      if (material.type === 'application/pdf') {
        return 'PDF';
      } else if (material.type.includes('image')) {
        return 'Image';
      }
    }
    return 'Video';
  }

  attachMaterial(): void {
    if (!this.selectedMaterials.length) {
      return;
    }
    if (this.mode == 'filter') {
      this.dialogRef.close(this.selectedMaterials);
    } else {
      this.dialogRef.close({ materials: this.selectedMaterials });
    }
  }
}
