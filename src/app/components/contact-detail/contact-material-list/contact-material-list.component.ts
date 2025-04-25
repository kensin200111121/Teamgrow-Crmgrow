import { Component, OnInit, Input } from '@angular/core';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-contact-material-list',
  templateUrl: './contact-material-list.component.html',
  styleUrls: ['./contact-material-list.component.scss']
})
export class ContactMaterialListComponent implements OnInit {
  _materials: { videos: any[]; pdfs: any[]; images: any[] } = {
    videos: [],
    pdfs: [],
    images: []
  };
  uniqueMaterial = null;
  SITE = environment.website;

  @Input() set materials(value: { videos: any[]; pdfs: any[]; images: any[] }) {
    this._materials = value;
    this.initLoadMaterial();
  }

  constructor() {}

  ngOnInit(): void {}

  initLoadMaterial() {
    const includeOnlyOneMaterial =
      this._materials.images.length +
        this._materials.pdfs.length +
        this._materials.videos.length ===
      1;
    if (includeOnlyOneMaterial) {
      if (this._materials.images.length === 1) {
        this.uniqueMaterial = {
          materialType: 'image',
          ...this._materials.images[0]
        };
      } else if (this._materials.videos.length === 1) {
        this.uniqueMaterial = {
          materialType: 'video',
          ...this._materials.videos[0]
        };
      } else if (this._materials.pdfs.length === 1) {
        this.uniqueMaterial = {
          materialType: 'pdf',
          ...this._materials.pdfs[0]
        };
      }
    }
  }
}
