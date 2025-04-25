import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CropperOptions } from 'ngx-cropperjs-wrapper';
import Cropper from 'cropperjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-avatar-editor',
  templateUrl: './avatar-editor.component.html',
  styleUrls: ['./avatar-editor.component.scss']
})
export class AvatarEditorComponent implements OnInit {
  config = {
    aspectRatio: 1,
    minContainerWidth: 240,
    minContainerHeight: 240,
    minCanvasWidth: 240,
    minCanvasHeight: 240,
    minCropBoxWidth: 240,
    minCropBoxHeight: 240,
    checkCrossOrigin: false,
    dragMode: 'move',
    viewMode: 0
  } as CropperOptions;
  public cropper: Cropper;
  public croppedImage;
  saving = false;
  zoomValue = 1;
  naturalRatio = 1;

  fileInput: File;
  @ViewChild('fileSrc') imageInput;
  @ViewChild('imageCropper') imageCropper;

  constructor(
    private dialogRef: MatDialogRef<AvatarEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.fileInput = this.data.fileInput;
  }

  ngOnInit(): void {}

  onCropperInit(cropper: Cropper): void {
    this.cropper = cropper;
  }
  onFail(event: Event): void {
    console.log('cropper failed', event);
  }
  /**
   * Set Crop box data (center and fill the rect)
   */
  updateFile(): void {
    const containerData = this.cropper.getContainerData();
    const left = (containerData.width - 240) / 2;
    const top = (containerData.height - 240) / 2;
    this.cropper.setCropBoxData({
      left,
      top,
      width: 240,
      height: 240
    });
  }

  /**
   * Set Natual Ratio
   */
  readyCropper(): void {
    const canvasData = this.cropper.getCanvasData();
    this.naturalRatio = canvasData.width / canvasData.naturalWidth;
  }

  /**
   * Crop the image and send the data to the caller.
   */
  cropEmit(): void {
    this.saving = true;
    const canvas = this.cropper.getCroppedCanvas();
    const src = canvas.toDataURL();
    canvas.toBlob(() => {
      this.croppedImage = src;
      this.dialogRef.close(this.croppedImage);
      this.saving = false;
    });
  }

  onZoom(evt): void {
    const zoomValue =
      Math.floor((evt.detail.ratio / this.naturalRatio) * 10) / 10;
    this.zoomValue = zoomValue;
  }

  /**
   * Zoom the image
   * @param evt : Zoom value
   */
  zoomImage(evt: number): void {
    this.cropper.zoomTo(evt * this.naturalRatio);
  }

  /**
   * By triggering the file input click event, file change
   */
  changePhoto(): void {
    this.imageInput.nativeElement.click();
  }

  /**
   * File Change
   * @param evt : HTML File Change Event
   */
  openPhotoChange(evt: Event): void {
    const targetDom = <HTMLInputElement>evt.target;
    if (targetDom.files[0]) {
      this.fileInput = targetDom.files[0];
      this.zoomValue = 1;
    }
  }

  /**
   * Remove Photo
   */
  removePhoto(): void {
    this.fileInput = null;
    this.dialogRef.close(this.fileInput);
  }

  /**
   * Close Dialog
   */
  close(): void {
    this.dialogRef.close(false);
  }
}
