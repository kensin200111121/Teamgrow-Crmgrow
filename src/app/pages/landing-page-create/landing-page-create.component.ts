import { Component, OnInit } from '@angular/core';
import { MaterialBrowserV2Component } from '@app/components/material-browser-v2/material-browser-v2.component';
import { SspaService } from '@app/services/sspa.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectLeadFormComponent } from '@app/components/select-lead-form/select-lead-form.component';
import { MaterialItem } from '@app/core/interfaces/resources.interface';
import { DialogSettings } from '@constants/variable.constants';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { LandingPageService } from '@app/services/landing-page.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AssetsManagerComponent } from '@app/components/assets-manager/assets-manager.component';
import { MaterialService } from '@app/services/material.service';
import { environment } from '@environments/environment';
import * as _ from 'lodash';
import { Location } from '@angular/common';

@Component({
  selector: 'app-landing-page-create',
  templateUrl: './landing-page-create.component.html',
  styleUrls: ['./landing-page-create.component.scss']
})
export class LandingPageCreateComponent implements OnInit {
  MaterialBaseDomain = environment.website;

  pageId = null;
  isPublished = false;
  title = '';
  description = '';
  theme = 1;
  material: MaterialItem;
  headline = '';
  content = '';
  backgroundColor = null;
  formType = 0;
  addedForms = [];
  displayedColumns: string[] = [
    'key',
    'second',
    'automation',
    'tags',
    'action'
  ];
  submitting = false;
  submitted = false;
  isLoading = false;
  routeSubscription: Subscription;
  loadSubscription: Subscription;
  highlights = [];
  highlightsV2: Array<{
    type: 'video' | 'pdf' | 'image';
    material: MaterialItem;
  }> = [];
  pdfViewMode = 'scroll';
  materialType = '';
  draftId = null;

