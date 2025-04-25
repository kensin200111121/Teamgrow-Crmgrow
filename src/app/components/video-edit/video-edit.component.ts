import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { MaterialService } from '@services/material.service';
import { HelperService } from '@services/helper.service';
import { Material } from '@models/material.model';
import { UserService } from '@services/user.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MaterialChangeComponent } from '@components/material-change/material-change.component';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';

@Component({
  selector: 'app-video-edit',
  templateUrl: './video-edit.component.html',
  styleUrls: ['./video-edit.component.scss']
})
export class VideoEditComponent implements OnInit, OnDestroy {
  video: Material = new Material();
  originalVideo: Material = new Material();

  enableSourceUpdate = true;
  isSourceUpdate = false;

  submitted = false;
  thumbnailLoading = false;

  saving = false;
  saveSubscription: Subscription;

  loading = false;
  loadSubscription: Subscription;

  @ViewChild('emailEditor') emailEditor: HtmlEditorComponent;

  constructor(
    private dialogRef: MatDialogRef<VideoEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private materialService: MaterialService,
    private helperService: HelperService
  ) {}

  ngOnInit(): void {
    if (this.data?.material) {
      this.video = { ...this.data.material };
      this.originalVideo = new Material().deserialize({
        ...this.data.material
      });
    } else if (this.data?.id) {
      this.load(this.data.id);
    }
  }

  ngOnDestroy(): void {}

  load(id: string): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.materialService
      .getVideoById(id)
      .subscribe((res) => {
        this.loading = false;
        this.video = new Material().deserialize(res);
        this.originalVideo = new Material().deserialize(res);
        if (this.video.description) {
          this.emailEditor.setValue(this.video.description);
        }
      });
  }

  update(): void {
    this.saving = true;
    const video = {};
    const keys = ['title', 'thumbnail', 'description', 'site_image'];
    keys.forEach((e) => {
      if (this.video[e] != this.originalVideo[e]) {
        video[e] = this.video[e];
      }
    });
    this.materialService
      .updateVideo(this.video['_id'], video)
      .subscribe((res) => {
        this.saving = false;
        if (res && res['status']) {
          // this.toast.success('Video material successfully edited.');
          // this.materialService.update$(this.video['_id'], this.video);
          this.dialogRef.close(res);
        }
      });
  }

  duplicate(): void {
    const newVideo = { ...this.video };
    newVideo['shared_video'] = this.video._id;
    delete newVideo['_id'];
    this.saving = true;
    this.materialService.createVideo(newVideo).subscribe((res) => {
      this.saving = false;
      if (res['data']) {
        // this.toast.success('Video material successfully duplicated.');
        const newMaterial = new Material().deserialize(res['data']);
        newMaterial.material_type = 'video';
        this.materialService.create$(newMaterial);
        this.materialService.update$(this.video._id, {
          has_shared: true,
          shared_video: newMaterial._id
        });
        if (newMaterial.folder) {
          // Folder Update
          this.materialService.updateFolder$(
            newMaterial.folder,
            'videos',
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
            this.helperService
              .generateImageThumbnail(imageFile, 'video_play')
              .then((image) => {
                this.thumbnailLoading = false;
                this.video['thumbnail'] = thumbnail;
                this.video['site_image'] = image;
              })
              .catch((err) => {
                this.thumbnailLoading = false;
                this.video['thumbnail'] = thumbnail;
              });
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
    this.video = new Material().deserialize({ ...this.video, ...evt });
    this.originalVideo = new Material().deserialize({ ...this.video, ...evt });
    this.isSourceUpdate = false;
    this.materialService.update$(this.video['_id'], this.video);
  }

  closeSource(): void {
    this.isSourceUpdate = false;
  }
}
