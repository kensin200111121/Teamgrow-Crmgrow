import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Material } from '@app/models/material.model';
import { MaterialService } from '@app/services/material.service';
import { SspaService } from '@app/services/sspa.service';
import { UserService } from '@app/services/user.service';
import { TabItem } from '@app/utils/data.types';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { catchError, Subscription } from 'rxjs';
import { MaterialSendComponent } from '../material-send/material-send.component';
import { VideoEditComponent } from '../video-edit/video-edit.component';
import { PdfEditComponent } from '../pdf-edit/pdf-edit.component';
import { ImageEditComponent } from '../image-edit/image-edit.component';
import { MaterialEditTemplateComponent } from '../material-edit-template/material-edit-template.component';
import { LeadCaptureFormComponent } from '../lead-capture-form/lead-capture-form.component';
import { SocialShareComponent } from '../social-share/social-share.component';
import { TeamMaterialShareComponent } from '../team-material-share/team-material-share.component';
import { v4 as uuidv4 } from 'uuid';
import { Clipboard } from '@angular/cdk/clipboard';
import { ConfirmComponent } from '../confirm/confirm.component';
import { NotifyComponent } from '../notify/notify.component';
import { MoveFolderComponent } from '../move-folder/move-folder.component';
import { saveAs } from 'file-saver';
import {
  DownloadRequest,
  IMaterialItem,
  MaterialItem,
  StopShareRequest
} from '@app/core/interfaces/resources.interface';
import { CreateEmbededMaterialComponent } from '../create-embeded-material/create-embeded-material.component';
import { MaterialType } from '@app/core/enums/resources.enum';
import { DialogSettings } from '@app/constants/variable.constants';
import { MaterialListService } from '@app/services/material-list.service';

@Component({
  selector: 'app-material-preview-v2',
  templateUrl: './material-preview-v2.component.html',
  styleUrls: ['./material-preview-v2.component.scss']
})
export class MaterialPreviewV2Component implements OnInit {
  tabs: TabItem[] = [
    { icon: '', label: 'File Details', id: 'fileDetail' },
    { icon: '', label: 'Landing Page', id: 'landingPage' },
    { icon: '', label: 'Viewer History', id: 'viewerHistory' }
  ];
  tab: TabItem = this.tabs[0];
  loadingStatus = false;
  isSspa = environment.isSspa; // is vertox

  siteUrl = environment.website;
  materialIdType: { _id: string; type: string };
  materialItem: IMaterialItem | null = null;
  sharedTeamList: Array<{ _id: string; name: string }> = [];
  isLoading: string | boolean = false;
  isShowMore = false;
  userId = null;
  watched_activity = [];
  @Input() contentType?: 'page' | null;
  @Input() isMyList!: boolean;

  @Input() set setMaterialItem(material: IMaterialItem) {
    const { _id, item_type: type } = material;
    this.materialItem = material;
    this.sharedTeamList = (material.shared_with ?? [])
      .filter((item) => {
        const materialId = Object.keys(item)[0];
        return materialId === material._id;
      })
      .map(
        (_item) =>
          Object.values(_item)[0] as unknown as { _id: string; name: string }
      );
    this.materialIdType = { _id, type };
    this._init(
      this.materialPreview?._id && this.materialPreview?._id === material?._id
    );
  }

  @Input() set previewId(info: { _id: string; type: string }) {
    this.materialIdType = info;
    this._init();
  }

  loadDetailSubscription: Subscription;
  loadTrackCountSubscription: Subscription;
  profileSubscription: Subscription;
  materialDeleteSubscription: Subscription;
  enabledNotification = false;

  showAnonymous = true;

  selectedFolder: Material;

  materialPreview;

  sentCount = 0; //sent
  viewCount = 0; //watch
  contactCount = 0; //contact
  loadingCountInfo = false;

