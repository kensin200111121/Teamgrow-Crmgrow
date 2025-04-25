import { Component, OnInit } from '@angular/core';
import { MaterialService } from '@services/material.service';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';
import { IMaterialItem } from '@core/interfaces/resources.interface';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ListType } from '@core/enums/resources.enum';
import { MaterialNavigateService } from '@app/services/material-navigate.service';

@Component({
  selector: 'app-materials-new',
  templateUrl: './materials-new.component.html',
  styleUrls: ['./materials-new.component.scss']
})
export class MaterialsNewComponent implements OnInit {
  user: User = new User();
  views = ['list_view', 'tile_view'];
  selectedView = this.views[1];
  selectedMaterial: IMaterialItem | null = null;
  profileSubscription: Subscription;
  previewSelectedMateriaSubscription: Subscription;

  captureForms = {};
  materialCaptures = {};
  captureEnabledMaterials = [];
  defaultCaptureForm = {};
  isOpenedNav = false;
  isMyList = true;
  isLibrary = false;
  LIST_TYPE: ListType = ListType.OWN;
  constructor(
    public materialService: MaterialService,
    private router: Router,
    public materialNavigateService: MaterialNavigateService
  ) {
    const viweMode = localStorage.getCrmItem('material_view_mode');
    if (viweMode) {
      this.selectedView = viweMode;
      this.materialService.viewMode.next(viweMode);
    } else {
      localStorage.setCrmItem('material_view_mode', this.views[1]);
    }
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url.indexOf('/library') !== -1) {
          this.LIST_TYPE = ListType.LIBRARY;
        } else {
          this.LIST_TYPE = ListType.OWN;
        }
      });
  }

  ngOnInit(): void {
    this.previewSelectedMateriaSubscription &&
      this.previewSelectedMateriaSubscription.unsubscribe();
    this.previewSelectedMateriaSubscription =
      this.materialService.previewSelectedMaterial$.subscribe((_material) => {
        this.selectedMaterial = _material;
      });
  }

  recordSetting(): void {
    this.materialService.newAction.next({ record: Date.now() });
  }

  createFolder(): void {
    this.materialService.newAction.next({ folder: Date.now() });
  }

  createMaterial(type: string): void {
    this.materialService.newAction.next({ [type]: Date.now() });
  }

  toggleView(index): void {
    this.selectedView = this.views[index];
    this.materialService.viewMode.next(this.selectedView);
    localStorage.setCrmItem('material_view_mode', this.selectedView);
  }

  changeSelectedMaterial(material: IMaterialItem): void {
    this.selectedMaterial = material;
  }

  unsetSelectedMaterial(): void {
    this.selectedMaterial = null;
  }

  closeNav(): void {
    this.isOpenedNav = false;
  }

  gotoRoot(page: string) {
    if (page === 'own') {
      this.isMyList = true;
      this.isLibrary = false;
    } else {
      this.isMyList = false;
      this.isLibrary = true;
    }
    this.unsetSelectedMaterial();
    this.materialNavigateService.activeFolder.next(null);
    this.router.navigate(['/materials/' + page + '/root']);
  }
}
