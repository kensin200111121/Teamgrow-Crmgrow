import { Component, OnInit } from '@angular/core';
import { Subscription, forkJoin, from } from 'rxjs';
import { UserService } from '@services/user.service';
import { Cookie } from '@utils/cookie';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastrService } from 'ngx-toastr';
import { STATUS } from '@constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';
import { NewLandingPageComponent } from '@app/components/new-landing-page/new-landing-page.component';
import { IPageTemplate } from '@app/core/interfaces/page-template.interface';
import { IPageSite } from '@app/core/interfaces/page-site.interface';
import { NotifyComponent } from '@app/components/notify/notify.component';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-page-builder',
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
  // Page builder api base url
  builder_token = '';
  pages = [];
  isLoading = false;
  callStatus = {};

  siteVolumn = 0;
  STATUS = STATUS;
  profileSubscription: Subscription;
  loadSubscription: Subscription;
  PageBuilder = environment.pageBuilder;
  PageBuilderApi = environment.pageBuilderAPI;
  hasConvrrt = false;

  private templates: IPageTemplate[] = [];

  get isReadyTemplates(): boolean {
    return !!this.templates.length;
  }

  constructor(
    public userService: UserService,
    private clipboard: Clipboard,
    private toastService: ToastrService,
    private dialog: MatDialog
  ) {
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user?._id) {
        if (user.landing_page_info?.is_enabled) {
          this.siteVolumn = user.landing_page_info?.max_count;
        }

        this.loadSites();
      }
    });

    this.userService.loadTemplates().subscribe((data: IPageTemplate[]) => {
      const defaultIndex = data.findIndex((t) => t.id === 1);
      if (defaultIndex > 0) {
        const defaultTemplate = data[defaultIndex];
        defaultTemplate.image = 'assets/img/blank_template.png';
        data.splice(defaultIndex, 1);
        data.unshift(defaultTemplate);
      }
      this.templates = data;
    });
  }

  ngOnInit(): void {}

  loadSites(): void {
    this.builder_token = Cookie.get('_pages_session');
    this.isLoading = true;

    forkJoin({
      convrrt: from(this.userService.loadPagesImpl(this.builder_token)),
      ucraft: from(this.userService.loadSites(this.builder_token))
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.pages = [];

        if (res.convrrt) {
          this.pages = res.ucraft || [];
        }

        const convrrt = res.convrrt as [];

        if (convrrt) {
          this.pages = [...this.pages, ...convrrt];
        }

        this.hasConvrrt = convrrt.length > 0;

        this.pages.forEach((e) => {
          if (e.editorUrl && e.editorUrl.startsWith(this.PageBuilderApi)) {
            e.editorUrl = e.editorUrl.replace(
              this.PageBuilderApi,
              this.PageBuilder
            );
          }
          if (e.previewUrl && e.previewUrl.startsWith(this.PageBuilderApi)) {
            e.previewUrl = e.previewUrl.replace(
              this.PageBuilderApi,
              this.PageBuilder
            );
          }
        });
      }
    });
  }

  openNewPageDlg(): void {
    if (this.siteVolumn <= this.pages.length) {
      this.dialog.open(NotifyComponent, {
        width: '100vw',
        maxWidth: '400px',
        data: {
          title: 'Landing Page Limitation',
          message: `You can create only ${this.siteVolumn} pages. Already you reached to this count.`
        }
      });
      return;
    }

    this.dialog
      .open(NewLandingPageComponent, {
        width: '100vw',
        maxWidth: '800px',
        data: this.templates
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          const planAlias = 'website-monthly';
          const creatorPageLink = `https://accounts.crmgrow.cloud/edit-site/${planAlias}/${data.template}/${data.name}?token=${this.builder_token}`;
          const dom = document.createElement('a');
          dom.href = creatorPageLink;
          dom.target = '_blank';
          dom.click();
          setTimeout(() => {
            this.loadSites();
          }, 60000);
        }
      });
  }

  editSite(site): void {
    const planAlias = 'website-monthly';
    const creatorPageLink = `https://accounts.crmgrow.cloud/edit-site/${planAlias}/${site.templateId}/${site.name}?token=${this.builder_token}`;
    const dom = document.createElement('a');
    dom.href = creatorPageLink;
    dom.target = '_blank';
    dom.click();
  }

  deleteSite(site): void {
    this.callStatus[site.id] = 'Deleting site...';
    if (this.builder_token) {
      if (site.site) {
        this.userService
          .removeSite(site.site, this.builder_token)
          .subscribe((res) => {
            delete this.callStatus[site.id];
            if (!res) {
              return;
            }
            this.toastService.success('Site is removed successfully');
            const pos = this.pages.findIndex((e) => e.id === site.id);
            if (pos !== -1) {
              this.pages.splice(pos, 1);
            }
          });
      } else {
        this.userService.deleteSite(this.builder_token, site.id).then((res) => {
          delete this.callStatus[site.id];
          if (res.errors) {
            this.toastService.error(
              res.errors[0]?.message ||
                res.errors?.message ||
                res.errors ||
                'Unknown third party error.'
            );
            return;
          }
          this.toastService.success('Site is removed successfully');
          const pos = this.pages.findIndex((e) => e.id === site.id);
          if (pos !== -1) {
            this.pages.splice(pos, 1);
          }
        });
      }
    }
  }
  
  copySite(site): void {
    this.clipboard.copy(site.site || site.siteUrl);
    this.toastService.success('Copied site address.');
  }

  publishSite(site): void {
    const token = Cookie.get('_pages_session');
    if (token) {
      this.callStatus[site.id] = 'Publishing site...';
      this.userService.publishSite(token, site.id).then((res) => {
        delete this.callStatus[site.id];
        if (res.errors) {
          this.toastService.error(
            res.errors[0]?.message ||
              res.errors?.message ||
              res.errors ||
              'Unknown third party error.'
          );
          return;
        }
        site.state = 'published';
      });
    }
  }
}

