import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { MaterialService } from '@services/material.service';
import { HelperService } from '@services/helper.service';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { Material } from '@models/material.model';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-image-edit',
  templateUrl: './image-edit.component.html',
  styleUrls: ['./image-edit.component.scss']
})
export class ImageEditComponent implements OnInit {
  submitted = false;
  image: Material = new Material();
  saving = false;
  thumbnailLoading = false;

  editedImages = [];
  garbageSubscription: Subscription;

  enableSourceUpdate = true;
  isSourceUpdate = false;

  constructor(
    private dialogRef: MatDialogRef<ImageEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private materialService: MaterialService,
    private userService: UserService,
    private helperService: HelperService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.image = { ...this.data.material };
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.editedImages = _garbage.edited_image || [];
      }
    );
  }

  update(): void {
    const image = {};
    const keys = ['title', 'preview', 'description'];
    keys.forEach((e) => {
      if (this.image[e] != this.data.material[e]) {
        image[e] = this.image[e];
      }
    });
    this.saving = true;
    this.materialService
      .updateImage(this.image['_id'], image)
      .subscribe((res) => {
        this.saving = false;
        if (res && res['status']) {
          // this.toast.success('Image material successfully edited.');
          this.materialService.update$(this.image['_id'], this.image);
          this.dialogRef.close(res);
        }
      });
  }

  duplicate(): void {
    const image = {
      url: this.image.url,
      title: this.image.title,
      preview: this.image.preview,
      description: this.image.description,
      shared_image: this.image._id,
      folder: this.image.folder,
      material_theme: this.image.material_theme
    };
    this.saving = true;
    this.materialService.createImage(image).subscribe((res) => {
      if (res['data']) {
        this.saving = false;
        // this.toast.success('Image material successfully duplicated.');
        const newMaterial = new Material().deserialize(res['data']);
        newMaterial.material_type = 'image';
        this.materialService.create$(newMaterial);
        this.materialService.update$(this.image._id, {
          has_shared: true,
          shared_image: newMaterial._id
        });
        if (newMaterial.folder) {
          // Folder Update
          this.materialService.updateFolder$(
            newMaterial.folder,
            'images',
            newMaterial._id
          );
        }
        this.dialogRef.close(true);
      }
    });
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
            this.image['preview'] = thumbnail;
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
    // this.dialog
    //   .open(MaterialChangeComponent, {
    //     width: '100vw',
    //     maxWidth: '400px',
    //     disableClose: true,
    //     data: {
    //       material: this.image
    //     }
    //   })
    //   .afterClosed()
    //   .subscribe((res) => {
    //     if (res) {
    //       this.image = {
    //         ...this.image,
    //         ...res
    //       };
    //     }
    //   });
  }

  updateSource(evt): void {
    this.isSourceUpdate = false;
    this.image = new Material().deserialize({ ...this.image, ...evt });
  }

  closeSource(): void {
    this.isSourceUpdate = false;
  }
}
