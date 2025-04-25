import { SspaService } from '../../services/sspa.service';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  NgZone
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import {
  moveItemInArray,
  CdkDrag,
  CdkDropList,
  DropListRef
} from '@angular/cdk/drag-drop';
import { UserService } from '@services/user.service';
import { MaterialService } from '@services/material.service';
import { HelperService } from '@services/helper.service';
import { PdfService } from '@services/pdf.service';
import { ToastrService } from 'ngx-toastr';
import canvas from 'html2canvas';
import { Observable, of, Subscription } from 'rxjs';
import { Material } from '@models/material.model';
import { PageCanDeactivate } from '@variables/abstractors';
import { HandlerService } from '@services/handler.service';
import { dataUrlToFile } from '@app/helper';
import { catchError, map } from 'rxjs/operators';

function __indexOf(collection, node) {
  return Array.prototype.indexOf.call(collection, node);
}

@Component({
  selector: 'app-material-change',
  templateUrl: './material-change.component.html',
  styleUrls: ['./material-change.component.scss']
})
export class MaterialChangeComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy
{
  // Interface
  @Input()
  public set material(val: Material) {
    if (val) {
      this.materialId = val._id;
      this.materialType = val.material_type;
      if (this.materialType === 'image') {
        this._material = new Material().deserialize({
          url: val.url || [],
          key: val.key || []
        });
      }
    }
  }
  @Output() onCancel = new EventEmitter();
  @Output() onUpdated = new EventEmitter();
  @ViewChild(CdkDropList) placeholder: CdkDropList;

  _material: Material = new Material().deserialize({ material_type: 'video' });
  materialId;
  materialType = 'video';

  saved = true;
  userId = '';
  step = 1;
  overFile = false;
  submitted = false;

  pdfFile;
  pdfFileContent;
  thumbnail_loading = false;
  pdfThumbSubscription: Subscription;

  imageFiles;
  target: DropListRef;
  targetIndex: number;
  source: CdkDropList;
  sourceIndex: number;

  videoFile;
  videoId = '';
  CHUNK_SIZE: number = 1024 * 1024 * 250;
  videoChunkCounter = 0;
  videoTotalChunks = 0;
  totalUploadProgress = 0;
  chunkUploadProgress = 0;
  uploadingError = '';
  retryAttempt = 0;
  retryAttemptSufix = 'th';
  uploadingChunks = false;
  mergingChunks = false;
  savingData = false;
  canceling = false;

  socialVideoLoading = false;
  vimeoVideoMetaSubscription: Subscription;
  youtubeVideoMetaSubscription: Subscription;
  profileSubscription: Subscription;

  uploading = false;
  uploadedProgress = 0;