  constructor(
    public sspaService: SspaService,
    private dialog: MatDialog,
    private materialService: MaterialService,
    private landingPageService: LandingPageService,
    private toast: ToastrService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      if (params['id']) {
        this.pageId = params['id'];
        this.loadLandingPage();
      }
    });
    this.route.queryParams.subscribe((params) => {
      if (params['material'] && params['type']) {
        const materialId = params['material'];
        const materialType = params['type'];

        this.materialService
          .getMaterialById(materialId, materialType)
          .subscribe((res) => {
            this.material = new MaterialItem(res);
            this.materialType = materialType;
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
  }

  loadLandingPage(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.isLoading = true;
    this.loadSubscription = this.landingPageService
      .getById(this.pageId)
      .subscribe((res) => {
        this.isLoading = false;
        if (res?.status) {
          this.isPublished = res.data.is_published;
          this.title = res.data.name || '';
          this.description = res.data.description || '';
          this.theme = Number(res.data.theme) || 1;
          this.material = res.data?.material;
          this.materialType = res.data?.material_type;
          this.headline = res.data.headline || '';
          this.content = res.data.content || '';
          this.backgroundColor = res.data.background_color || null;
          this.formType = res.data.form_type || 0;
          if (res.data.forms && res.data.forms.length > 0) {
            this.addedForms = res.data.forms.map((e) => {
              const form_settings = res.data.form_settings;
              const key = e._id;
              let value = 0;
              for (let i = 0; i < form_settings.length; i++) {
                if (form_settings[i][key]) {
                  value = form_settings[i][key];
                  break;
                }
              }
              return {
                leadForm: e,
                second: value
              };
            });
          }
          this.highlights = res.data.highlights || [];
          this.highlightsV2 = res.data?.highlightsV2 ?? [];
          this.pdfViewMode = res.data.pdf_mode;
        } else {
          this.toast.error('Can not load landing page information.');
        }
      });
  }

  onFormTypeChange(event: any): void {
    if (event === 0) {
      this.formType = 0;
    } else {
      if (this.formType === 1 && this.addedForms.length > 1) {
        this.dialog
          .open(ConfirmComponent, {
            ...DialogSettings.ALERT,
            data: {
              title: 'Clear Forms Selection?',
              message:
                'Embed forms only support one form, would you like to clear forms selection?',
              confirmLabel: 'Yes, Clear',
              mode: 'warning'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res.status) {
              this.addedForms = [];
            }
          });
      }
    }
  }

  setTheme(theme: number): void {
    this.theme = theme;
  }

  setPdfViewMode(mode: string): void {
    this.pdfViewMode = mode;
  }

  selectMaterial(): void {
    this.dialog
      .open(MaterialBrowserV2Component, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          title: 'Select Material',
          buttonLabel: 'Insert',
          multiple: false,
          onlyMine: true,
          hideMaterials: [],
          resultMatType: 'with-folder'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res?.materials.length) {
          this.material = res.materials[0];
          this.materialType = res.materials[0].material_type;
          if (this.materialType !== 'video') {
            this.formType = 1;
            if (this.addedForms.length > 1) {
              this.dialog
                .open(ConfirmComponent, {
                  ...DialogSettings.ALERT,
                  data: {
                    title: 'Change the Form Selection',
                    message:
                      "If you use a pdf or a image, landing page doesn't support the Popup Form. It will change to Embed Form option and clear your form selections. Are you sure?",
                    confirmLabel: 'Yes, Clear',
                    mode: 'warning'
                  }
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res.status) {
                    this.addedForms = [];
                  }
                });
            }
          }
        }
      });
  }

  addForm(): void {
    this.dialog
      .open(SelectLeadFormComponent, {
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          mode: 'add',
          selectedForms: this.addedForms.map((e) => e.leadForm._id),
          formType: this.formType,
          material: this.material
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.leadForm) {
          this.addedForms = [...this.addedForms, res];
        }
      });
  }

  deleteForm(index: number): void {
    this.addedForms.splice(index, 1);
    this.addedForms = [...this.addedForms];
  }

  setForm(index: number): void {
    this.dialog
      .open(SelectLeadFormComponent, {
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          mode: 'change',
          formType: this.formType,
          material: this.material,
          formId: this.addedForms[index].leadForm._id,
          seconds: this.addedForms[index].second
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.leadForm) {
          this.addedForms[index] = res;
          this.addedForms = [...this.addedForms];
        }
      });
  }

  save(): void {
    const data = this.generatePageData(false);
    this.submitting = true;
    if (this.pageId) {
      this.landingPageService.update(this.pageId, data).subscribe((res) => {
        this.submitted = false;
        if (res['status']) {
          this.submitting = false;
          this.toast.success('Saved landing page information.');
        } else {
          this.toast.error(res['error']);
        }
      });
    } else {
      this.landingPageService.create(data).subscribe((res) => {
        this.submitted = false;
        if (res['status']) {
          this.pageId = res.data._id;
          this.pdfViewMode = res.data.pdf_mode;
          this.submitting = false;
          this.router.navigate([
            '/lead-hub/landing-pages',
            { publish: this.isPublished }
          ]);
          this.toast.success('Created new landing page.');
        } else {
          this.toast.error(res['error']);
        }
      });
    }
  }

  public changeColor(event) {
    // this.backgroundColor = event;
  }

  highlightMoved(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.highlightsV2, event.previousIndex, event.currentIndex);
  }

  removeHighlight(highlight: number): void {
    this.highlightsV2.splice(highlight, 1);
  }

  pickHighlights(): void {
    this.dialog
      .open(MaterialBrowserV2Component, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          title: 'Select Material',
          buttonLabel: 'Insert',
          multiple: true,
          onlyMine: true,
          hideMaterials: [],
          resultMatType: 'with-folder'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res?.materials.length) {
          const hightLight = res.materials.map((item) => ({
            type: item.material_type,
            material: item
          }));
          this.highlightsV2 = _.uniqBy(
            [...this.highlightsV2, ...hightLight],
            (item) => item.material._id
          );
        }
      });
  }

  openPreview() {
    const data = this.generatePageData(true);
    this.landingPageService.preview(data).subscribe((res) => {
      if (res['status']) {
        this.draftId = res.data._id;
        const url = this.router.serializeUrl(
          this.router.createUrlTree(['/page/preview/' + this.draftId])
        );
        window.open(this.MaterialBaseDomain + url, '_blank');
      } else {
        this.toast.error(res['error']);
      }
    });
  }

  generatePageData(is_draft: boolean): any {
    const forms = [];
    const form_settings = [];
    if (this.formType === 0) {
      this.addedForms = [];
    }
    this.addedForms.forEach((e) => {
      if (e.leadForm?._id) {
        forms.push(e.leadForm._id);
        const form_setting = {
          [e.leadForm._id]: e.second
        };
        form_settings.push(form_setting);
      }
    });
    let data: any = {
      is_published: this.isPublished,
      name: this.title,
      description: this.description,
      theme: this.theme,
      headline: this.headline,
      content: this.content,
      background_color: this.backgroundColor,
      form_type: this.formType,
      form_settings,
      forms,
      highlights: this.highlights,
      pdf_mode: this.pdfViewMode,
      ...(is_draft
        ? { is_draft, draft_id: this.draftId, original_id: this.pageId }
        : {})
    };
    if (this.material?._id) {
      data = {
        ...data,
        material: this.material?._id,
        material_type: this.material?.material_type || this.materialType
      };
    }
    if (this.highlightsV2.length) {
      data = {
        ...data,
        highlightsV2: (this.highlightsV2 || []).map((item) => ({
          type: item.type,
          material: item.material._id
        }))
      };
    }
    return data;
  }
}
