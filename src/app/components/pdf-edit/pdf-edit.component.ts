import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { MaterialService } from '@services/material.service';
import { HelperService } from '@services/helper.service';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { Material } from '@models/material.model';
import { MatDialog } from '@angular/material/dialog';
import { MaterialChangeComponent } from '@components/material-change/material-change.component';
import { SspaService } from '@app/services/sspa.service';

@Component({
  selector: 'app-pdf-edit',
  templateUrl: './pdf-edit.component.html',
  styleUrls: ['./pdf-edit.component.scss']
})
export class PdfEditComponent implements OnInit, OnDestroy {
  submitted = false;
  pdf: Material = new Material();
  saving = false;
  thumbnailLoading = false;

  editedPdfs = [];
  garbageSubscription: Subscription;

  enableSourceUpdate = true;
  isSourceUpdate = false;

  constructor(
    private dialogRef: MatDialogRef<PdfEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private materialService: MaterialService,
    private userService: UserService,
    private helperService: HelperService,
    private dialog: MatDialog,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.pdf = { ...this.data.material };
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.editedPdfs = _garbage.edited_pdf || [];
      }
    );
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  update(): void {
    this.saving = true;
    const pdf = {};
    const keys = ['title', 'preview', 'description', 'view_mode'];
    keys.forEach((e) => {
      if (this.pdf[e] != this.data.material[e]) {
        pdf[e] = this.pdf[e];
      }
    });
    if (this.pdf['role'] === 'admin') {
      this.materialService
        .updateAdminPdf(this.pdf['_id'], pdf)
        .subscribe((res) => {
          this.saving = false;
          if (res && res['status']) {
            const newMaterial = new Material().deserialize(res['data']);
            newMaterial.material_type = 'pdf';
            this.materialService.create$(newMaterial);
            this.editedPdfs.push(this.pdf._id);
            this.userService.updateGarbageImpl({
              edited_pdf: this.editedPdfs
            });
            this.materialService.delete$([this.pdf._id]);
            // this.toast.success('Pdf material successfully duplicated.');
            this.dialogRef.close(res);
          }
        });
    } else {
      this.materialService.updatePdf(this.pdf['_id'], pdf).subscribe((res) => {
        this.saving = false;
        if (res && res['status']) {
          // this.toast.success('Pdf material successfully edited.');
          this.materialService.update$(this.pdf['_id'], this.pdf);
          this.dialogRef.close(true);
        }
      });
    }
  }

  duplicate(): void {
    this.saving = true;
    if (this.pdf.role == 'admin') {
      const pdf: Material = new Material();
      pdf.title = this.pdf.title;
      pdf.description = this.pdf.description;
      pdf.url = this.pdf.url;
      pdf.type = this.pdf.type;
      pdf.folder = this.pdf.folder;
      pdf.company = this.pdf.company;
      pdf.preview = this.pdf.preview;
      // custom thumbnail
      pdf.material_theme = this.pdf.material_theme;
      // uploaded & recording
      pdf.default_edited = true;
      pdf.default_video = this.pdf._id;
      this.materialService.createPdf(pdf).subscribe((res) => {
        this.saving = false;
        if (res && res['status']) {
          const newMaterial = new Material().deserialize(res['data']);
          newMaterial.material_type = 'pdf';
          this.materialService.create$(newMaterial);
          if (newMaterial.folder) {
            // Folder Update
            this.materialService.updateFolder$(
              newMaterial.folder,
              'pdfs',
              newMaterial._id
            );
          } else {
            if (pdf.folder) {
              // Go to Admin
            }
          }
          // this.toast.success('Pdf material successfully duplicated.');
          this.dialogRef.close(true);
        }
      });
    } else {
      const pdf = {
        url: this.pdf.url,
        title: this.pdf.title,
        preview: this.pdf.preview,
        description: this.pdf.description,
        shared_pdf: this.pdf._id,
        folder: this.pdf.folder
      };
      this.saving = true;
      this.materialService.createPdf(pdf).subscribe((res) => {
        this.saving = false;
        if (res['data']) {
          // this.toast.success('Pdf material successfully duplicated.');
          const newMaterial = new Material().deserialize(res['data']);
          newMaterial.material_type = 'pdf';
          this.materialService.create$(newMaterial);
          this.materialService.update$(this.pdf._id, {
            has_shared: true,
            shared_pdf: newMaterial._id
          });
          if (newMaterial.folder) {
            // Folder Update
            this.materialService.updateFolder$(
              newMaterial.folder,
              'pdfs',
              newMaterial._id
            );
          }
          this.dialogRef.close(true);
        }
      });
    }
  }

  openPreviewDialog(): void {
    this.helperService
      .promptForImage()
      .then((imageFile) => {
        this.thumbnailLoading = true;
        this.helperService
          .generateImageThumbnail(imageFile)
          .then((thumbnail) => {
            this.thumbnailLoading = false;
            this.pdf['preview'] = thumbnail;
          })
          .catch(() => {
            this.thumbnailLoading = false;
            this.toast.error("Can't Load this image");
          });
      })
      .catch(() => {
        this.toast.error("Can't read this image");
      });
  }

  changeMaterial(): void {
    this.isSourceUpdate = true;
  }

  updateSource(evt): void {
    this.pdf = new Material().deserialize({ ...this.pdf, ...evt });
    this.isSourceUpdate = false;
    console.log('this.pdf', this.pdf);
  }

  closeSource(): void {
    this.isSourceUpdate = false;
  }
}