  constructor(
    private pdfService: PdfService,
    private materialService: MaterialService,
    private userService: UserService,
    private toast: ToastrService,
    private helperService: HelperService,
    private handlerService: HandlerService,
    private zone: NgZone,
    public sspaService: SspaService
  ) {
    super();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.userId = profile._id;
        }
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.vimeoVideoMetaSubscription &&
      this.vimeoVideoMetaSubscription.unsubscribe();
    this.youtubeVideoMetaSubscription &&
      this.youtubeVideoMetaSubscription.unsubscribe();
  }

  activeFileZone(evt = null): void {
    evt && evt.preventDefault();
    this.overFile = true;
  }

  disableFileZone(evt = null): void {
    evt && evt.preventDefault();
    this.overFile = false;
  }

  /**
   * Go to next step
   */
  goNextStep(): void {
    this.step++;
  }

  /**
   * Go to first step
   */
  goFirstStep(): void {
    this._material.preview = null;
    this._material.thumbnail = null;
    this._material.site_image = null;
    this.step = 1;
  }

  openFileDialog(type: string): void {
    switch (type) {
      case 'video':
        this.helperService.promptForVideo().then((file) => {
          this.videoFile = file;
          this.confirmVideoFileSelection();
        });
        break;
      case 'pdf':
        this.helperService.promptForPDF().then((file) => {
          this.pdfFile = file;
          this.confirmPdfFileSelection();
        });
        break;
      case 'image':
        this.helperService.promptForFiles('image/*', true).then((files) => {
          this.imageFiles = files;
          this.confirmImageFileSelection();
        });
        break;
    }
  }

  /**
   * Handle the file drop event
   * @param evt
   * @param type
   * @returns
   */
  fileAccepted(evt, type = 'video'): void {
    evt && evt.preventDefault();
    this.overFile = false;
    const files = [];
    if (evt.dataTransfer.items) {
      for (let i = 0; i < evt.dataTransfer.items.length; i++) {
        if (evt.dataTransfer.items[i].kind === 'file') {
          const file = evt.dataTransfer.items[i].getAsFile();
          files.push(file);
        }
      }
    } else {
      for (let i = 0; i < evt.dataTransfer.files.length; i++) {
        files.push(evt.dataTransfer.files[i]);
      }
    }
    if (type === 'video') {
      if (files.length) {
        this.videoFile = files[0];
      }
      if (this.videoFile) {
        this.confirmVideoFileSelection();
      }
      return;
    }
    if (type === 'pdf') {
      if (files.length) {
        this.pdfFile = files[0];
      }
      if (this.pdfFile) {
        this.confirmPdfFileSelection();
      }
      return;
    }
    if (type === 'image') {
      if (files.length) {
        this.imageFiles = files;
        this.confirmImageFileSelection();
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  checkVideoUrl(): void {
    if (
      this._material.url.toLowerCase().indexOf('youtube.com') > -1 ||
      this._material.url.toLowerCase().indexOf('youtu.be') !== -1
    ) {
      this.getYoutubeId();
    }
    if (this._material.url.toLowerCase().indexOf('vimeo.com') > -1) {
      this.getVimeoId();
    }
  }

  getYoutubeId(): any {
    if (this._material.url.toLowerCase().indexOf('youtube.com/watch') !== -1) {
      const matches = this._material.url.match(/watch\?v=([a-zA-Z0-9\-_]+)/);
      if (matches) {
        const videoId = matches[1];
        this.getMetaFromYoutube(videoId);
        return;
      }
    } else if (
      this._material.url.toLowerCase().indexOf('youtube.com/embed') !== -1
    ) {
      const matches = this._material.url.match(/embed\/([a-zA-Z0-9\-_]+)/);
      if (matches) {
        const videoId = matches[1];
        this.getMetaFromYoutube(videoId);
        return;
      }
    } else if (this._material.url.toLowerCase().indexOf('youtu.be/') !== -1) {
      const matches = this._material.url.match(/youtu.be\/([a-zA-Z0-9\-_]+)/);
      if (matches) {
        const videoId = matches[1];
        this.getMetaFromYoutube(videoId);
        return;
      }
    }
    return;
  }

  getVimeoId(): any {
    if (this._material.url.toLowerCase().indexOf('vimeo.com/video') !== -1) {
      const matches = this._material.url.match(/video\/([0-9]+)/);
      if (matches) {
        let videoId = matches[1];

        const hashReg = new RegExp(
          'vimeo.com/video/' + videoId + '/([0-9a-z]+)'
        );
        const hashMatches = this._material.url.match(hashReg);
        let hash = '';
        if (hashMatches && hashMatches.length) {
          hash = hashMatches[1];
          videoId = videoId + ':' + hash;
        }

        this.getThumbnailFromVimeo(videoId);
        return;
      }
    } else if (this._material.url.toLowerCase().indexOf('vimeo.com/') !== -1) {
      const matches = this._material.url.match(/vimeo.com\/([0-9]+)/);
      if (matches) {
        let videoId = matches[1];

        const hashReg = new RegExp('vimeo.com/' + videoId + '/([0-9a-z]+)');
        const hashMatches = this._material.url.match(hashReg);
        let hash = '';
        if (hashMatches && hashMatches.length) {
          hash = hashMatches[1];
          videoId = videoId + ':' + hash;
        }

        this.getThumbnailFromVimeo(videoId);
        return;
      }
    }
  }

  getMetaFromYoutube(id: string): any {
    this.youtubeVideoMetaSubscription &&
      this.youtubeVideoMetaSubscription.unsubscribe();
    this.socialVideoLoading = true;
    this.youtubeVideoMetaSubscription = this.materialService
      .getYoutubeMeta(id)
      .subscribe(
        (res) => {
          this.socialVideoLoading = false;
          if (
            res['items'] &&
            res['items'][0] &&
            res['items'][0]['contentDetails']
          ) {
            const duration = res['items'][0]['contentDetails']['duration'];
            this._material.duration = this.YTDurationToSeconds(duration) * 1000;
          }
          if (res['items'] && res['items'][0] && res['items'][0]['snippet']) {
            const thumbnail =
              res['items'][0]['snippet']['thumbnails']['medium']['url'];
            if (thumbnail) {
              this._material.thumbnail = thumbnail;
            } else {
              this._material.thumbnail =
                'https://img.youtube.com/vi/' + id + '/0.jpg';
            }

            const title = res['items'][0]['snippet']['title'];
            this._material.title = title;
          }
          if (res['items']) {
            this._material.type = 'youtube';
            this.goNextStep();
          }
        },
        (err) => {
          this.socialVideoLoading = false;
          this._material.thumbnail =
            'https://img.youtube.com/vi/' + id + '/0.jpg';
        }
      );
  }

  getThumbnailFromVimeo(id): any {
    this.vimeoVideoMetaSubscription &&
      this.vimeoVideoMetaSubscription.unsubscribe();
    this.socialVideoLoading = true;
    this.vimeoVideoMetaSubscription = this.materialService
      .getVimeoMeta(id)
      .subscribe(
        (res) => {
          this.socialVideoLoading = false;
          if (res) {
            if (res.privacy.embed !== 'public') {
              this.toast.error(
                'Because of its privacy settings, this video cannot be embedded here'
              );
              return;
            }
            const pictures = res.pictures.sizes;
            if (pictures && pictures.length) {
              pictures.some((e) => {
                if (e.width === 640) {
                  this._material.thumbnail = e.link;
                  return true;
                }
              });
            }
            this._material.duration = res['duration'] * 1000;
            this._material.title = res['name'];
            this._material.type = 'vimeo';
            this._material.url = res.player_embed_url;
            this.goNextStep();
          }
        },
        (err) => {
          this.socialVideoLoading = false;
        }
      );
  }

  /**
   * Go to duration
   * @param duration
   * @returns
   */
  YTDurationToSeconds(duration): any {
    let a = duration.match(/\d+/g);

    if (
      duration.indexOf('M') >= 0 &&
      duration.indexOf('H') == -1 &&
      duration.indexOf('S') == -1
    ) {
      a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
      a = [a[0], 0, a[1]];
    }
    if (
      duration.indexOf('H') >= 0 &&
      duration.indexOf('M') == -1 &&
      duration.indexOf('S') == -1
    ) {
      a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
      duration = duration + parseInt(a[0]) * 3600;
      duration = duration + parseInt(a[1]) * 60;
      duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
      duration = duration + parseInt(a[0]) * 60;
      duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
      duration = duration + parseInt(a[0]);
    }
    return duration;
  }

  /**
   *
   * @returns
   */
  confirmVideoFileSelection(): void {
    if (!this.videoFile) {
      return;
    }
    if (
      !(
        this.videoFile.name.toLowerCase().endsWith('.mp4') ||
        this.videoFile.name.toLowerCase().endsWith('.mov')
      )
    ) {
      this.toast.warning('Unsupported File Selected.');
      this.videoFile = null;
      return;
    }
    this.helperService
      .generateThumbnail(this.videoFile)
      .then((data) => {
        this._material.thumbnail = data.image;
        this._material.duration = data.duration;
        this._material.type = 'video/';
        this.goNextStep();
      })
      .catch((err) => {
        console.log('[File read error]', err);
        this.toast.warning(
          'Cannot read this file. Please try with standard file.'
        );
      });
  }

  uploadVideo(): void {
    if (this._material.type === 'youtube' || this._material.type === 'vimeo') {
      if (!this._material.duration) {
        this.toast.error("Can't read video's detail information.");
        return;
      }
      this.uploadSocialVideo();
      return;
    }
    if (!this.videoFile) {
      return;
    }
    this.videoId =
      'u' +
      this.userId +
      '-' +
      new Date().getTime() +
      '-' +
      this.between(1000, 9999);
    this.videoTotalChunks = Math.ceil(this.videoFile.size / this.CHUNK_SIZE);
    if (this.videoTotalChunks > 1) {
      this.videoChunkCounter = 0;
      this.uploadingChunks = true;
      this.uploadVideoChunk(0);
    } else {
      this.uploadSingleVideo();
    }
  }

  uploadSocialVideo(): void {
    console.log('this._material', this._material);
    const data = {
      type: this._material.type,
      url: this._material.url,
      duration: this._material.duration,
      thumbnail: this._material.thumbnail,
      title: this._material.title,
      description: this._material.description,
      bucket: '',
      key: '',
      converted: 'completed'
    };
    this.uploading = true;
    this.materialService
      .uploadVideoDetail(this.materialId, data)
      .subscribe((res) => {
        if (res) {
          this.uploading = false;
          this.onUpdated.emit(res.data);
        }
      });
    return;
  }

  uploadSingleVideo(): void {
    const formData = new FormData();
    formData.append('file', this.videoFile);
    formData.append('thumbnail', this._material.thumbnail);
    formData.append('id', this.materialId);
    this.uploadingChunks = true;
    this.materialService
      .uploadSingle(this.videoId, formData)
      .subscribe((res) => {
        if (!res) {
          this.uploadingChunks = false;
        }
        if (res.type === HttpEventType.UploadProgress) {
          this.totalUploadProgress = Math.ceil((res.loaded / res.total) * 100);
          console.log('uploading', this.totalUploadProgress);
        }
        if (res.type === HttpEventType.Response) {
          this.uploadingChunks = false;
          console.log('uploaded successfully', res);
          const data = res.body.data;
          this.onUpdated.emit(data);
        }
      });
  }

  uploadVideoChunk(start: number, retry = false): void {
    this.uploadingError = '';
    if (!retry) {
      this.videoChunkCounter++;
      this.retryAttempt = 0;
    } else {
      if (this.retryAttempt < 10) {
        this.retryAttempt++;
        if (this.retryAttempt === 1) {
          this.retryAttemptSufix = 'st';
        } else if (this.retryAttempt === 2) {
          this.retryAttemptSufix = 'nd';
        } else if (this.retryAttempt === 3) {
          this.retryAttemptSufix = 'rd';
        } else {
          this.retryAttemptSufix = 'th';
        }
      } else {
        this.toast.error('Video uploading is failed.');
        this.resetVideoUpload();
      }
    }
    const chunkEnd = Math.min(start + this.CHUNK_SIZE, this.videoFile.size);
    const chunk = this.videoFile.slice(start, chunkEnd);
    const fileOfBlob = new File(
      [chunk],
      this.videoId + '-' + this.videoChunkCounter
    );
    const chunkForm = new FormData();
    chunkForm.append('file', fileOfBlob);
    this.materialService
      .uploadVideoChunk2(this.videoId, chunkForm)
      .pipe(
        map((res) => res),
        catchError(this.handleError({ type: 'fail', status: false }))
      )
      .subscribe((event) => {
        if (event.type == 'fail') {
          // Failed in uploading && reuploading
          this.totalUploadProgress = Math.round(
            (start / this.videoFile.size) * 100
          );
          switch (event.error.status) {
            case 0:
              this.uploadingError =
                'Network Connection is failed or server is updating. Please check your network. This chunk uploading would be restart within 5s.';
            default:
              if (typeof event?.error?.error === 'string') {
                this.uploadingError =
                  'Uploading is failed. ' + event.error?.error || '';
              } else {
                this.uploadingError =
                  'Uploading is failing with ' +
                  event.error.status +
                  ' code. This chunk uploading would be restart within 5s.';
              }
          }
          setTimeout(() => {
            this.uploadVideoChunk(start, true);
          }, 5000);
        } else if (event.type == HttpEventType.UploadProgress) {
          this.chunkUploadProgress = Math.round(
            100 * (event.loaded / event.total)
          );
          this.totalUploadProgress =
            Math.round((start / this.videoFile.size) * 100) +
            Math.round(
              this.chunkUploadProgress * (event.total / this.videoFile.size)
            );
        } else if (event.type == HttpEventType.Response) {
          // Uploaded chunk and next chunk
          if (this.videoChunkCounter < this.videoTotalChunks) {
            this.uploadVideoChunk(chunkEnd);
          } else {
            this.uploadingChunks = false;
            // Uploading is completed => merge files && save related informations
            this.mergeVideoChunks();
          }
        }
      });
  }

  mergeVideoChunks(): void {
    const newVideo = { ...this._material };
    this.mergingChunks = true;
    this.materialService
      .mergeChunks({
        id: this.videoId,
        count: this.videoTotalChunks,
        video: this._material,
        video_id: this.materialId
      })
      .subscribe((res) => {
        this.mergingChunks = false;
        if (res && res['data'] && res['data']['id']) {
          this.saved = true;
          this.onUpdated.emit(res['data']);
        } else {
          this.toast.error('Video uploading is failed.');
        }
        this.resetVideoUpload();
      });
  }

  /**
   * Cancel Video Uploading
   */
  cancelVideoUpload(): void {
    this.canceling = true;
    this.materialService
      .mergeChunks({
        id: this.videoId,
        count: this.videoTotalChunks,
        action: 'delete'
      })
      .subscribe(() => {
        this.canceling = false;
        this.resetVideoUpload();
      });
  }

  /**
   * Reset Uploading Variables
   */
  resetVideoUpload(): void {
    this.uploading = false;
    this.videoChunkCounter = 0;
    this.videoTotalChunks = 0;
    this.totalUploadProgress = 0;
    this.chunkUploadProgress = 0;
    this.uploadingError = '';
    this.retryAttempt = 0;
    this.uploadingChunks = false;
    this.mergingChunks = false;
    this.savingData = false;
    this.canceling = false;
    this.videoId = '';
  }
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * Confirm if the selected file is pdf
   * Set the PDF file content to generate the thumbnail
   * @returns
   */
  confirmPdfFileSelection(): void {
    if (!this.pdfFile) {
      return;
    }
    if (!this.pdfFile.name.toLowerCase().endsWith('.pdf')) {
      this.toast.warning('Unsupported File Selected.');
      return;
    }
    this.thumbnail_loading = true;
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      this.pdfFileContent = e.target['result'];
      this.pdfService
        .getPdfThumbnail(this.pdfFileContent)
        .then((blob) => {
          this.helperService
            .generateImageThumbnail(blob, 'pdf')
            .then((b64) => {
              this.thumbnail_loading = false;
              this._material.preview = b64;
            })
            .catch((err) => {
              this.showErrorToast(err.message || err);
              this.thumbnail_loading = false;
            });
        })
        .catch((err) => {
          this.showErrorToast(err.message || err);
          this.thumbnail_loading = false;
        });
    };
    fileReader.readAsArrayBuffer(this.pdfFile);
    this.goNextStep();
  }

  /**
   * Upload PDF file
   */
  uploadPDF(): void {
    if (this.thumbnail_loading) {
      this.toast.info(
        'Please wait for the thumbnail generation.',
        'Thumbnail generating...'
      );
      return;
    }
    const formData = new FormData();
    formData.append('pdf', this.pdfFile);
    if (this._material.preview) {
      const previewFile = dataUrlToFile(this._material.preview, 'preview.png');
      formData.append('preview', previewFile);
    }
    this.uploading = true;
    this.materialService
      .uploadPdf(this.materialId, formData)
      .subscribe((res) => {
        if (!res) {
          this.uploading = false;
        }
        if (res?.type === HttpEventType.UploadProgress) {
          this.uploadedProgress = Math.ceil((res.loaded / res.total) * 100);
          console.log('uploading', this.uploadedProgress);
        }
        if (res?.type === HttpEventType.Response) {
          this.uploading = false;
          const data = res.body.data;
          this.onUpdated.emit(data);
        }
      });
  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  confirmImageFileSelection(): void {
    const rejectedFiles = [];
    for (let i = this.imageFiles.length - 1; i >= 0; i--) {
      const file = this.imageFiles[i];
      if (!file.type.toLowerCase().startsWith('image')) {
        rejectedFiles.push(file);
        this.imageFiles.splice(i, 1);
      }
    }
    if (this.imageFiles.length) {
      for (let i = 0; i < this.imageFiles.length; i++) {
        this.helperService.loadBase64(this.imageFiles[i]).then((base64) => {
          const url = {
            file: this.imageFiles[i],
            fileContent: base64
          };
          this._material.url.push(url);
        });
      }
    }
  }

  uploadImages(): void {
    const formData = new FormData();
    const timeIndex = Date.now();
    const keys = [];
    const urls = [];
    for (let i = 0; i < this._material.url.length; i++) {
      let key = this._material.key[i];
      let url = this._material.url[i];
      if (this._material.url[i].file) {
        const ext = this._material.url[i].file.name.split('.').splice(-1)[0];
        const newName = this.materialId + '-' + timeIndex + '-' + i + '.' + ext;
        const file = this._material.url[i].file;
        const fileToUpload = new File([file], newName, { type: file.type });
        formData.append('image', fileToUpload);
        key = this.materialId + '-' + timeIndex + '-' + i + '.' + ext;
        url = key;
      }
      keys.push(key);
      urls.push(url);
    }
    const data = { keys, urls };
    formData.append('data', JSON.stringify(data));
    this.uploading = true;
    this.materialService
      .updateImage(this.materialId, formData)
      .subscribe((res) => {
        if (!res) {
          this.uploading = false;
        }
        if (res?.type === HttpEventType.UploadProgress) {
          this.uploadedProgress = Math.ceil((res.loaded / res.total) * 100);
        }
        if (res?.type === HttpEventType.Response) {
          this.uploading = false;
          const data = res.body.data;
          this.onUpdated.emit(data);
        }
      });
  }

  // updateVideo(video): void {
  //   const videoId = video._id;
  //   const newVideo = { ...video };
  //   delete newVideo.created_at;
  //   delete newVideo._v;
  //   delete newVideo.user;
  //   delete newVideo._id;
  //   newVideo.duration = this.video.duration;
  //   newVideo.thumbnail = this.video.thumbnail;
  //   newVideo.site_image = this.video['site_image'];
  //   newVideo.custom_thumbnail = this.video['custom_thumbnail'];

  //   this.video['url'] = video.url;
  //   if (this.currentFolder !== '') {
  //     newVideo['folder'] = this.currentFolder;
  //   }

  //   this.materialService.uploadVideoDetail(videoId, newVideo).subscribe(
  //     (res) => {
  //       this.uploading = false;
  //       this.saved = true;
  //       this.materialService.loadOwn(true);
  //       this.dialogRef.close();
  //     },
  //     (err) => {
  //       this.uploading = false;
  //     }
  //   );
  // }

  // /**
  //  * Save data
  //  */
  // saveVideoData(videoId: string): void {
  //   const newVideo = { ...this.video };
  //   if (this.currentFolder) {
  //     newVideo['folder'] = this.currentFolder;
  //   }
  //   this.savingData = true;
  //   this.materialService
  //     .uploadVideoDetail(videoId, newVideo)
  //     .subscribe((res) => {
  //       this.savingData = false;
  //       if (res && res['status']) {
  //         this.saved = true;
  //         // this.toast.success('Video is uploaded successfully.');
  //         this.materialService.loadOwn(true);
  //         this.dialogRef.close();
  //       } else {
  //         this.toast.error(
  //           'Video is created. But video information is not saved.'
  //         );
  //       }
  //       this.resetVideoUpload();
  //     });
  // }

  handleError<T>(result?: T, returnError = false) {
    return (error: any): Observable<T> => {
      // default data observable
      if (returnError) {
        return of({ ...error.error, statusCode: error.status } as T);
      } else {
        return of({ ...result, ...error } as T);
      }
    };
  }

  between(min: number, max: number): number {
    return Math.floor((max - min) * Math.random()) + min;
  }

  goBack(): void {
    this.onCancel.emit();
  }

  removeImage(imageNumber: number): void {
    this._material.url.splice(imageNumber, 1);
    this._material.key.splice(imageNumber, 1);
  }

  enter = (drag: CdkDrag, drop: CdkDropList) => {
    console.log('this.placeholder', this.placeholder, this.target, this.source);
    if (drop == this.placeholder) return true;

    const phElement = this.placeholder.element.nativeElement;
    const dropElement = drop.element.nativeElement;

    const dragIndex = __indexOf(
      dropElement.parentNode.children,
      drag.dropContainer.element.nativeElement
    );
    const dropIndex = __indexOf(dropElement.parentNode.children, dropElement);

    if (!this.source) {
      this.sourceIndex = dragIndex;
      this.source = drag.dropContainer;

      const sourceElement = this.source.element.nativeElement;
      phElement.style.width = sourceElement.clientWidth + 'px';
      phElement.style.height = sourceElement.clientHeight + 'px';

      sourceElement.parentNode.removeChild(sourceElement);
    }

    this.targetIndex = dropIndex;
    this.target = drop._dropListRef;

    phElement.style.display = '';
    dropElement.parentNode.insertBefore(
      phElement,
      dragIndex < dropIndex ? dropElement.nextSibling : dropElement
    );

    this.source._dropListRef.start();
    this.placeholder._dropListRef.enter(
      drag._dragRef,
      drag.element.nativeElement.offsetLeft,
      drag.element.nativeElement.offsetTop
    );

    return false;
  };

  changeImageOrder(): void {
    if (!this.target) return;

    const phElement = this.placeholder.element.nativeElement;
    const parent = phElement.parentNode;

    phElement.style.display = 'none';

    parent.removeChild(phElement);
    parent.appendChild(phElement);
    parent.insertBefore(
      this.source.element.nativeElement,
      parent.children[this.sourceIndex]
    );

    this.target = null;
    this.source = null;

    if (this.sourceIndex != this.targetIndex)
      moveItemInArray(this._material.url, this.sourceIndex, this.targetIndex);
  }

  /**
   * Show error message
   * @param msg : Error message
   */
  showErrorToast(msg: string): void {
    this.toast.error(msg, '');
  }
}

// var blob = file.slice(0, file.size, 'image/png');
// var newFile = new File([blob], 'name.png', {type: 'image/png'});
