import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Material } from '@models/material.model';
import { MaterialService } from '@services/material.service';
import { StoreService } from '@services/store.service';
import {
  ListType,
  MaterialType,
  ResourceCategory
} from '@core/enums/resources.enum';
import { MaterialListService } from '@services/material-list.service';
import {
  FilterTypeItem,
  MaterialItem
} from '@core/interfaces/resources.interface';
import { ResourceBrowserBase } from '@components/resource-browser-base/resource-browser-base.component';

@Component({
  selector: 'app-material-browser',
  templateUrl: './material-browser.component.html',
  styleUrls: ['./material-browser.component.scss']
})
export class MaterialBrowserComponent
  extends ResourceBrowserBase<MaterialItem, MaterialListService, MaterialType>
  implements OnInit, OnDestroy
{
  DISPLAY_COLUMNS = ['select', 'material_name', 'type'];
  LIST_TYPE: ListType = ListType.OWN;
  SORT_TYPES: FilterTypeItem<MaterialType>[] = [
    { id: MaterialType.ALL, label: 'All types' },
    { id: MaterialType.FOLDER, label: 'Folder' },
    { id: MaterialType.VIDEO, label: 'Video' },
    { id: MaterialType.PDF, label: 'Pdf' },
    { id: MaterialType.IMAGE, label: 'Image' }
  ];
  sortType = this.SORT_TYPES[0];
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.MATERIAL;

  material_type = '';
  multiple = true;
  resultMatType = 'material';

  constructor(
    protected service: MaterialListService,
    public materialService: MaterialService,
    public storeService: StoreService,
    protected dialogRef: MatDialogRef<MaterialBrowserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    super();
    if (this.data) {
      this.multiple = this.data.multiple;

      if (this.data.resultMatType) {
        this.resultMatType = this.data.resultMatType;
      }

      if (this.data.material_type) {
        this.material_type = this.data.material_type;
      }

      if (!this.multiple) {
        this.DISPLAY_COLUMNS.splice(0, 1);
      }

      if (this.data.hideMaterials && this.data.hideMaterials.length > 0) {
        this.hideItems = this.data.hideMaterials;
      }

      if (this.data.materials) {
        this.data.materials.forEach((e) => {
          this.selection.push(e._id);
        });
      }
    }
  }

  ngOnInit(): void {
    this.goToFolder('');
  }

  ngOnDestroy(): void {}

  selectMaterial(element: Material): void {
    if (this.multiple) {
      return;
    }
    this.selection = [element._id];
  }
}
