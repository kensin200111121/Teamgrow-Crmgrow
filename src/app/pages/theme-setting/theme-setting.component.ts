import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { MaterialEditTemplateComponent } from '@components/material-edit-template/material-edit-template.component';
import { AssetsManagerComponent } from '@components/assets-manager/assets-manager.component';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import {
  OTHER_THEMES,
  THEMES,
  THEME_DATA
} from '@constants/variable.constants';

@Component({
  selector: 'app-theme-setting',
  templateUrl: './theme-setting.component.html',
  styleUrls: ['./theme-setting.component.scss']
})
export class ThemeSettingComponent implements OnInit, OnDestroy {
  garbage: Garbage = new Garbage();
  selectedTheme;
  isExpUser = false;

  garbageSubscription: Subscription;
  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private toast: ToastrService
  ) {
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      if (res && res._id) {
        this.garbage = new Garbage().deserialize(res);
        const profile = this.userService.profile.getValue();
        const company = profile.company;
        const themes = THEME_DATA[company] || OTHER_THEMES;
        const theme = this.garbage.material_theme;
        this.selectedTheme = themes.filter((e) => e.id == theme)[0];

        if (profile.company.toLowerCase() === 'exp realty') {
          this.isExpUser = true;
        } else {
          this.isExpUser = false;
        }
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  editDefaultTheme(): void {
    this.dialog.open(MaterialEditTemplateComponent, {
      position: { top: '10vh' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: true,
      data: {
        isGlobal: true
      }
    });
  }

  highlightMoved(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      this.garbage.highlights,
      event.previousIndex,
      event.currentIndex
    );
    this.userService
      .updateGarbage({ highlights: this.garbage.highlights })
      .subscribe(() => {
        this.userService.updateGarbageImpl({
          highlights: this.garbage.highlights
        });
      });
  }
  removeHighlight(highlight: number): void {
    this.garbage.highlights.splice(highlight, 1);
    this.userService
      .updateGarbage({ highlights: this.garbage.highlights })
      .subscribe(() => {
        this.userService.updateGarbageImpl({
          highlights: this.garbage.highlights
        });
      });
  }
  pickHighlights(): void {
    this.dialog
      .open(AssetsManagerComponent, {
        width: '100vw',
        maxWidth: '720px',
        height: 'calc(100vh - 80px)'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const data = [];
          res['data'].forEach((e) => {
            data.push(e.url);
          });
          const highlights = [...this.garbage.highlights, ...data];
          this.userService.updateGarbage({ highlights }).subscribe(() => {
            this.userService.updateGarbageImpl({ highlights });
          });
        }
      });
  }

  brandMoved(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      this.garbage.brands,
      event.previousIndex,
      event.currentIndex
    );
    this.userService
      .updateGarbage({ brands: this.garbage.brands })
      .subscribe(() => {
        this.userService.updateGarbageImpl({ brands: this.garbage.brands });
      });
  }
  removeBrand(brand: number): void {
    this.garbage.brands.splice(brand, 1);
    this.userService
      .updateProfile({ brands: this.garbage.brands })
      .subscribe(() => {
        this.userService.updateGarbageImpl({ brands: this.garbage.brands });
      });
  }
  pickBrands(): void {
    this.dialog
      .open(AssetsManagerComponent, {
        width: '100vw',
        maxWidth: '720px',
        height: 'calc(100vh - 80px)'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const data = [];
          res['data'].forEach((e) => {
            data.push(e.url);
          });
          const brands = [...this.garbage.brands, ...data];
          this.userService.updateGarbage({ brands }).subscribe((res) => {
            this.userService.updateGarbageImpl({ brands });
          });
        }
      });
  }
}
