import { Component, ElementRef, AfterViewInit } from '@angular/core';
import {
  ListType,
  MaterialType,
  ResourceCategory,
  FilterMode
} from '@core/enums/resources.enum';
import { v4 as uuidv4 } from 'uuid';
import { MaterialListService } from '@services/material-list.service';
import { MaterialService } from '@services/material.service';
import {
  BulkActionItem,
  MaterialItem,
  FilterTypeItem,
  IMaterialItem,
  MaterialListType,
  SortTypeItem
} from '@core/interfaces/resources.interface';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { BulkActions, THEMES } from '@constants/variable.constants';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { SspaService } from '../../../services/sspa.service';
import { HandlerService } from '@app/services/handler.service';
import { MaterialEditTemplateComponent } from '@app/components/material-edit-template/material-edit-template.component';
import { MaterialSendComponent } from '@app/components/material-send/material-send.component';
import { ConfirmBulkMaterialsComponent } from '@app/components/confirm-bulk-materials/confirm-bulk-materials.component';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { VideoEditComponent } from '@app/components/video-edit/video-edit.component';
import { PdfEditComponent } from '@app/components/pdf-edit/pdf-edit.component';
import { ImageEditComponent } from '@app/components/image-edit/image-edit.component';
import { LeadCaptureFormComponent } from '@app/components/lead-capture-form/lead-capture-form.component';
import { SocialShareComponent } from '@app/components/social-share/social-share.component';
import { environment } from '@environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';
import { catchError, takeUntil } from 'rxjs/operators';
import { CreateEmbededMaterialComponent } from '@app/components/create-embeded-material/create-embeded-material.component';
import { LeadFormService } from '@app/services/lead-form.service';
import { Subject, Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { MaterialNavigateService } from '@app/services/material-navigate.service';
import { MaterialCreateComponent } from '@app/components/material-create/material-create.component';

@Component({
  selector: 'app-materials-main',
  templateUrl: './materials-main.component.html',
  styleUrls: ['./materials-main.component.scss']
})
export class MaterialsMainComponent
  extends ResourceListBase<MaterialItem, MaterialListService, MaterialType>
  implements AfterViewInit
{
  private readonly destroy$ = new Subject();
  readonly FilterMode = FilterMode;
  selectedView = 'tile_view';
  isSspa = environment.isSspa; // is vertox

  DISPLAY_COLUMNS: string[] = [
    'select',
    'name',
    'sent',
    'views',
    'type',
    'created_at',
    'share',
    'sub_actions',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.OWN;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.MATERIAL;
  SORT_TYPES: SortTypeItem[] = [
    { id: 'az', label: 'A-Z' },
    { id: 'za', label: 'Z-A' },
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'most_viewed', label: 'Most Viewed' },
    { id: 'least_viewed', label: 'Least Viewed' }
  ];
  sortType = this.SORT_TYPES[0];
  FILTER_TYPES: FilterTypeItem<MaterialType>[] = [
    { id: MaterialType.FOLDER, label: 'Folder' },
    { id: MaterialType.VIDEO, label: 'Video' },
    { id: MaterialType.PDF, label: 'Pdf' },
    { id: MaterialType.IMAGE, label: 'Image' }
  ];
  filterType = this.FILTER_TYPES[0];
  BULK_ACTIONS = BulkActions.Materials;
  FOLDER_ACTIONS = BulkActions.Folders;
  THEME_DIC = THEMES.reduce((dic, e) => ({ ...dic, [e.id]: e }), {});
  GLOBAL_THEME = '';
  BASE_URL = '/materials';
  loadingStatus: string[] = [];
  siteUrl = environment.website;

  profileSubscription: Subscription;
  isPackageText = false;
  disableActions: BulkActionItem[] = [];
  closeRecordDialogSubscription: Subscription;
  refreshSubscription: Subscription;
  previewingMaterialId?: string;
  folderExpanded = true;

  constructor(
    protected service: MaterialListService,
    private materialNavigateService: MaterialNavigateService,
    private materialService: MaterialService,
    protected userService: UserService,
    protected myElement: ElementRef,
    protected router: Router,
    protected route: ActivatedRoute,
    protected toast: ToastrService,
    protected dialog: MatDialog,
    public sspaService: SspaService,
    private handlerService: HandlerService,
    private clipboard: Clipboard,
    private leadFormService: LeadFormService,
    private location: Location
  ) {
    super();
    this.initSubscribers();
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url.indexOf('/library') !== -1) {
          this.BULK_ACTIONS = BulkActions.Library;
          this.DISPLAY_COLUMNS = [
            'select',
            'name',
            'type',
            'created_at',
            'share',
            'actions'
          ];
        } else {
          this.BULK_ACTIONS = BulkActions.Materials;
          this.DISPLAY_COLUMNS = [
            'select',
            'name',
            'sent',
            'views',
            'type',
            'created_at',
            'share',
            'sub_actions',
            'actions'
          ];
        }
        setTimeout(() => {
          this.onSelectParentFolderCallback(event.url);
        }, 250);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.route.queryParams.subscribe((params) => {
        if (params['video']) {
          this.dialog
            .open(VideoEditComponent, {
              position: { top: '5vh' },
              width: '100vw',
              maxWidth: '500px',
              disableClose: true,
              data: {
                id: params['video'],
                type: 'edit'
              }
            })
            .afterClosed()
            .subscribe((res) => {
              this.location.replaceState(`/materials`);
              this.load(params['video']);
            });
        }
      });
    }, 1000);

    this.leadFormService.load();
  }

  ngOnDestroy(): void {
    this.closeRecordDialogSubscription &&
      this.closeRecordDialogSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.destroy$.next(true);
  }

  initSubscribers(): void {
    this.service.updateItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data.updateAction == 'Share') {
          const existIndex = (this.files ?? []).findIndex(
            (file) => file._id === data?.itemId
          );
          if (existIndex !== -1) {
            this.files[existIndex]['shared_with'] =
              data?.updateData?.shared_with ?? [];
          }
        } else if (
          data.updateAction == 'LoadList' &&
          this.previewingMaterialId
        ) {
          const updatedMaterial = (this.files ?? []).find(
            (file) => file._id === this.previewingMaterialId
          );
          if (updatedMaterial) {
            this.materialService.previewSelectedMaterial.next(
              new MaterialItem(updatedMaterial as MaterialItem)
            );
          }
        }
      });

    this.materialService.previewSelectedMaterial$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.previewingMaterialId = data?._id;
      });

    this.materialService.viewMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((_mode) => {
        this.selectedView = _mode;
      });

    this.handlerService.refreshMaterial.subscribe((res) => {
      if (res) {
        this.load();
      }
    });

    this.materialService.newAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((_data) => {
        if (!_data) {
          return;
        }
        const type = Object.keys(_data)[0];
        if (!type) {
          return;
        }
        switch (type) {
          case 'record':
            this.recordSetting();
            break;
          case 'folder':
            this.createFolder(null);
            break;
          default:
            this.createMaterial(type);
            break;
        }
      });

    this.userService.garbage$.subscribe((_garbage) => {
      if (_garbage?._id) {
        this.GLOBAL_THEME = _garbage.material_theme;
      }
    });

    this.leadFormService.forms$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lead_forms) => {
        const forms = [];
        if (lead_forms.length) {
          this.forms = lead_forms;
          lead_forms.forEach((e) => {
            const lead_form = {};
            let id = '';
            Object.keys(e).forEach((key) => {
              lead_form[key] = e[key];
              if (key === '_id') {
                id = e[key];
              }
            });
            forms[id] = lead_form;
          });
        }
      });

    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user = profile;
        this.isPackageText = profile.text_info?.is_enabled;
        this.disableActions = [];
        if (!profile.capture_enabled) {
          this.disableActions.push({
            label: 'Capture',
            type: 'toggle',
            status: false,
            command: 'lead_capture',
            loading: false
          });
        }
        if (!this.isPackageText) {
          this.disableActions.push({
            label: 'Send via Text',
            type: 'button',
            icon: 'i-sms-sent',
            command: 'text',
            loading: false
          });
        }
      }
    );
    this.closeRecordDialogSubscription =
      this.handlerService.openRecording$.subscribe((res) => {
        if (res === 'close') {
          this.load();
        }
      });
  }

  doAction(action: BulkActionItem): void {
    const selectedMaterials = this.filteredItems.filter(
      (e) =>
        e.item_type !== MaterialType.FOLDER &&
        this.selectedFiles.includes(e._id)
    );
    switch (action.command) {
      case 'email':
        this.dialog.open(MaterialSendComponent, {
          position: { top: '5vh' },
          width: '96vw',
          maxWidth: '600px',
          disableClose: true,
          data: {
            material: [...selectedMaterials],
            type: 'email'
          }
        });
        break;
      case 'text':
        this.dialog.open(MaterialSendComponent, {
          position: { top: '5vh' },
          width: '96vw',
          maxWidth: '600px',
          disableClose: true,
          data: {
            material: [...selectedMaterials],
            type: 'text'
          }
        });
        break;
      case 'deselect':
        this.selectedFiles = [];
        break;
      case 'lead_capture':
        this.dialog
          .open(LeadCaptureFormComponent, {
            position: { top: '100px' },
            width: '100vw',
            maxWidth: '600px',
            disableClose: true,
            data: {
              type: 'all',
              materials: [...selectedMaterials]
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              selectedMaterials.forEach((e: MaterialItem) => {
                e.enabled_capture = res.enabled_capture;
                e.capture_form = res.capture_form;
              });
            }
          });
        break;
      case 'folder':
        this.moveToOtherFolder();
        break;
      case 'share':
        this.share();
        break;
      case 'delete':
        this.deleteMaterial();
        break;
      case 'template':
        this.dialog
          .open(MaterialEditTemplateComponent, {
            position: { top: '10vh' },
            width: '100vw',
            maxWidth: '600px',
            disableClose: true,
            data: {
              type: 'all',
              materials: [...selectedMaterials]
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (!res) return;
            const ids = selectedMaterials.map((e) => e._id);
            this.items.forEach((e: MaterialItem) => {
              if (ids.includes(e._id)) {
                e.material_theme = res.theme_id;
                if (e.item_type === 'pdf' && res.view_mode)
                  e.view_mode = res.view_mode;
              }
            });
          });
        break;
      case 'download':
        this.download();
        break;
    }
  }

  doFolderAction(action: BulkActionItem): void {
    event?.stopPropagation();
    event?.preventDefault();
    switch (action.command) {
      case 'edit':
        this.editFolder();
        break;
      case 'delete':
        this.deleteFolder();
        break;
      case 'deselect':
        this.selectedFolders = [];
        break;
    }
  }

  openFilePreview(event: any, material: IMaterialItem): void {
    event?.preventDefault();
    const currentPreviewSelectedMaterial =
      this.materialService.previewSelectedMaterial.getValue();
    if (currentPreviewSelectedMaterial?._id === material._id) {
      if (material.role === 'admin' && !material.user) {
        window.open(
          `${this.siteUrl}/${material.item_type}?${material.item_type}=${material._id}&user=${this.userId}`,
          '_blank'
        );
      } else {
        window.open(
          `${this.siteUrl}/${material.item_type}/${material._id}`,
          '_blank'
        );
      }
    } else {
      this.materialService.previewSelectedMaterial.next({
        ...material,
        teamId: this.teamInfo?._id || this.teamId
      });
    }
  }

  recordSetting(): void {
    this.handlerService.openRecording.next(new Date().getTime());
  }

  createMaterial(type: string): void {
    this.dialog
      .open(MaterialCreateComponent, {
        maxWidth: '600px',
        disableClose: true,
        data: {
          currentFolder: this.currentFolder,
          type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status) {
          this.load();
        }
      });
  }

  deleteMaterial(material?: MaterialItem): void {
    let selectedMaterials = [];
    if (material) {
      selectedMaterials = [material];
    } else {
      selectedMaterials = this.filteredItems.filter(
        (e) =>
          e.item_type !== MaterialType.FOLDER &&
          this.selectedFiles.includes(e._id)
      );
    }
    if (!selectedMaterials.length) {
      return;
    } else {
      const confirmDialog = this.dialog.open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Materials',
          message: 'Are you sure to delete these selected materials?',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          mode: 'warning'
        }
      });
      confirmDialog.afterClosed().subscribe((res) => {
        if (res) {
          const selectedVideos = [];
          const selectedPdfs = [];
          const selectedImages = [];
          selectedMaterials.forEach((e) => {
            if (e.item_type === MaterialType.VIDEO) {
              selectedVideos.push(e._id);
            } else if (e.item_type === MaterialType.PDF) {
              selectedPdfs.push(e._id);
            } else if (e.item_type === MaterialType.IMAGE) {
              selectedImages.push(e._id);
            }
          });
          if (
            selectedVideos.length ||
            selectedImages.length ||
            selectedPdfs.length
          ) {
            const removeData = {
              folder: this.currentFolder,
              videos: selectedVideos,
              pdfs: selectedPdfs,
              images: selectedImages
            };
            this.materialService.bulkRemove(removeData).subscribe((res) => {
              if (res.status) {
                if (res.failed?.length > 0) {
                  this.dialog
                    .open(ConfirmBulkMaterialsComponent, {
                      position: { top: '100px' },
                      width: '657px',
                      maxWidth: '657px',
                      disableClose: true,
                      data: {
                        title: 'Delete Materials',
                        additional: res.failed,
                        message:
                          "You can't remove following materials because those have been used in different places. Click expand to see detail reason."
                      }
                    })
                    .afterClosed()
                    .subscribe(() => {
                      const total =
                        selectedVideos.length +
                        selectedImages.length +
                        selectedPdfs.length;
                      if (res.failed.length !== total) {
                        const failedMaterials = res.failed.map(
                          (e) => e.material.id
                        );
                        const materialIds = selectedMaterials
                          .filter((e) => !failedMaterials.includes(e._id))
                          .map((e) => e._id);
                        this.filteredItems = this.filteredItems.filter(
                          (e) => !materialIds.includes(e._id)
                        );
                        this.items = this.items.filter(
                          (e) => !materialIds.includes(e._id)
                        );
                        this.selectedFiles = this.selectedFiles.filter(
                          (e) => !materialIds.includes(e)
                        );
                        this.getFoldersAndFiles();
                      }
                    });
                } else {
                  const materialIds = selectedMaterials.map((e) => e._id);
                  this.filteredItems = this.filteredItems.filter(
                    (e) => !materialIds.includes(e._id)
                  );
                  this.items = this.items.filter(
                    (e) => !materialIds.includes(e._id)
                  );
                  this.getFoldersAndFiles();
                  this.selectedFiles = [];
                }
              }
            });
          }
        }
      });
    }
  }

  getFoldersAndFiles() {
    this.folders = this.filteredItems.filter((e) => e.item_type === 'folder');
    this.files = this.filteredItems.filter((e) => e.item_type !== 'folder');
  }

  sendMaterial(material, type = 'eamil'): void {
    this.dialog
      .open(MaterialSendComponent, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          material: [material],
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

  editDetail(material: MaterialItem): void {
    let component;
    if (material.item_type === MaterialType.VIDEO) {
      component = VideoEditComponent;
    } else if (material.item_type === MaterialType.PDF) {
      component = PdfEditComponent;
    } else if (material.item_type === MaterialType.IMAGE) {
      component = ImageEditComponent;
    }

    this.dialog
      .open(component, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          material: { ...material },
          type: 'edit',
          editContent: false
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status) {
          const index = this.filteredItems.findIndex(
            (item) => item._id === res.data._id
          );
          if (index !== -1) {
            this.filteredItems[index].title = res.data.title;
            this.filteredItems[index].description = res.data.description;
            this.filteredItems[index].thumbnail = res.data.thumbnail;
            this.filteredItems[index].preview = res.data.preview;
          }
        }
      });
  }

  editTheme(material: MaterialItem): void {
    this.dialog
      .open(MaterialEditTemplateComponent, {
        position: { top: '10vh' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: { materials: [material] }
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        material.material_theme = res.theme_id;
        if (material.item_type === MaterialType.PDF && res.view_mode) {
          material.view_mode = res.view_mode;
        }
      });
  }

  editLeadCapture(material: MaterialItem): void {
    this.dialog
      .open(LeadCaptureFormComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          type: 'single',
          material: material
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          material.enabled_capture = res.enabled_capture;
          material.capture_form = res.capture_form;
          material.forms = res.forms;
        }
      });
  }

  duplicate(material: MaterialItem): void {
    let component;
    if (material.item_type === MaterialType.VIDEO) {
      component = VideoEditComponent;
    } else if (material.item_type === MaterialType.PDF) {
      component = PdfEditComponent;
    } else if (material.item_type === MaterialType.IMAGE) {
      component = ImageEditComponent;
    }
    this.dialog
      .open(component, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          material: { ...material },
          type: 'duplicate'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.load();
        }
      });
  }

  socialShare(material: MaterialItem): void {
    const url = `${this.siteUrl}/${material.item_type}/${material._id}`;
    this.dialog.open(SocialShareComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      data: {
        url: url
      }
    });
  }

  getTrackableLink(material: MaterialItem): void {
    const typeField = material.item_type + 's';
    const tempData = {
      content: 'generated link',
      send_uuid: uuidv4(),
      type: typeField,
      [typeField]: [material._id]
    };
    this.materialService.createActivity(tempData).subscribe((res) => {
      if (res) {
        const url =
          environment.website + `/${material.item_type}6/` + tempData.send_uuid;
        this.clipboard.copy(url);
        this.toast.success('Generated the trackable link to clipboard');
      }
    });
  }

  copyLink(material: MaterialItem): void {
    const url =
      environment.website + '/' + material.item_type + '/' + material._id;
    this.clipboard.copy(url);
    this.toast.success('Copied the link to clipboard');
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

  async downloadSource(material: MaterialItem) {
    this.loadingStatus.push(material._id);
    if (!material.bucket) {
      if (typeof material.url === 'string') {
        await this.sourceBuffer(material.url, material.title);
      } else if (typeof material.url === 'object') {
        const urls: string[] = material.url;
        for (let i = 0; urls.length > i; i++) {
          await this.sourceBuffer(urls[i], material.title + i);
        }
      }
      this.loadingStatus = this.loadingStatus.filter(
        (id: string) => id !== material._id
      );
    } else {
      this.materialService
        .downloadVideo(material._id)
        .pipe(
          catchError((err, obs) => {
            this.loadingStatus = this.loadingStatus.filter(
              (id: string) => id !== material._id
            );
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
          this.loadingStatus = this.loadingStatus.filter(
            (id: string) => id !== material._id
          );
        });
    }
  }

  getEmbededCode(material: MaterialItem): void {
    this.dialog.open(CreateEmbededMaterialComponent, {
      width: '90vw',
      maxWidth: '440px',
      data: material
    });
  }

  onSelectParentFolderCallback(url: string) {
    const folderId = url.split('/').pop();
    if (folderId === 'root') {
      this.materialNavigateService.selectFolder(null);
    } else if (
      folderId !==
      this.materialNavigateService.activeFolder.getValue()?.folderId
    ) {
      const teamId = this.teamId;
      const type: MaterialListType = url.includes('/library')
        ? 'Library'
        : 'Own';
      const param = {
        type,
        folderId,
        teamId
      };
      this.materialNavigateService.selectFolder(param);
    }
  }

  goToSubFolder(event: any, folder: MaterialItem): void {
    event.preventDefault();
    const teamId = folder.team?.['_id'] || this.teamId;
    const type: MaterialListType = teamId ? 'Library' : 'Own';
    const param = {
      type,
      folderId: folder._id,
      teamId
    };
    this.materialNavigateService.selectFolder(param);
    if (!teamId) {
      if (folder.role === 'admin') {
        this.router.navigate(['/materials/library/' + folder._id], {
          state: {
            folderId: folder._id,
            folderName: folder.title,
            isOwn: false
          }
        });
      } else {
        this.router.navigate(['/materials/own/' + folder._id], {
          state: {
            folderId: folder._id,
            folderName: folder.title,
            isOwn: true
          }
        });
      }
    } else {
      this.router.navigate(
        ['/materials/library/' + teamId + '/' + folder._id],
        {
          state: {
            folderId: folder._id,
            folderName: folder.title,
            isOwn: false
          }
        }
      );
    }
  }

  onFilterType(type: string): void {
    console.log(type);
  }

  scrollLeft() {
    this.carouselContent.nativeElement.scrollBy({
      left: -300,
      behavior: 'smooth'
    });
    setTimeout(() => this.checkScrollPosition(), 300);
  }

  scrollRight() {
    this.carouselContent.nativeElement.scrollBy({
      left: 300,
      behavior: 'smooth'
    });
    setTimeout(() => this.checkScrollPosition(), 300);
  }

  changeView(event) {
    event.stopPropagation();
    event.preventDefault();
    this.isAll = !this.isAll;
  }
}
