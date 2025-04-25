import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { Subscription } from 'rxjs';
import { saveAs } from 'file-saver';
import moment from 'moment-timezone';
import { TabItem } from '@app/utils/data.types';
import { LandingPageService } from '@app/services/landing-page.service';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { MIN_ROW_COUNT } from '@app/constants/variable.constants';
import { LandingPageSendComponent } from '@app/components/landing-page-send/landing-page-send.component';
import { ToastrService } from 'ngx-toastr';
import { Clipboard } from '@angular/cdk/clipboard';
import { DialogSettings } from '@constants/variable.constants';

const delay = () => {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, 3000);
  });
};

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageDetailComponent implements OnInit {
  readonly MaterialSiteBaseDomain = environment.website;
  pageDetail: any;
  responseColumns: string[] = [
    'contact_name',
    'contact_label',
    'created_at',
    'form_name'
  ];
  formColumns: string[] = ['form_name', 'second', 'automation', 'tags'];
  viewsColumns: string[] = [
    'name',
    'label',
    'email',
    'cell_phone',
    'title',
    'progress',
    'watched_date'
  ];
  isLoading = true;
  isLoadingFormTracks = true;
  isLoadingMaterialTracks = true;
  isPublishing = false;
  tabs: TabItem[] = [
    { label: 'Views', id: 'views', icon: '' },
    { label: 'Response', id: 'response', icon: '' }
  ];

  selectedTab: TabItem = this.tabs[0];

  isPublished = false;

  forms = [];
  views = [];

  formTracks = [];
  formFields = [];

  routeSubscription: Subscription;
  publishSubscription: Subscription;

  readonly PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];

  readonly MIN_ROW_COUNT = MIN_ROW_COUNT;

  pageSizeMaterial = this.PAGE_COUNTS[1];
  pageMaterial = 1;

  totalCountMaterial = 0;

  pageSizeForm = this.PAGE_COUNTS[1];
  pageForm = 1;

  totalCountForm = 0;

  constructor(
    private route: ActivatedRoute,
    private landingPageService: LandingPageService,
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private toast: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe(async (params) => {
      this.isLoading = true;
      this.landingPageService.getById(params['id']).subscribe((res) => {
        this.isLoading = false;
        if (res && res.status && res.data) {
          this.pageDetail = res.data;
          this.isPublished = this.pageDetail.is_published;
          if (res.data.forms && res.data.forms.length > 0) {
            this.forms = res.data.forms.map((e) => {
              const form_settings = res.data.form_settings;
              const key = e._id;
              let value = 0;
              for (let i = 0; i < form_settings.length; i++) {
                if (form_settings[i][key]) {
                  value = form_settings[i][key];
                  break;
                }
              }
              return {
                ...e,
                second: value
              };
            });
          }
        }
      });
      this.getMaterialTracksById(params['id']);
      this.getFormTracksById(params['id']);
    });
  }

  getMaterialTracksById(id = this.pageDetail._id) {
    this.isLoadingMaterialTracks = true;
    const skip = this.pageSizeMaterial.id * (this.pageMaterial - 1);
    this.landingPageService
      .getMaterialTracksById(id, { skip, count: this.pageSizeMaterial.id })
      .subscribe((res) => {
        this.isLoadingMaterialTracks = false;
        if (res && res.status) {
          if (res.count) {
            this.totalCountMaterial = res.count;
          }
          this.views = res.data.map((e) => {
            let title = '';
            if (e.type === 'video_trackers') {
              const video = e.videos.find(
                (v) => v._id === e.video_trackers?.video
              );
              title = video?.title || 'UnNamed';
            } else if (e.type === 'image_trackers') {
              const image = e.images.find(
                (v) => v._id === e.image_trackers?.image[0]
              );
              title = image?.title || 'UnNamed';
            } else if (e.type === 'pdf_trackers') {
              const pdf = e.pdfs.find((v) => v._id === e.pdf_trackers?.pdf[0]);
              title = pdf?.title || 'UnNamed';
            }
            return { ...e, title };
          });
        }
      });
  }

  getFormTracksById(id = this.pageDetail._id) {
    this.isLoadingFormTracks = true;
    const skip = this.pageSizeForm.id * (this.pageForm - 1);
    this.landingPageService
      .getFormTracksById(id, { skip, count: this.pageSizeForm.id })
      .subscribe((res) => {
        this.isLoadingFormTracks = false;
        if (res && res.status) {
          if (res.count) {
            this.totalCountForm = res.count;
          }
          this.formTracks = res.data;
          if (!this.formFields.length) {
            this.formFields = [
              ...new Set(
                this.formTracks.flatMap((obj) => Object.keys(obj.data))
              )
            ];

            this.formFields = this.formFields.filter((e) => {
              return (
                e !== 'activity' && e !== 'contact' && e !== 'landing_page'
              );
            });
            this.responseColumns = [
              ...this.responseColumns,
              ...this.formFields
            ];
          }
        }
      });
  }

  getAvatarName(contact): any {
    if (contact?.first_name && contact?.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact?.first_name && !contact?.last_name) {
      return contact.first_name[0];
    } else if (!contact?.first_name && contact?.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }

  getContactName(contact): any {
    if (contact?._id) {
      if (contact?.first_name && contact?.last_name) {
        return contact.first_name + ' ' + contact.last_name;
      } else if (contact?.first_name) {
        return contact.first_name;
      } else if (contact?.last_name) {
        return contact.last_name;
      }
      return 'Unnamed Contact';
    }
    return 'Anonymous';
  }

  getFormHeader(field): string {
    if (field === 'cell_phone') {
      return 'Primary Phone Number';
    }
    if (field === 'email') {
      return 'Primary Email';
    }
    return field?.replace('_', ' ') || 'No Name';
  }

  createCSV(): void {
    if (!this.pageDetail || !this.formTracks.length) {
      return;
    }
    const csv = this.formTracks.map((row) => {
      return this.responseColumns
        .map((fieldName) => {
          if (fieldName === 'contact_name') {
            return this.getContactName(row.contact);
          }
          if (fieldName === 'created_at') {
            return moment(row.created_at)?.format('MMM DD hh:mm A') || '';
          }
          if (fieldName === 'form_name') {
            return row.lead_form?.name || '';
          }
          const index = this.formFields.findIndex((e) => e === fieldName);

          if (index >= 0) {
            return row.data[fieldName]?.replace(',', ' ') || '';
          }
          return '';
        })
        .join(',');
    });
    csv.unshift(
      this.responseColumns
        .map((fName: string) => {
          if (fName === 'email') fName = 'Primary Email';
          else if (fName === 'cell_phone') fName = 'Primary Phone Number';
          return fName.replace(',', ' ').replace('_', ' ');
        })
        .join(',')
    );
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], { type: 'text/csv' });
    const date = new Date();
    let prefix = 'crmgrow';
    if (environment.isSspa) {
      prefix = 'vortex';
    }
    const fileName = `${prefix} Form Tracks (${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()} ${date.getHours()}-${date.getMinutes()})`;
    saveAs(blob, fileName + '.csv');
  }

  getTheme(): string {
    if (this.pageDetail.theme === '1') {
      return 'Simple';
    } else if (this.pageDetail.theme === '2') {
      return 'Highlight';
    } else if (this.pageDetail.theme === '3') {
      return 'Calendly';
    } else {
      return 'None';
    }
  }

  getProgress(data): string {
    if (data) {
      const type = data.type;
      if (type && data[type]) {
        if (type === 'video_trackers') {
          let progress = 0;
          const tracker = data[type];
          const video = data.videos.find((e) => e._id === tracker?.video);
          if (
            tracker &&
            tracker.duration &&
            tracker.duration !== 0 &&
            video &&
            video.duration !== 0
          ) {
            if (tracker.full_watched) {
              progress = 100;
            } else {
              progress = parseFloat(
                ((tracker.duration / video.duration) * 100).toFixed(1)
              );
            }
          }
          return `${progress} %`;
        } else if (type === 'pdf_trackers') {
          const tracker = data[type];
          return `${tracker.read_pages} / ${tracker.total_pages}`;
        }
      }
    }
    return '';
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  changeFormPage(page: number): void {
    this.pageForm = page;
    this.getFormTracksById();
  }

  onOverFormPages(page: number): void {
    this.changeFormPage(page);
  }

  changeMaterialPage(page: number): void {
    this.pageMaterial = page;
    this.getMaterialTracksById();
  }

  onOverMaterialPages(page: number): void {
    this.changeMaterialPage(page);
  }

  changePageSize(size: any, type: string): void {
    if (type === 'material') {
      const newPage =
        Math.floor(
          (this.pageSizeMaterial.id * (this.pageMaterial - 1)) / size.id
        ) + 1;
      this.pageSizeMaterial = size;
      this.changeMaterialPage(newPage);
    } else {
      const newPage =
        Math.floor((this.pageSizeForm.id * (this.pageForm - 1)) / size.id) + 1;
      this.pageSizeForm = size;
      this.changeFormPage(newPage);
    }
  }

  onPublish(event): void {
    const action = event.target.checked;

    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '480px',
        data: {
          title: action
            ? 'Publish and Update Landing Page?'
            : 'Unpublish this Page?',
          message: action
            ? 'Landing Page views and form responses will be reset once you publish landing page updates. Are you sure you want to continue?'
            : `Are you sure you want to unpublish this landing page (${this.pageDetail.name})?`,
          confirmLabel: 'Yes, continue',
          cancelLabel: 'Cancel',
          mode: action === false ? 'warning' : ''
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isPublished = action;
          this.publishSubscription && this.publishSubscription.unsubscribe();
          this.publishSubscription = this.landingPageService
            .update(this.pageDetail._id, { is_published: this.isPublished })
            .subscribe((data) => {
              if (data?.status) {
                this.isPublished = action;
              } else {
                this.isPublished = !action;
              }
            });
        } else {
          this.isPublished = !action;
        }
      });
  }

  openSend(page: any) {
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

  copyLink(id: string): void {
    const url = environment.website + '/page/' + id;
    this.clipboard.copy(url);
    this.toast.success('Copied the link to clipboard');
  }

  delete(id: string): void {
    this.landingPageService.delete(id).subscribe(() => {
      this.router.navigate(['lead-hub/landing-pages']);
    });
  }

  handleDelete(page: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete Landing Page?',
          message: `Are you sure you want to delete this landing page (${page.name}) ?`,
          confirmLabel: 'Yes, Delete',
          cancelLabel: 'Cancel',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((answer) => {
        if (answer) {
          this.delete(page._id);
        }
      });
  }
}
