import { Component, Inject, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { EmbedInfo, MaterialItem } from '@core/interfaces/resources.interface';
import { environment } from '@environments/environment';
import { MaterialService } from '@services/material.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-create-embeded-material',
  templateUrl: './create-embeded-material.component.html',
  styleUrls: ['./create-embeded-material.component.scss']
})
export class CreateEmbededMaterialComponent implements OnInit {
  isLoading = true;
  videoKey: string;
  userKey: string;

  get source(): string {
    return `${environment.website}/embed/${this.data.material_type}/${this.data._id}`;
  }

  get htmlCode(): string {
    return `<div style="position: relative; aspect-ratio: 16/9;"><iframe style="border: none; position: absolute; top: 0px; bottom: 0px; width: 100%; height: 100%;" src='${this.srcCode}'></iframe></div>`;
  }

  get srcCode(): string {
    return `${environment.website}/embeded/video?u=${this.userKey}&v=${this.videoKey}`;
  }

  get scriptCode(): string {
    return `<script data-source="crmgrow" data-id="${this.userKey}" src="${environment.website}/theme/js/embed-video.js"></script>`;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: MaterialItem,
    private clipboard: Clipboard,
    private toast: ToastrService,
    private materialService: MaterialService
  ) {}

  ngOnInit(): void {
    this.getEmbedInfo();
  }

  private getEmbedInfo() {
    this.isLoading = true;
    this.materialService
      .getEmbedInfo(this.data._id)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res: EmbedInfo) => {
        this.videoKey = res.data?.videoKey;
        this.userKey = res.data?.userKey;
      });
  }

  copyHTMLCode(): void {
    this.clipboard.copy(this.htmlCode);
    this.toast.success('Copied the embed html(iframe) code');
  }

  copyScriptCode(): void {
    this.clipboard.copy(this.scriptCode);
    this.toast.success('Copied the embed javascript code');
  }

  copySrcCode(): void {
    this.clipboard.copy(this.srcCode);
    this.toast.success('Copied the iframe link address only');
  }
}
