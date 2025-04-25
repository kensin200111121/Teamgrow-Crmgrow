import { Component, Inject, OnInit } from '@angular/core';
import { AssetsService } from '@services/assets.service';
import { Subscription } from 'rxjs';
import { HelperService } from '@services/helper.service';
import { environment } from '@environments/environment';
import { ASSETS } from '@constants/api.constant';
import { CropperOptions } from 'ngx-cropperjs-wrapper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileItem, FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { FileService } from '@services/file.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-assets-manager',
  templateUrl: './assets-manager.component.html',
  styleUrls: ['./assets-manager.component.scss']
})
export class AssetsManagerComponent implements OnInit {
  loading = false;
  loadSubscription: Subscription;
  removeSubscription: Subscription;
  commonAssets = [];
  myAssets = [];
  selectedMyAssets = [];
  selectedCommonAssets = [];
  loadedAssets = 0;
  page = 1;
  total = 0;
  editorFlag = false;
  selectedAsset;
  assetToEdit;
  uploader = new FileUploaderCustom({
    url: environment.api + ASSETS.UPLOAD,
    authToken: localStorage.getCrmItem('token'),
    itemAlias: 'assets'
  });
  uploading = false;
  uploadProgress;
  replacing = false;
  removing = false;
  reading = false;

  public cropper: Cropper;
  public croppedImage;
  public config = {
    minContainerWidth: 300,
    minContainerHeight: 300,
    minCanvasWidth: 50,
    minCanvasHeight: 50,
    minCropBoxWidth: 50,
    minCropBoxHeight: 50,
    checkCrossOrigin: false,
    dragMode: 'move',
    viewMode: 0
  } as CropperOptions;

  // Specific Selector
  imagesToUpload = [];
  disableCommonImages = false;
  selectedMaps = [];
  selectionDic = {};
  lastSelected = 0;
  limit = 0;
  selectionMode = 0;
  uploadingStatus = {};

