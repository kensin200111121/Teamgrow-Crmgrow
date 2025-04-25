import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialService } from '@app/services/material.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard';
import { LandingPageSendComponent } from '@app/components/landing-page-send/landing-page-send.component';
import { Router } from '@angular/router';

interface LandingPagePreview {
  _id: string;
  title: string;
  desc: string;
  forms: Array<{ _id: string; title: string }>;
  automations: Array<{ _id: string; title: string }>;
  material?: {
    _id: string;
    title: string;
    preview?: string;
    site_image?: string;
    thumbnail: string;
  };
}

@Component({
  selector: 'app-material-landing-page-list',
  templateUrl: './material-landing-page-list.component.html',
  styleUrls: ['./material-landing-page-list.component.scss']
})
export class MaterialLandingPageListComponent implements OnInit {
  readonly MaterialBaseDomain = environment.website;
  landingPages: LandingPagePreview[] = [];
  isLoading = true;
  materialIdType: { _id: string; type: string };
  trackCount = {
    contactCounts: {},
    responseCounts: {},
    viewCounts: {}
  };

  readonly linkForCreateMaterialPath = '/lead-hub/landing-pages/create';
  linkForCreateMaterialQueryParams: { material: string; type: string };

  @Input() set setMaterialIdType(data) {
    this.materialIdType = data;
    this.setCreateMaterialLink();
    setTimeout(() => {
      this.loadData();
    }, 1000);
  }

  constructor(
    private materialService: MaterialService,
    protected dialog: MatDialog,
    private clipboard: Clipboard,
    private toast: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  loadData() {
    this.isLoading = true;
    const { _id, type } = this.materialIdType;
    this.materialService
      .getLandingPagesOnMaterial({ id: _id, type })
      .subscribe((res) => {
        this.isLoading = false;
        this.landingPages = (res ?? []).map((item) => {
          const forms = (item?.forms ?? []).map((form) => {
            return { _id: form._id, title: form.name };
          });
          const automations = [];
          (item?.forms ?? []).forEach((form) => {
            if (form.automation?._id) {
              automations.push({
                _id: form.automation._id,
                title: form.automation.title
              });
            }
          });
          return {
            _id: item._id,
            name: item.name,
            description: item.description,
            forms,
            automations,
            is_published: item.is_published,
            material: item.material
          };
        });
      });

    this.materialService
      .getLandingPageTrackCountOnMaterial({
        materialId: _id,
        materialType: type
      })
      .subscribe((res) => {
        const contactCounts = (res?.contactCounts ?? []).reduce((result, e) => {
          return { ...result, [e._id]: e.count };
        }, {});
        const responseCounts = (res?.responseCounts ?? []).reduce(
          (result, e) => {
            return { ...result, [e._id]: e.count };
          },
          {}
        );
        const viewCounts = (res?.viewCounts ?? []).reduce((result, e) => {
          return { ...result, [e._id]: e.count };
        }, {});
        this.trackCount = { contactCounts, responseCounts, viewCounts };
      });
  }

  send(page) {
    this.dialog.open(LandingPageSendComponent, {
      position: { top: '5vh' },
      width: '96vw',
      maxWidth: '800px',
      disableClose: true,
      data: {
        pages: [page],
        type: 'email'
      }
    });
  }

  copyLink(page): void {
    const url = environment.website + '/page/' + page._id;
    this.clipboard.copy(url);
    this.toast.success('Copied the link to clipboard');
  }

  private setCreateMaterialLink() {
    this.linkForCreateMaterialQueryParams = {
      material: this.materialIdType._id,
      type: this.materialIdType.type
    };
  }
}
