import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Garbage } from '@models/garbage.model';
import { THEMES } from '@constants/variable.constants';
import { MaterialService } from '@services/material.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-material-edit-template',
  templateUrl: './material-edit-template.component.html',
  styleUrls: ['./material-edit-template.component.scss']
})
export class MaterialEditTemplateComponent implements OnInit {
  garbage: Garbage = new Garbage();
  theme_setting = {};
  materials = [];
  selectedTheme = {
    name: '',
    thumbnail: '',
    id: ''
  };
  saving = false;
  themes = THEMES;
  garbageSubscription: Subscription;
  updateSubscription: Subscription;
  themesListSubscription: Subscription;

  isGlobal = false;
  view_mode = '';
  isPDF = false;
  submitted = false;
  siteUrl = environment.server;

  constructor(
    private dialogRef: MatDialogRef<MaterialEditTemplateComponent>,
    private userService: UserService,
    private materialService: MaterialService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.isGlobal) {
      this.isGlobal = true;
    } else {
      if (this.data.materials) {
        this.materials = this.data.materials;
      }
    }
    this.themesListSubscription && this.themesListSubscription.unsubscribe();
    this.themesListSubscription = this.userService.themes$.subscribe(
      (themes) => {
        this.themes = themes;
        this.selectedTheme = this.themes[0];
      }
    );

    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        let theme;
        const profile = this.userService.profile.getValue();
        this.garbage = new Garbage().deserialize(garbage);
        if (this.isGlobal) {
          let defaultTheme = 'theme2';
          if (profile.company.toLowerCase() !== 'exp realty') {
            defaultTheme = 'theme7';
          }
          theme = garbage.material_theme || defaultTheme;
          this.selectedTheme = this.themes.filter((e) => e.id == theme)[0];
        } else {
          if (this.materials.length > 1) {
            theme = garbage.material_theme;
            this.selectedTheme = this.themes.filter((e) => e.id == theme)[0];
          } else {
            theme = this.materials[0].material_theme;
            this.selectedTheme = this.themes.filter((e) => e.id == theme)[0];
          }
          this.theme_setting = garbage.material_themes || {};
          if (this.materials[0].material_type === 'pdf') {
            this.isPDF = true;
            this.view_mode = this.materials[0].view_mode;
          }
        }
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.themesListSubscription && this.themesListSubscription.unsubscribe();
  }

  setMaterialTheme(theme: any): void {
    this.selectedTheme = theme;
  }

  save(): void {
    if (!this.selectedTheme || !this.selectedTheme.id) {
      return;
    }
    this.saving = true;
    if (this.isGlobal) {
      this.updateSubscription = this.userService
        .updateGarbage({ material_theme: this.selectedTheme.id })
        .subscribe((status) => {
          this.saving = false;
          if (status) {
            this.userService.updateGarbageImpl({
              material_theme: this.selectedTheme.id
            });
            this.dialogRef.close(this.selectedTheme.name);
          }
        });
    } else {
      this.updateSubscription = this.materialService
        .updateMaterialsTheme(
          this.materials,
          this.selectedTheme.id,
          this.view_mode
        )
        .subscribe((res) => {
          this.saving = false;
          if (res['status']) {
            const result = {
              theme_id: this.selectedTheme.id,
              view_mode: this.view_mode
            };
            this.dialogRef.close(result);
          }
        });
    }
  }

  previewTheme(theme): void {
    if (theme && this.materials?.length > 0) {
      const material = this.materials[0];
      window.open(
        `${this.siteUrl}/${material.item_type}/${material._id}?preview=${theme.id}`,
        '_blank'
      );
    }
  }
}