  get materialType(): string {
    if (this.materialPreview.type) {
      if (this.materialPreview.type === 'application/pdf') {
        return 'PDF';
      } else if (this.materialPreview.type.includes('image')) {
        return 'Image';
      }
    }
    return this.materialIdType.type;
  }

  get materialMimeType(): string {
    if (this.materialPreview.type === 'youtube') {
      return 'Youtube';
    } else if (this.materialPreview.type === 'vimeo') {
      return 'Vimeo';
    }
    return 'MP4';
  }

  downloading = false;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    protected materialListService: MaterialListService,
    private materialService: MaterialService,
    private userService: UserService,
    private toast: ToastrService,
    private clipboard: Clipboard,
    public sspaService: SspaService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.userId = profile._id;
      }
    );
  }

  ngOnInit(): void {}

  _init(isReload = false): void {
    this.loadPreviewData(
      this.materialIdType._id,
      this.materialIdType.type,
      'load',
      isReload
    );
  }

  closePreview(evt): void {
    evt?.preventDefault();
    this.materialService.previewSelectedMaterial.next(null);
  }

  setPreviewInfo(info: any) {
    if (info) {
      this.materialPreview = info;
      this.materialPreview.material_type = this.materialType?.toLowerCase();
      this.enabledNotification = !!this.materialPreview?.enabled_notification;
    }
    this.isLoading = false;
  }

  loadPreviewData(id, type, loadType: string, isReload = false): void {
    this.isLoading = isReload ? 'reloading' : true;
    if (!isReload) {
      this.loadingCountInfo = true;
      this.loadTrackCountSubscription &&
        this.loadTrackCountSubscription.unsubscribe();
      this.loadTrackCountSubscription = this.materialService
        .loadMaterialTrackCount(id, type)
        .subscribe((res) => {
          this.loadingCountInfo = false;
          this.sentCount = res?.sent ?? 0;
          this.viewCount = res?.tracked ?? 0;
          this.contactCount = res?.contact ?? 0;
        });
    }

    this.loadDetailSubscription = this.materialService
      .getMaterialById(id, type)
      .subscribe((res) => {
        this.setPreviewInfo(res);
      });
  }

  getEmbededCode(): void {
    this.dialog.open(CreateEmbededMaterialComponent, {
      width: '90vw',
      maxWidth: '440px',
      data: this.materialPreview
    });
  }

  copyLink(): void {
    const url =
      environment.website +
      '/' +
      this.materialPreview.material_type +
      '/' +
      this.materialPreview._id;
    this.clipboard.copy(url);
    this.toast.success('Copied the link to clipboard');
  }

  sendMaterial(type: string): void {
    this.dialog
      .open(MaterialSendComponent, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '900px',
        disableClose: true,
        data: {
          material: [this.materialPreview],
          type: type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.redirect) {
          this.router.navigate(['/settings/integration']);
        }
      });
  }

  editDetail(): void {
    let component;
    if (this.materialPreview.material_type === MaterialType.VIDEO) {
      component = VideoEditComponent;
    } else if (this.materialPreview.material_type === MaterialType.PDF) {
      component = PdfEditComponent;
    } else if (this.materialPreview.material_type === MaterialType.IMAGE) {
      component = ImageEditComponent;
    }

    this.dialog
      .open(component, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          material: { ...this.materialPreview },
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status) {
          this.materialPreview.title = res.data.title;
          this.materialPreview.description = res.data.description;
          this.materialPreview.thumbnail = res.data.thumbnail;
          this.materialPreview.preview = res.data.preview;

          if (this.contentType !== 'page') {
            this.materialItem.title = res.data.title;
            this.materialItem.description = res.data.description;
            this.materialItem.thumbnail = res.data.thumbnail;
            this.materialItem.preview = res.data.preview;
            this.materialService.previewSelectedMaterial.next(
              this.materialItem
            );
          }
        }
      });
  }

  shareMaterial(): void {
    const material = this.materialPreview;
    const url = `${this.siteUrl}/${material.material_type}/${material._id}`;
    this.dialog.open(SocialShareComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      data: {
        url: url
      }
    });
  }

  shareTeam(): void {
    this.dialog
      .open(TeamMaterialShareComponent, {
        width: '98vw',
        maxWidth: '450px',
        data: {
          resources: { materials: [this.materialIdType] },
          type: 'material'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if ((res?.sharedTeamInfo ?? []).length > 0) {
          this.callbackForShareAction(res?.sharedTeamInfo, true);
        }
      });
  }

  async downloadSource() {
    const material = this.materialPreview;
    this.loadingStatus = true;
    if (!material.bucket) {
      if (typeof material.url === 'string') {
        await this.sourceBuffer(material.url, material.title);
      } else if (typeof material.url === 'object') {
        const urls: string[] = material.url;
        for (let i = 0; urls.length > i; i++) {
          await this.sourceBuffer(urls[i], material.title + i);
        }
      }
      this.loadingStatus = false;
    } else {
      this.materialService
        .downloadVideo(material._id)
        .pipe(
          catchError((err, obs) => {
            this.loadingStatus = false;
            return obs;
          })
        )
        .subscribe(async (res) => {
          if (res?.status) {
            await this.sourceBuffertoken(res.data, material.title + '.mp4');
            // saveAs(url[0], material.title + '.mp4');
          } else {
            this.toast.warning(`Downloading is failed.`);
          }
          this.loadingStatus = false;
        });
    }
  }

  async sourceBuffer(url: string, name: string) {
    const response = await fetch(url, {
      headers: new Headers({
        Origin: location.origin
      }),
      mode: 'cors'
    });
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const filename = url.split('.');
    const a = document.createElement('a');
    a.download = name + '.' + filename[filename.length - 1];
    a.href = blobUrl;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async sourceBuffertoken(url: string, name: string) {
    const response = await fetch(url, {
      headers: new Headers({
        Origin: location.origin
      }),
      mode: 'cors'
    });
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.download = name;
    a.href = blobUrl;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  deleteMaterial(): void {
    const material = this.materialPreview;
    switch (material.material_type) {
      case 'video':
        const videoConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Video',
            message: 'Are you sure to delete this video?',
            confirmLabel: 'Delete',
            mode: 'warning',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          videoConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deleteVideo(material._id)
                .subscribe((res) => {
                  this.materialService.delete$([material._id]);
                  if (material.shared_video) {
                    this.materialService.update$(material.shared_video, {
                      has_shared: false,
                      shared_video: ''
                    });
                  }
                  // this.toast.success('Video has been deleted successfully.');
                });
            }
          });
        }
        break;
      case 'image':
        const imageConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Image',
            message: 'Are you sure you want to delete this Image?',
            confirmLabel: 'Delete',
            mode: 'warning',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          imageConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deleteImage(material._id)
                .subscribe((res) => {
                  this.materialService.delete$([material._id]);
                  if (material.shared_image) {
                    this.materialService.update$(material.shared_image, {
                      has_shared: false,
                      shared_image: ''
                    });
                  }
                  // this.toast.success('Image has been deleted successfully.');
                });
            }
          });
        }
        break;
      case 'pdf':
        const pdfConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Pdf',
            message: 'Are you sure to delete this pdf?',
            confirmLabel: 'Delete',
            mode: 'warning',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          pdfConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deletePdf(material._id)
                .subscribe((res) => {
                  this.materialService.delete$([material._id]);
                  if (material.shared_pdf) {
                    this.materialService.update$(material.shared_pdf, {
                      has_shared: false,
                      shared_pdf: ''
                    });
                  }
                  // this.toast.success('Pdf has been deleted successfully.');
                });
            }
          });
        }
        break;
    }
  }

  moveToFolder(): void {
    let selectMaterial = [];
    const material = this.materialPreview;
    selectMaterial = [material];

    if (!selectMaterial.length) {
      this.dialog.open(NotifyComponent, {
        width: '96vw',
        maxWidth: '360px',
        data: {
          message: 'You have to select material(s) to move those to the folder.'
        }
      });
      return;
    }
    if (selectMaterial.length > 0) {
      this.dialog
        .open(MoveFolderComponent, {
          width: '96vw',
          maxWidth: '500px',
          data: {
            type: 'material',
            currentFolder: this.selectedFolder,
            files: selectMaterial
          }
        })
        .afterClosed()
        .subscribe((status) => {
          if (status) {
            console.log('Success');
          }
        });
    }
  }

  download(): void {
    if (!this.materialPreview.bucket) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = this.materialPreview.url;
      a.click();
    } else {
      this.materialService
        .downloadVideo(this.materialPreview._id)
        .subscribe((res) => {
          if (res['status']) {
            saveAs(res['data'], res['title'] + '.mp4');
          } else {
            this.toast.warning(`Downloading is failed.`);
          }
        });
    }
  }

  checkType(url: string): boolean {
    if (!url) {
      return true;
    }
    if (url.indexOf('youtube.com') == -1 && url.indexOf('vimeo.com') == -1) {
      return true;
    } else {
      return false;
    }
  }

  getAvatarName(contact): any {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name && !contact.last_name) {
      return contact.first_name[0];
    } else if (!contact.first_name && contact.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }

  openMaterial(event: any): void {
    event?.preventDefault();
    if (this.materialPreview.role === 'admin' && !this.materialPreview.user) {
      window.open(
        `${this.siteUrl}/${this.materialPreview.material_type}?${this.materialPreview.material_type}=${this.materialPreview._id}&user=${this.userId}`,
        '_blank'
      );
    } else {
      window.open(
        `${this.siteUrl}/${this.materialPreview.material_type}/${this.materialPreview._id}`,
        '_blank'
      );
    }
  }

  changeTab(tab: TabItem): void {
    this.tab = tab;
    localStorage.setItem('contactSelectedTab', this.tab.id);
  }

  callbackForShareAction(
    teamInfo: Array<{ _id: string; name: string }>,
    isShare: boolean
  ) {
    if (this.contentType === 'page') {
      return;
    }
    const materialId = this.materialItem._id;
    if (isShare) {
      teamInfo.forEach((team) => {
        const existIndex = (this.materialItem.shared_with ?? []).findIndex(
          (item) => {
            const itemMaterialId = Object.keys(item)[0];
            const itemTeamId = Object.values(item)[0]._id;
            return materialId === itemMaterialId && itemTeamId === team._id;
          }
        );
        if (existIndex === -1) {
          this.materialItem = {
            ...this.materialItem,
            shared_with: [
              ...(this.materialItem?.shared_with ?? []),
              { [materialId]: team }
            ]
          };
        }
      });
    } else {
      const stopSharedTeam = teamInfo[0];
      const filteredList = (this.materialItem.shared_with ?? []).filter(
        (item) => {
          const itemMaterialId = Object.keys(item)[0];
          const itemTeamId = Object.values(item)[0]._id;
          return (
            materialId === itemMaterialId && itemTeamId !== stopSharedTeam._id
          );
        }
      );
      this.materialItem = { ...this.materialItem, shared_with: filteredList };
    }
    this.materialService.previewSelectedMaterial.next(this.materialItem);
    this.materialListService.updateItem.next({
      updateAction: 'Share',
      itemId: this.materialItem._id,
      updateData: { shared_with: this.materialItem.shared_with ?? [] }
    });
  }

  stopShare(teamInfo) {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.ALERT,
        data: {
          title: 'Stop share',
          message: 'Are you going to stop share this material from the team?',
          confirmLabel: 'Yes, Stop share',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status) {
          this.stopShareOnTeam(teamInfo);
        }
      });
  }

  stopShareOnTeam(teamInfo: { _id: string; name: string }) {
    const { _id, type } = this.materialIdType;
    const requestData: StopShareRequest = {
      materials: [{ _id, type }],
      team_ids: [teamInfo._id]
    };
    this.materialService.checkStopShare(requestData).subscribe((res) => {
      if (res?.status) {
        const count =
          (res.data?.videos || []).length +
          (res.data?.pdfs || []).length +
          (res.data?.images || []).length +
          (res.data?.titles || []).length +
          (res.data?.templates || []).length;
        if (count == 0) {
          this.materialService.stopShare(requestData).subscribe((_res) => {
            if (_res) {
              //TO DO Callback Handler
              this.callbackForShareAction([teamInfo], false);
            }
          });
        } else {
          const title = 'Stop Share Materials';

          const dialog = this.dialog.open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            position: { top: '100px' },
            data: {
              title,
              message: 'Stop share failed!',
              titles: res['data'].titles || [],
              videos: res['data'].videos || [],
              images: res['data'].images || [],
              pdfs: res['data'].pdfs || [],
              templates: res['data'].templates || [],
              confirmLabel: 'Yes',
              cancelLabel: 'No'
            }
          });
          dialog.afterClosed().subscribe((result) => {
            let _data;
            if (result) {
              _data = { ...requestData, bulk_data: res.data };
            } else {
              _data = requestData;
            }
            this.materialService.stopShare(_data).subscribe((_res) => {
              if (_res) {
                this.callbackForShareAction([teamInfo], false);
              } else {
                //TO DO Empty Callback Handler
              }
            });
          });
        }
      } else {
        //TO DO Error Handler
      }
    });
  }

  toggleEnableNotification() {
    this.materialService
      .toggleEnableNotification(
        this.materialIdType._id,
        this.materialIdType.type,
        !this.enabledNotification
      )
      .subscribe((res) => {
        this.enabledNotification = res;
      });
  }

  editTemplate(): void {
    this.dialog
      .open(MaterialEditTemplateComponent, {
        position: { top: '10vh' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          id: this.materialPreview._id,
          materials: [this.materialPreview]
        }
      })
      .afterClosed()
      .subscribe((theme) => {
        if (theme) {
          this.materialPreview.material_theme = theme.theme_id;
        }
      });
  }

  leadCapture(): void {
    this.dialog
      .open(LeadCaptureFormComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          type: 'single',
          material: this.materialPreview
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.materialPreview.enabled_capture = res.enabled_capture;
          this.materialPreview.capture_form = res.capture_form;
        }
      });
  }

  downloadMaterial(): void {
    if (!this.materialItem.teamId || this.downloading) {
      return;
    }
    const downloadRequest: DownloadRequest = {
      materials: [
        {
          type: this.materialPreview.material_type,
          _id: this.materialPreview._id
        }
      ],
      team: this.materialItem.teamId
    };
    this.downloading = true;
    this.materialListService.download(downloadRequest).subscribe((res) => {
      this.downloading = false;
      if (res) {
        this.toast.show(
          'Material is downloaded to your list successfully.',
          'Material Download'
        );
      }
    });
  }

  generateTrackableLink(): void {
    let url;
    let tempData;
    const material = this.materialPreview;
    if (material.material_type == 'video') {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'videos',
        videos: [material._id]
      };
    } else if (material.material_type == 'pdf') {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'pdfs',
        pdfs: [material._id]
      };
    } else {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'images',
        images: [material._id]
      };
    }
    this.materialService.createActivity(tempData).subscribe((res) => {
      if (res) {
        if (material.material_type == 'video') {
          url = environment.website + '/video6/' + tempData.send_uuid;
        } else if (material.material_type == 'pdf') {
          url = environment.website + '/pdf6/' + tempData.send_uuid;
        } else if (material.material_type == 'image') {
          url = environment.website + '/image6/' + tempData.send_uuid;
        }
        this.clipboard.copy(url);
        this.toast.success('Generated the trackable link to clipboard');
      }
    });
  }
}