  constructor(
    private dialogRef: MatDialogRef<AssetsManagerComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private assetsService: AssetsService,
    private helperSerivce: HelperService,
    private fileService: FileService
  ) {
    this.initUploader();
    this.load();

    if (this.data?.images?.length) {
      this.selectionMode = 1;
      this.limit = this.data.images.length;
      this.disableCommonImages = true;
      this.imagesToUpload = this.data.images;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.removeSubscription && this.removeSubscription.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.loadSubscription = this.assetsService.loadAssets(this.page).subscribe(
      (res) => {
        this.loading = false;
        const assets = res['data'];
        this.loadedAssets += assets.length;
        assets.forEach((e) => {
          if (e.user) {
            this.myAssets.push(e);
          } else {
            this.commonAssets.push(e);
          }
        });
        this.total = res['total'];
      },
      () => {
        this.loading = false;
      }
    );
  }
  loadMore(): void {
    this.page++;
    this.load();
  }
  removeAssets(): void {
    this.removing = true;
    this.removeSubscription = this.assetsService
      .deleteAssets(this.selectedMyAssets)
      .subscribe(
        () => {
          this.removing = false;
          this.total -= this.selectedMyAssets.length;
          for (let i = this.myAssets.length - 1; i >= 0; i--) {
            const e = this.myAssets[i];
            const pos = this.selectedMyAssets.indexOf(e._id);
            if (pos !== -1) {
              this.myAssets.splice(i, 1);
            }
          }
          this.selectedMyAssets = [];
          this.selectionDic = {};
          this.selectedMaps = [];
        },
        () => {
          this.removing = false;
        }
      );
  }
  close(): void {
    this.dialogRef.close();
  }
  select(): void {
    if (this.selectionMode) {
      this.advancedSelect();
    } else {
      this.normalSelect();
    }
  }

  normalSelect(): void {
    const selectedItems = [];
    this.myAssets.forEach((e) => {
      if (this.selectedMyAssets.indexOf(e._id) !== -1) {
        selectedItems.push(e);
      }
    });
    this.commonAssets.forEach((e) => {
      if (this.selectedCommonAssets.indexOf(e._id) !== -1) {
        selectedItems.push(e);
      }
    });
    if (selectedItems.length) {
      this.dialogRef.close({ data: selectedItems });
    } else {
      this.dialogRef.close();
    }
  }

  advancedSelect(): void {
    const selectedItems = [];
    this.myAssets.forEach((e) => {
      if (this.selectedMyAssets.indexOf(e._id) !== -1) {
        selectedItems.push({
          ...e,
          index: this.selectionDic[e._id]
        });
      }
    });
    console.log('selectedItems', selectedItems);
    if (selectedItems.length) {
      this.dialogRef.close({ data: selectedItems });
    } else {
      this.dialogRef.close();
    }
  }

  openEditor(asset): void {
    this.selectedAsset = asset;
    this.reading = true;
    this.editorFlag = true;
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      this.reading = false;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        const blob = this.helperSerivce.b64toBlob(base64);
        this.assetToEdit = blob;
      };
      reader.readAsDataURL(xhr.response);
    };
    let url = asset?.url || '';
    const base = 'https://teamgrow.s3.us-east-2.amazonaws.com/';
    url = url.startsWith(base) ? url.replace(base, '') : url;
    xhr.open('GET', environment.api + 'file/aws_file?file=' + url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  toggleAsset(asset): void {
    if (this.removing) {
      return;
    }
    if (this.selectionMode) {
      this.advancedToggle(asset);
    } else {
      this.normalToggle(asset);
    }
  }

  normalToggle(asset): void {
    const pos = this.selectedMyAssets.indexOf(asset._id);
    if (pos !== -1) {
      this.selectedMyAssets.splice(pos, 1);
    } else {
      this.selectedMyAssets.push(asset._id);
    }
  }

  advancedToggle(asset): void {
    const pos = this.selectedMyAssets.indexOf(asset._id);
    if (pos !== -1) {
      this.selectedMyAssets.splice(pos, 1);
      const mapPos = this.selectedMaps.findIndex((e) => e._id === asset._id);
      if (mapPos !== -1) this.selectedMaps.splice(mapPos, 1);
    } else {
      if (this.selectedMyAssets.length >= this.lastSelected) {
        this.selectedMyAssets.push(asset._id);
        this.selectedMaps.push({
          index: this.selectedMyAssets.length,
          _id: asset._id
        });
        this.lastSelected = this.selectedMyAssets.length;
      } else {
        for (let i = 0; i < this.lastSelected; i++) {
          if (this.selectedMaps[i]?.index !== i + 1) {
            this.selectedMyAssets.splice(i, -1, asset._id);
            this.selectedMaps.splice(i, -1, {
              index: i + 1,
              _id: asset._id
            });
            break;
          }
        }
      }
    }
    this.selectionDic = {};
    this.selectedMaps.forEach((e) => {
      this.selectionDic[e._id] = e.index;
    });
  }

  toggleCommonAssets(asset): void {
    const pos = this.selectedCommonAssets.indexOf(asset._id);
    if (pos !== -1) {
      this.selectedCommonAssets.splice(pos, 1);
    } else {
      this.selectedCommonAssets.push(asset._id);
    }
  }

  browseAssets(): void {
    this.helperSerivce
      .promptForFiles('', true)
      .then((fileList) => {
        const files = [];
        for (let i = 0; i < fileList.length; i++) {
          files.push(fileList[i]);
        }
        this.uploader = new FileUploaderCustom({
          url: environment.api + ASSETS.UPLOAD,
          authToken: localStorage.getCrmItem('token'),
          itemAlias: 'assets'
        });
        this.initUploader();
        this.uploader.clearQueue();
        this.uploader.addToQueue(files);
        this.uploader.uploadAllFiles();
        this.uploading = true;
      })
      .catch((err) => {
        console.log('Error', err);
      });
  }

  initUploader(): void {
    this.uploader.onSuccessItem = (items, response, status, headers) => {
      const res = JSON.parse(response);
      if (res.status == true) {
        const items = res['data'];
        this.myAssets = [...items, ...this.myAssets];
      }
      this.uploading = false;
    };
    this.uploader.onErrorItem = () => {
      this.uploading = false;
    };
  }

  closeEditor(): void {
    this.editorFlag = false;
  }
  onFail(error): void {
    console.log('Crop Error', error);
  }
  onCropperInit(cropper: Cropper): void {
    this.cropper = cropper;
  }
  onCrop(): void {}
  rotateLeft(): void {
    this.cropper.rotate(-90);
  }
  rotateRight(): void {
    this.cropper.rotate(90);
  }
  duplicate(): void {
    const canvas = this.cropper.getCroppedCanvas();
    const src = canvas.toDataURL();
    canvas.toBlob((blob) => {
      this.croppedImage = src;
      const asset = {
        name: this.selectedAsset.name,
        url: src
      };
      this.editorFlag = false;
      this.uploading = true;
      this.assetsService.createAsset(asset).subscribe((res) => {
        this.uploading = false;
        if (res['status']) {
          this.myAssets.unshift(res['data']);
        }
      });
      // this.editorFlag = false;
    });
  }
  replace(): void {
    const canvas = this.cropper.getCroppedCanvas();
    const src = canvas.toDataURL();
    canvas.toBlob((blob) => {
      this.croppedImage = src;
      const asset = {
        _id: this.selectedAsset._id,
        url: src
      };
      this.replacing = true;
      this.assetsService.replaceAsset(asset).subscribe((res) => {
        this.replacing = false;
        if (res['status']) {
          this.editorFlag = false;
          this.myAssets.some((e) => {
            if (e._id == this.selectedAsset._id) {
              e.url = res['data']['url'];
              return true;
            }
          });
        }
      });
    });
  }

  /**
   * Upload the base 64 file
   * @param asset
   */
  uploadFile(asset): void {
    console.log('asset', asset);
    const formData = new FormData();
    // Generate the file object
    const blob = this.helperSerivce.b64toBlob(asset.data);
    Object.assign(blob, {});
    const file = blob;
    formData.append('assets', file);
    this.uploadingStatus[asset.key] = 0;
    this.fileService.uploadFile(formData).subscribe((res) => {
      if (res.type === HttpEventType.UploadProgress) {
        this.uploadingStatus[asset.key] = Math.ceil(
          (res.loaded / res.total) * 100
        );
      }
      if (res.type === HttpEventType.Response) {
        const data = res.body['data'][0];
        this.myAssets.unshift(data);
        this.myAssets = [...this.myAssets];
        //remove the original selected key
        const originalPos = this.selectedMaps.findIndex(
          (e) => 'uuid_' + e.index === asset.key
        );
        if (originalPos !== -1) {
          const originalSelected = this.selectedMaps.splice(originalPos, 1);
          const pos = this.selectedMyAssets.findIndex(
            (e) => e._id === originalSelected['_id']
          );
          if (pos !== -1) this.selectedMyAssets.splice(pos, 1);
        }
        // add new asset to the selection
        const newIndex = parseInt(asset.key.replace('uuid_', ''));
        this.selectedMaps.push({
          index: newIndex,
          _id: data._id
        });
        this.selectedMyAssets.push(data._id);
        this.selectedMaps.sort((a, b) => (a.index > b.index ? 1 : -1));
        this.lastSelected = this.selectedMaps.slice(-1)[0]['index'];
        this.selectionDic = {};
        this.selectedMaps.forEach((e) => {
          this.selectionDic[e._id] = e.index;
        });
        delete this.uploadingStatus[asset.key];
        const currentIndex = this.imagesToUpload.findIndex(
          (e) => e.key === asset.key
        );
        if (currentIndex !== -1) {
          this.imagesToUpload.splice(currentIndex, 1);
        }
      }
    });
  }
}

export class FileUploaderCustom extends FileUploader {
  constructor(options: FileUploaderOptions) {
    super(options);
  }