@Component({
  selector: 'app-page-builder-convrrt',
  templateUrl: './page-builder-convrrt.component.html',
  styleUrls: ['./page-builder-convrrt.component.scss']
})
export class PageBuilderConvrrtComponent implements OnInit {
  // Page builder api base url
  PageBuilder = environment.pageBuilder;
  PageBuilderApi = environment.pageBuilderAPI;
  builer_token = '';
  pages = [];
  isLoading = false;
  callStatus = {};

  profileSubscription: Subscription;
  siteVolumn = 0;
  STATUS = STATUS;
  loadSubscription: Subscription;
  constructor(
    public userService: UserService,
    private clipboard: Clipboard,
    private toastService: ToastrService
  ) {
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user?._id) {
        if (user.landing_page_info?.is_enabled) {
          this.siteVolumn = user.landing_page_info?.max_count;
        }
      }
    });
  }

  ngOnInit(): void {
    this.builer_token = Cookie.get('_pages_session');
    if (this.builer_token) {
      this.userService.loadPages(this.builer_token, true);
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.userService.pages$.subscribe((res) => {
        if (res['errors']) {
          this.toastService.error(
            res['errors'][0]?.message ||
              res['errors']?.message ||
              res['errors'] ||
              'Unknown third party error.'
          );
          return;
        } else {
          this.pages = res || [];
          this.pages.forEach((e) => {
            if (e.editorUrl && e.editorUrl.startsWith(this.PageBuilderApi)) {
              e.editorUrl = e.editorUrl.replace(
                this.PageBuilderApi,
                this.PageBuilder
              );
            }
            if (e.previewUrl && e.previewUrl.startsWith(this.PageBuilderApi)) {
              e.previewUrl = e.previewUrl.replace(
                this.PageBuilderApi,
                this.PageBuilder
              );
            }
          });
        }
      });
    }
  }

  editSite(): void {}

  loadTemplate(): void {}

  deleteSite(site): void {
    const token = Cookie.get('_pages_session');
    if (token) {
      this.callStatus[site.id] = 'Deleting site...';
      this.userService.deleteSite(token, site.id).then((res) => {
        delete this.callStatus[site.id];
        if (res.errors) {
          this.toastService.error(
            res.errors[0]?.message ||
              res.errors?.message ||
              res.errors ||
              'Unknown third party error.'
          );
          return;
        }
        this.toastService.success('Site is removed successfully');
        const pos = this.pages.findIndex((e) => e.id === site.id);
        if (pos !== -1) {
          this.pages.splice(pos, 1);
          this.userService.pages.next(this.pages);
        }
      });
    }
  }

  publishSite(site): void {
    const token = Cookie.get('_pages_session');
    if (token) {
      this.callStatus[site.id] = 'Publishing site...';
      this.userService.publishSite(token, site.id).then((res) => {
        delete this.callStatus[site.id];
        if (res.errors) {
          this.toastService.error(
            res.errors[0]?.message ||
              res.errors?.message ||
              res.errors ||
              'Unknown third party error.'
          );
          return;
        }
        site.state = 'published';
      });
    }
  }

  copySite(site): void {
    this.clipboard.copy(site.siteUrl);
    this.toastService.success('Copied site address.');
  }
}
