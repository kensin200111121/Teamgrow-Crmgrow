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
  LandingPage,
  LandingPageDetail,
  MaterialItem
} from '@core/interfaces/resources.interface';
import { ResourceBrowserBase } from '@components/resource-browser-base/resource-browser-base.component';
import { TabItem } from '@app/utils/data.types';

const originTabs: TabItem[] = [
  { icon: '', label: 'Materials', id: 'material' },
  { icon: '', label: 'Landing Pages', id: 'landing_page' }
];

@Component({
  selector: 'app-material-browser-v2',
  templateUrl: './material-browser-v2.component.html',
  styleUrls: ['./material-browser-v2.component.scss']
})
export class MaterialBrowserV2Component
  extends ResourceBrowserBase<MaterialItem, MaterialListService, MaterialType>
  implements OnInit, OnDestroy
{
  readonly DISPLAY_COLUMNS = [];
  LIST_TYPE: ListType = ListType.OWN;
  selectedTypes: any[] = [];
  SORT_TYPES: FilterTypeItem<MaterialType>[] = [
    { id: MaterialType.FOLDER, label: 'Folder' },
    { id: MaterialType.VIDEO, label: 'Video' },
    { id: MaterialType.PDF, label: 'Pdf' },
    { id: MaterialType.IMAGE, label: 'Image' }
  ];
  sortType = this.SORT_TYPES[0];
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.MATERIAL;
  selectionLandingPages: any[] = [];

  material_type = '';
  multiple = true;

  previewMaterialId = null;

  enableSelectLandingPage = false;
  tabs: TabItem[] = originTabs;
  tab: TabItem = this.tabs[0];
  hideLandingPageItems: string[] = [];

  constructor(
    protected service: MaterialListService,
    public materialService: MaterialService,
    public storeService: StoreService,
    protected dialogRef: MatDialogRef<MaterialBrowserV2Component>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    super();
    if (this.data) {
      this.multiple = this.data.multiple;
      this.enableSelectLandingPage = !!this.data?.enableSelectLandingPage;

      if (this.data.material_type) {
        this.material_type = this.data.material_type;
      }

      if (this.data.hideMaterials && this.data.hideMaterials.length > 0) {
        this.hideItems = this.data.hideMaterials;
      }

      if (this?.data?.hideLandingPageItems?.length > 0) {
        this.hideLandingPageItems = this.data.hideLandingPageItems;
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

  selectPreview(element: Material): void {
    if (this.previewMaterialId === element._id) {
      this.previewMaterialId = null;
    } else {
      this.previewMaterialId = element._id;
    }
  }

  changeTab(tab: TabItem): void {
    this.tab = tab;
    this.selectionLandingPages = [];
    this.selection = [];
  }

  onChangeLandingPageSelect(event: LandingPageDetail[]) {
    this.selectionLandingPages = event;
  }

  selectData() {
    if (this.enableSelectLandingPage && this.tab.id === 'landing_page') {
      this.dialogRef.close({ landingPages: this.selectionLandingPages });
    } else {
      this.select();
    }
  }

  isSelectedMaterial(element: any): boolean {
    return this.selection.includes(element._id);
  }

  isSelected(type: any): boolean {
    return this.selectedTypes.includes(type);
  }

  onToggleType(type: any): void {
    if (this.isSelected(type)) {
      this.selectedTypes = this.selectedTypes.filter((t) => t !== type);
    } else {
      this.selectedTypes.push(type);
    }
    this.filters();
  }

  clearFilters(): void {
    this.selectedTypes = [];
    this.filters();
  }

  filters(): void {
    this.filteredItems = [];
    if (this.selectedTypes.length === 0) {
      this.filteredItems = this.items;
    } else {
      for (const selectedType of this.selectedTypes) {
        this.filteredItems = [
          ...this.filteredItems,
          ...this.items.filter((e) => e.item_type === selectedType.id)
        ];
      }
    }
    this.sort();
    this.page = 1;
  }
}
