import { Component, OnInit } from '@angular/core';
import { TabItem } from '@utils/data.types';
import { LandingPageService } from '@app/services/landing-page.service';
import { MatDialog } from '@angular/material/dialog';
import { LandingPageSendComponent } from '@app/components/landing-page-send/landing-page-send.component';
import { Clipboard } from '@angular/cdk/clipboard';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { DialogSettings } from '@constants/variable.constants';
import { SspaService } from '../../services/sspa.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-landing-pages',
  templateUrl: './landing-pages.component.html',
  styleUrls: ['./landing-pages.component.scss']
})
export class LandingPagesComponent implements OnInit {
  tabs: TabItem[] = [
    { label: 'Published', id: 'published', icon: '' },
    { label: 'Unpublished', id: 'unpublished', icon: '' }
  ];
  MaterialBaseDomain = environment.website;
  isLoading = false;
  selectedTab = this.tabs[0];
  publishedPages = [];
  unpublishedPages = [];
  trackCount = [];
  responseCounts = {};
  contactCounts = {};
  viewCounts = {};

  get isPublish(): boolean {
    return this.selectedTab?.id === 'published';
  }

  get pages() {
    return this.selectedTab?.id === 'published'
      ? this.publishedPages
      : this.unpublishedPages;
  }
  constructor(
    private landingPageService: LandingPageService,
    protected dialog: MatDialog,
    private clipboard: Clipboard,
    private toast: ToastrService,
    private route: ActivatedRoute,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.loadPublish();
    this.loadUnpublish();
    this.landingPageService.loadTrackCounts().subscribe((data) => {
      if (data.status) {
        this.trackCount = data.data;
        data.data.contactCounts.map((contactCount: any) => {
          this.contactCounts[contactCount._id] = contactCount.count;
        });
        data.data.responseCounts.map((resCount: any) => {
          this.responseCounts[resCount._id] = resCount.count;
        });
        data.data.viewCounts.map((viewCount: any) => {
          this.viewCounts[viewCount._id] = viewCount.count;
        });
      }
    });
    this.route.paramMap.subscribe((params) => {
      const isPublish = params.get('publish'); // Get the 'id' parameter
      if (isPublish === 'false') {
        this.selectedTab = this.tabs[1];
      }
    });
  }

  loadPublish(): void {
    this.isLoading = true;
    this.landingPageService.loadPublishedPages().subscribe((data) => {
      if (data.status) {
        this.publishedPages = this.getAutomation(data.data);
        this.isLoading = false;
      } else {
        this.isLoading = false;
      }
    });
  }

  loadUnpublish(): void {
    this.isLoading = true;
    this.landingPageService.loadUnpublishedPages().subscribe((data) => {
      if (data.status) {
        this.unpublishedPages = this.getAutomation(data.data);
        this.isLoading = false;
      } else this.isLoading = false;
    });
  }

  getAutomation(data: any) {
    return data.map((item: any) => {
      if (item.forms) {
        let automationNumber = 0;
        item['automations'] = [];
        item.forms.map((form: any) => {
          if (form.automation) {
            item['automations'].push(form.automation);
            automationNumber++;
          }
        });
        item['automationNumber'] = automationNumber;
      }

      return item;
    });
  }

  changeTab(tab: TabItem) {
    this.selectedTab = tab;
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

  publish(page: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Publish Landing Page?',
          message: `Are you sure you want to publish this landing page (${page.name})?`,
          confirmLabel: 'Yes, Publish',
          cancelLabel: 'Cancel'
        }
      })
      .afterClosed()
      .subscribe((answer) => {
        if (answer) {
          this.landingPageService
            .update(page._id, { is_published: true })
            .subscribe((data) => {
              if (data.status) {
                this.loadPublish();
                this.loadUnpublish();
                this.changeTab(this.tabs[0]);
              }
            });
        }
      });
  }

  unpublish(page: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Unpublish Landing Page?',
          message: `Are you sure you want to unpublish this landing page (${page.name})?`,
          confirmLabel: 'Yes, Unpublish',
          cancelLabel: 'Cancel',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((answer) => {
        if (answer) {
          this.landingPageService
            .update(page._id, { is_published: false })
            .subscribe((data) => {
              if (data.status) {
                this.loadPublish();
                this.loadUnpublish();
                this.changeTab(this.tabs[1]);
              }
            });
        }
      });
  }

  delete(id: string): void {
    this.landingPageService.delete(id).subscribe(() => {
      if (this.isPublish) this.loadPublish();
      else this.loadUnpublish();
    });
  }

  handleDelete(page: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete Landing Page?',
          message: `Are you sure you want to delete this landing page (${page.name})?`,
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