  uploadAllFiles(): void {
    const xhr = new XMLHttpRequest();
    const sendable = new FormData();
    const fakeitem: FileItem = null;
    this.onBuildItemForm(fakeitem, sendable);

    for (const item of this.queue) {
      item.isReady = true;
      item.isUploading = true;
      item.isUploaded = false;
      item.isSuccess = false;
      item.isCancel = false;
      item.isError = false;
      item.progress = 0;

      if (typeof item._file.size !== 'number') {
        throw new TypeError('The file specified is no longer valid');
      }
      sendable.append(this.options.itemAlias, item._file, item.file.name);
    }

    if (this.options.additionalParameter !== undefined) {
      Object.keys(this.options.additionalParameter).forEach((key) => {
        sendable.append(key, this.options.additionalParameter[key]);
      });
    }

    xhr.onload = () => {
      const gist =
        (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304
          ? 'Success'
          : 'Error';
      const method = 'on' + gist + 'Item';
      this[method](fakeitem, xhr.response, xhr.status, null);
    };
    xhr.onerror = () => {
      this.onErrorItem(fakeitem, null, xhr.status, null);
    };

    xhr.onabort = () => {
      this.onErrorItem(fakeitem, null, xhr.status, null);
    };

    xhr.upload.onprogress = (event) => {
      const progress = Math.round(
        event.lengthComputable ? (event.loaded * 100) / event.total : 0
      );
      this.progress = progress;
    };

    xhr.open('POST', this.options.url, true);
    xhr.withCredentials = false;
    if (this.options.headers) {
      for (let _i = 0, _a = this.options.headers; _i < _a.length; _i++) {
        const header = _a[_i];
        xhr.setRequestHeader(header.name, header.value);
      }
    }
    if (this.authToken) {
      xhr.setRequestHeader(this.authTokenHeader, this.authToken);
    }
    xhr.send(sendable);
  }

  clearQueue = () => {
    while (this.queue.length) {
      this.queue[0].remove();
    }
    this.progress = 0;
  };
}
