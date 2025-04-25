import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MaterialService } from '@services/material.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TeamService } from '@services/team.service';
import { StoreService } from '@services/store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-material-share',
  templateUrl: './material-share.component.html',
  styleUrls: ['./material-share.component.scss']
})
export class MaterialShareComponent implements OnInit {
  share_type = '';
  teamId = '';
  sharing = false;
  loading = false;

  materials = [];
  loadingError = '';

  selectedMaterials = [];

  materialSelection = new SelectionModel<any>(true, []);
  loadSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<MaterialShareComponent>,
    private materialService: MaterialService,
    public storeService: StoreService,
    private teamService: TeamService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    this.share_type = this.data.type;
    this.teamId = this.data.team_id;

    if (this.share_type === 'video') {
      this.loadVideos();
    } else if (this.share_type === 'pdf') {
      this.loadPdfs();
    } else if (this.share_type === 'image') {
      this.loadImages();
    }
  }

  ngOnInit(): void {
    if (this.share_type === 'video') {
      this.materialService.loadVideos();
    } else if (this.share_type === 'pdf') {
      this.materialService.loadPdfs();
    } else if (this.share_type === 'image') {
      this.materialService.loadImages();
    }
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  loadVideos(): void {
    this.loading = true;
    this.loadingError = '';
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.storeService.videos$.subscribe(
      (videos) => {
        this.loading = false;
        this.materials = videos;
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  loadPdfs(): void {
    this.loading = true;
    this.loadingError = '';
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.storeService.pdfs$.subscribe(
      (pdfs) => {
        this.loading = false;
        this.materials = pdfs;
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  loadImages(): void {
    this.loading = true;
    this.loadingError = '';
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.storeService.images$.subscribe(
      (images) => {
        this.loading = false;
        this.materials = images;
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  toggleMaterial(material: any): void {
    if (this.materialSelection.isSelected(material._id)) {
      this.materialSelection.deselect(material._id);
      const index = this.selectedMaterials.indexOf(material._id);
      if (index >= 0) {
        this.selectedMaterials.splice(index, 1);
      }
    } else {
      this.materialSelection.select(material._id);
      this.selectedMaterials.push(material._id);
    }
  }

  getMaterialType(material: any): any {
    if (material.type) {
      if (material.type === 'application/pdf') {
        return 'PDF';
      } else if (material.type.includes('image')) {
        return 'Image';
      }
    }
    return 'Video';
  }

  errorThumb(): any {
    if (this.share_type === 'video') {
      return this.sspaService.toAsset('img/video_thumb.jpg');
    } else if (this.share_type === 'pdf') {
      return this.sspaService.toAsset('img/pdf_overlay.png');
    } else if (this.share_type === 'image') {
      return this.sspaService.toAsset('img/image_overlay.png');
    }
  }

  async shareMaterials(): Promise<void> {
    if (this.selectedMaterials.length <= 0) {
      return;
    }

    this.sharing = true;
    this.teamService
      .shareTeamMaterials(
        [this.teamId],
        this.selectedMaterials,
        this.share_type
      )
      .subscribe(
        (res) => {
          if (res && res.length > 0) {
            this.sharing = false;
            this.dialogRef.close({
              materials: res[0]
            });
          }
        },
        (error) => {
          this.sharing = false;
          this.dialogRef.close();
        }
      );

    // if (this.share_type === 'video') {
    //   this.teamService
    //     .shareVideos([this.teamId], this.selectedMaterials)
    //     .subscribe(
    //       (res) => {
    //         if (res) {
    //           this.sharing = false;
    //           this.dialogRef.close({
    //             materials: res[0]
    //           });
    //         }
    //       },
    //       (error) => {
    //         this.sharing = false;
    //         this.dialogRef.close();
    //       }
    //     );
    // } else if (this.share_type === 'pdf') {
    //   this.teamService
    //     .sharePdfs([this.teamId], this.selectedMaterials)
    //     .subscribe(
    //       (res) => {
    //         if (res) {
    //           this.sharing = false;
    //           this.dialogRef.close({
    //             materials: res[0]
    //           });
    //         }
    //       },
    //       (error) => {
    //         this.sharing = false;
    //         this.dialogRef.close();
    //       }
    //     );
    // } else if (this.share_type === 'image') {
    //   this.teamService
    //     .shareImages([this.teamId], this.selectedMaterials)
    //     .subscribe(
    //       (res) => {
    //         if (res) {
    //           this.sharing = false;
    //           this.dialogRef.close({
    //             materials: res[0]
    //           });
    //         }
    //       },
    //       (error) => {
    //         this.sharing = false;
    //         this.dialogRef.close();
    //       }
    //     );
    // }
  }
}
