import { SspaService } from './sspa.service';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { from, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { loadBase64 } from '@app/helper';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  // constructor() {}
  constructor(
    private sanitizer: DomSanitizer,
    public sspaService: SspaService
  ) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = this.sspaService.toAsset('js/pdf.worker.js');
  }

  public getPdfThumbnail(pdfUrl: string): Promise<any> {
    return new Promise((resolve, reject) => {
      pdfjsLib.getDocument(pdfUrl).promise.then((pdf) => {
        pdf.getPage(1).then((page) => {
          const canvas = document.createElement('canvas');
          const viewport = page.getViewport({ scale: 2 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          page
            .render({
              canvasContext: canvas.getContext(
                '2d'
              ) as CanvasRenderingContext2D,
              viewport
            })
            .promise.then(() => {
              canvas.toBlob(
                (blob: Blob) => {
                  resolve(blob);
                  // loadBase64(blob).then((b64) => {
                  //   resolve(b64);
                  // });
                },
                'image/jpeg',
                0.75
              );
              console.log('canvas', canvas);
            });
        });
      });
    });
    // return from(pdfjsLib.getDocument(pdfUrl)).pipe(
    //   take(1),
    //   switchMap((pdf) => from(pdf.getPage(1))),
    //   switchMap((page) => {
    //     const canvas = document.createElement('canvas');
    //     const viewport = page.getViewport({ scale: 2 });
    //     canvas.height = viewport.height;
    //     canvas.width = viewport.width;

    //     return from(
    //       page.render({
    //         canvasContext: canvas.getContext('2d') as CanvasRenderingContext2D,
    //         viewport
    //       }).promise
    //     ).pipe(map(() => canvas));
    //   }),
    //   switchMap((canvas) => {
    //     return new Observable<SafeUrl>((observer) => {
    //       canvas.toBlob(
    //         (blob) => {
    //           if (blob) {
    //             observer.next(
    //               this.sanitizer.bypassSecurityTrustUrl(
    //                 URL.createObjectURL(blob)
    //               )
    //             );
    //             observer.complete();
    //           }
    //         },
    //         'image/jpeg',
    //         0.75
    //       );
    //     });
    //   })
    // );
  }
}
