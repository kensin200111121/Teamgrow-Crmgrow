import { SspaService } from './sspa.service';
import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '@environments/environment';
import { getIdsOnSMS } from '@app/utils/functions';
import { UserService } from '@services/user.service';
import { StoreService } from '@app/services/store.service';
import { LabelService } from '@services/label.service';
import { Contact } from '@models/contact.model';
import * as _ from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    public sspaService: SspaService,
    public userService: UserService,
    public storeService: StoreService,
    public labelService: LabelService
  ) {}

  public generateThumbnail(videoFile: Blob): Promise<any> {
    const video: HTMLVideoElement = this.document.createElement('video');
    const canvas: HTMLCanvasElement = this.document.createElement('canvas');
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    const canvasWidth = 480,
      canvasHeight = 270;
    return new Promise<any>((resolve, reject) => {
      canvas.addEventListener('error', reject);
      video.addEventListener('error', reject);
      video.addEventListener('loadedmetadata', () => {
        if (video.duration < 4) {
          reject('video is too short.');
          return;
        }
        setTimeout(() => {
          video.currentTime = 4;
        }, 200);
        video.addEventListener('seeked', () => {
          const imgWidth = video.videoWidth;
          const imgHeight = video.videoHeight;
          let newWidth, newHeight;
          let offX, offY;
          if (imgHeight < (imgWidth * 9) / 16) {
            newWidth = canvasWidth;
            newHeight = (newWidth * imgHeight) / imgWidth;
            offX = 0;
            offY = (canvasHeight - newHeight) / 2;
          } else {
            newHeight = canvasHeight;
            newWidth = (newHeight * imgWidth) / imgHeight;
            offX = (canvasWidth - newWidth) / 2;
            offY = 0;
          }
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          context.fillStyle = 'black';
          context.fillRect(0, 0, canvasWidth, canvasHeight);
          context.drawImage(video, offX, offY, newWidth, newHeight);
          if (video.duration) {
            resolve({
              image: canvas.toDataURL(),
              duration: video.duration * 1000
            });
          } else {
            resolve({
              image: canvas.toDataURL()
            });
          }
        });
      });
      if (videoFile.type) {
        video.setAttribute('type', videoFile.type);
      }
      video.preload = 'auto';
      video.src = window.URL.createObjectURL(videoFile);
      video.load();
    });
  }
  public b64toBlob(dataURI): any {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }
  public generateImageThumbnail(imageFile: Blob, type = null): Promise<any> {
    const fileReader = new FileReader();
    const canvas: HTMLCanvasElement = this.document.createElement('canvas');
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    const canvasWidth = 480,
      canvasHeight = 270;
    return new Promise<any>((resolve, reject) => {
      canvas.addEventListener('error', reject);
      fileReader.addEventListener('error', reject);
      fileReader.addEventListener('load', (event) => {
        const source = new Image();
        source.addEventListener('load', () => {
          const imgWidth = source.width;
          const imgHeight = source.height;
          let newWidth, newHeight;
          let offX, offY;
          if (imgHeight < (imgWidth * 9) / 16) {
            newWidth = canvasWidth;
            newHeight = (newWidth * imgHeight) / imgWidth;
            offX = 0;
            offY = (canvasHeight - newHeight) / 2;
          } else {
            newHeight = canvasHeight;
            newWidth = (newHeight * imgWidth) / imgHeight;
            offX = (canvasWidth - newWidth) / 2;
            offY = 0;
          }
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvasWidth, canvasHeight);
          context.drawImage(source, offX, offY, newWidth, newHeight);
          if (!type) {
            resolve(canvas.toDataURL('image/jpeg'));
          }
          if (type == 'pdf') {
            const overlay = new Image();
            overlay.crossOrigin = 'anonymous';
            overlay.onload = (e) => {
              context.drawImage(
                overlay,
                canvasWidth - 70,
                canvasHeight - 85,
                60,
                75
              );
              resolve(canvas.toDataURL('image/jpeg'));
            };
            overlay.src = this.sspaService.toAsset('img/pdf_overlay.png');
          }
          if (type == 'image') {
            const overlay = new Image();
            overlay.onload = (e) => {
              context.drawImage(
                overlay,
                canvasWidth - 82,
                canvasHeight - 70,
                72,
                60
              );
              resolve(canvas.toDataURL('image/jpeg'));
            };
            overlay.src = this.sspaService.toAsset('img/image_overlay.png');
          }
          if (type == 'video_play') {
            const overlay = new Image();
            overlay.crossOrigin = 'anonymous';
            overlay.onload = (e) => {
              context.drawImage(overlay, 19.2, 183);
              resolve(canvas.toDataURL('image/jpeg'));
            };
            overlay.src = this.sspaService.toAsset('img/overlay.png');
          }
        });
        source.src = fileReader.result as string;
      });
      fileReader.readAsDataURL(imageFile);
    });
  }

  promptForFiles(accept: string, multiple = false): Promise<FileList> {
    return new Promise<FileList>((resolve, reject) => {
      const fileInput: HTMLInputElement = this.document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = accept;
      fileInput.multiple = multiple;
      fileInput.addEventListener('error', (event) => {
        reject(event.error);
      });
      fileInput.addEventListener('change', () => {
        resolve(fileInput.files);
      });
      fileInput.click();
    });
  }

  public promptForVideo(): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      // make file input element in memory
      const fileInput: HTMLInputElement = this.document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'video/*';
      fileInput.setAttribute('capture', 'camera');
      // fileInput['capture'] = 'camera';
      fileInput.addEventListener('error', (event) => {
        reject(event.error);
      });
      fileInput.addEventListener('change', (event) => {
        resolve(fileInput.files[0]);
      });
      // prompt for video file
      fileInput.click();
    });
  }

  public promptForPDF(): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      // make file input element in memory
      const fileInput: HTMLInputElement = this.document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf';
      fileInput.setAttribute('capture', 'camera');
      // fileInput['capture'] = 'camera';
      fileInput.addEventListener('error', (event) => {
        reject(event.error);
      });
      fileInput.addEventListener('change', (event) => {
        resolve(fileInput.files[0]);
      });
      // prompt for video file
      fileInput.click();
    });
  }

  promptForImage(): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const fileInput: HTMLInputElement = this.document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.addEventListener('error', (event) => {
        reject(event.error);
      });
      fileInput.addEventListener('change', (event) => {
        resolve(fileInput.files[0]);
      });
      fileInput.click();
    });
  }

  public getVideoDuration(videoFile: Blob): Promise<any> {
    const video: HTMLVideoElement = this.document.createElement('video');
    return new Promise<any>((resolve, reject) => {
      video.addEventListener('error', reject);
      video.addEventListener('canplay', (event) => {
        if (video.duration) {
          resolve({
            duration: video.duration * 1000
          });
        } else {
          resolve({
            duration: 0
          });
        }
      });
      if (videoFile.type) {
        video.setAttribute('type', videoFile.type);
      }
      video.preload = 'auto';
      video.src = window.URL.createObjectURL(videoFile);
      video.load();
    });
  }

  resizeThumbnail(blob, type = null): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const source = new Image();
      const canvasWidth = 480;
      let canvasHeight = 270;
      source.onload = (e) => {
        const imgWidth = source.width;
        const imgHeight = source.height;
        const newWidth = canvasWidth;
        const newHeight = (newWidth * imgHeight) / imgWidth;
        canvasHeight = newHeight;
        const canvas: HTMLCanvasElement = this.document.createElement('canvas');
        const context: CanvasRenderingContext2D = canvas.getContext('2d');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        context.drawImage(source, 0, 0, newWidth, newHeight);
        if (!type) {
          resolve(canvas.toDataURL('image/jpeg'));
        }
        if (type == 'pdf') {
          const overlay = new Image();
          overlay.onload = (e) => {
            context.drawImage(overlay, newWidth - 70, newHeight - 85, 60, 75);
            resolve(canvas.toDataURL('image/jpeg'));
          };
          overlay.src = this.sspaService.toAsset('img/pdf_overlay.png');
        }
      };
      source.src = blob;
    });
  }

  resizeImage(blob, width = 300, height = 300): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const source = new Image();
      const canvasWidth = width;
      let canvasHeight = height;
      source.onload = (e) => {
        const imgWidth = source.width;
        const imgHeight = source.height;
        const newWidth = canvasWidth;
        const newHeight = (newWidth * imgHeight) / imgWidth;
        canvasHeight = newHeight;
        const canvas: HTMLCanvasElement = this.document.createElement('canvas');
        const context: CanvasRenderingContext2D = canvas.getContext('2d');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        context.drawImage(source, 0, 0, newWidth, newHeight);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      source.src = blob;
    });
  }

  public generateAvatar(blob: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const source = new Image();
      const canvasWidth = 300;
      const canvasHeight = 300;
      source.onload = (e) => {
        const imgWidth = source.width;
        const imgHeight = source.height;
        let newWidth, newHeight;
        let offX, offY;
        if (imgHeight < imgWidth) {
          newWidth = canvasWidth;
          newHeight = (newWidth * imgHeight) / imgWidth;
          offX = 0;
          offY = (canvasHeight - newHeight) / 2;
        } else {
          newHeight = canvasHeight;
          newWidth = (newHeight * imgWidth) / imgHeight;
          offX = (canvasWidth - newWidth) / 2;
          offY = 0;
        }
        const canvas: HTMLCanvasElement = this.document.createElement('canvas');
        const context: CanvasRenderingContext2D = canvas.getContext('2d');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(source, offX, offY, newWidth, newHeight);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      source.src = blob;
    });
  }

  public loadBase64(file: Blob): Promise<any> {
    const fileReader = new FileReader();
    return new Promise<any>((resolve, reject) => {
      fileReader.addEventListener('error', reject);
      fileReader.addEventListener('load', () => {
        resolve(fileReader.result);
      });
      fileReader.readAsDataURL(file);
    });
  }

  public customTzTime(dateTime: string, time_zone: string): any {
    const timezone = time_zone.replace(':', '.');
    const offset = parseFloat(timezone);
    const date = new Date(dateTime);
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const nd = new Date(utc + 3600000 * offset);
    const year = nd.getFullYear();
    const month = nd.getMonth() + 1;
    const day = nd.getDate();

    const hour = nd.getHours();
    const min = nd.getMinutes();
    const hour_s = hour < 10 ? '0' + hour : hour;
    const min_s = min < 10 ? '0' + min : min;
    const time = `${hour_s}:${min_s}:00.000`;

    return {
      year,
      month,
      day,
      time
    };
  }

  public getMaterials(html: string): any[] {
    const outer: HTMLDivElement = this.document.createElement('div');
    outer.innerHTML = html;
    const materials = outer.querySelectorAll('.material-object');
    if (!materials.length) {
      return [];
    } else {
      const result = [];
      materials.forEach((e) => {
        const materialDom = <HTMLLinkElement>e;
        const href = materialDom.getAttribute('href');
        const type = materialDom.getAttribute('data-type') || 'video';
        const _id = href.replace(/{{|}}/g, '');
        let preview = '';
        const previewImg = materialDom.querySelector('img');
        if (previewImg) {
          preview = previewImg.src;
        }
        const material = { _id, preview, material_type: type || 'video' };
        result.push(material);
      });
      return result;
    }
  }
  public getLandingPages(html: string): any[] {
    const outer: HTMLDivElement = this.document.createElement('div');
    outer.innerHTML = html;
    const landingPages = outer.querySelectorAll('.landing-page-object');
    if (!landingPages.length) {
      return [];
    } else {
      const result = [];
      landingPages.forEach((e) => {
        const materialDom = <HTMLLinkElement>e;
        const href = materialDom.getAttribute('href');
        const type = materialDom.getAttribute('data-type') || 'video';
        const _id = href.replace(/{{|}}/g, '');
        let preview = '';
        const previewImg = materialDom.querySelector('img');
        if (previewImg) {
          preview = previewImg.src;
        }
        const landingPage = { _id, preview, material_type: type || 'video' };
        result.push(landingPage);
      });
      return result;
    }
  }

  public getSMSMaterials(text = ''): any {
    return getIdsOnSMS(text);
  }

  convertEmailContent(html: string): string {
    const outer: HTMLDivElement = this.document.createElement('div');
    outer.innerHTML = html;
    const materials = outer.querySelectorAll('.material-object');
    if (!materials.length) {
      return html;
    } else {
      materials.forEach((e) => {
        const materialDom = <HTMLLinkElement>e;
        const href = materialDom.getAttribute('href');
        if (href.indexOf('{{') === -1 && href.indexOf('}}') === -1) {
          materialDom.setAttribute('href', '{{' + href + '}}');
        }
      });
      return outer.innerHTML;
    }
  }

  convertEmailLandingPageContent(html: string): string {
    const outer: HTMLDivElement = this.document.createElement('div');
    outer.innerHTML = html;
    const materials = outer.querySelectorAll('.landing-page-object');
    if (!materials.length) {
      return html;
    } else {
      materials.forEach((e) => {
        const materialDom = <HTMLLinkElement>e;
        const href = materialDom.getAttribute('href');
        if (href.indexOf('{{') === -1 && href.indexOf('}}') === -1) {
          materialDom.setAttribute('href', '{{' + href + '}}');
        }
      });
      return outer.innerHTML;
    }
  }

  removeTags(text: string): string {
    return text.replace(/<.*?>/gm, '');
  }

  getMaterialType(material: any): string {
    if (material.type || material.material_type) {
      if (
        (material.type && material.type === 'application/pdf') ||
        material.material_type === 'pdf'
      ) {
        return 'PDF';
      } else if (
        (material.type && material.type.includes('image')) ||
        material.material_type === 'image'
      ) {
        return 'Image';
      } else if (
        (material.type &&
          (material.type.includes('video') ||
            material.type.includes('youtube') ||
            material.type.includes('vimeo'))) ||
        material.material_type === 'video'
      ) {
        return 'Video';
      } else {
        return 'Video';
      }
    }
    return 'Video';
  }

  async replaceTokenFunc(email_subject: any, email_content: any) {
    const _contact = this.storeService.selectedContactMainInfo.getValue();
    if (!_contact._id) {
      return;
    }
    const contact = new Contact().deserialize({ ..._contact });

    const res = this.labelService.allLabels.getValue();
    if (contact.label && res.length) {
      const value = _.find(res, (e) => e._id === contact.label);
      contact.label = value?.name;
    } else contact.label = '';

    const garbage = this.userService.garbage.getValue();

    if (garbage.template_tokens && garbage.template_tokens.length > 0) {
      for (let k = 0; k < garbage.template_tokens.length; k++) {
        const token = garbage.template_tokens[k];
        const regex = new RegExp(`\\{${token.name}\\}`, 'gi');
        let value;
        if (token.value !== '') {
          value = token.value;
        } else {
          try {
            const customField = await garbage.additional_fields.find(
              (field) => field.name === token.match_field
            );
            if (customField) {
              value = contact.additional_field
                ? contact.additional_field[token.match_field] || ''
                : '';
            } else {
              value = contact[token.match_field] || '';
            }
          } catch (_) {
            value = '';
          }
        }

        email_content = email_content.replace(regex, value);
        if (email_subject) email_subject = email_subject.replace(regex, value);
      }
    }

    return {
      content: email_content,
      subject: email_subject
    };
  }
}
