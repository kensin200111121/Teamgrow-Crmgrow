import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  Component,
  Inject,
  OnInit,
  HostListener
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { concat, interval, Subscription } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { LangRegex, LANGUAGES } from '@constants/variable.constants';
import { LangService } from '@services/lang.service';
import { environment } from '@environments/environment';
import moment from 'moment-timezone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = environment.isSspa ? 'Vortex' : 'crmgrow';
  langSubscription: Subscription;

  constructor(
    private appRef: ApplicationRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private translateService: TranslateService,
    private langService: LangService,
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.updateLocalStoragePrototype();
    this.langSubscription && this.langSubscription.unsubscribe();
    this.langSubscription = this.langService.language$.subscribe((lang) => {
      this.translateService.use(lang || 'en');
    });

    this.translateService.addLangs(LANGUAGES);
    this.translateService.setDefaultLang('en');
    const browserLang = this.translateService.getBrowserLang();
    const storageLang = localStorage.getCrmItem('lang');

    this.langService.getCountry().subscribe((res) => {
      if (res) {
        const data = res
          .trim()
          .split('\n')
          .reduce(function (obj, pair) {
            pair = pair.split('=');
            return (obj[pair[0]] = pair[1]), obj;
          }, {});
        const localLang = data.loc.toLowerCase();
        const lang =
          storageLang && storageLang.match(LangRegex)
            ? storageLang
            : localLang.match(LangRegex)
            ? localLang
            : browserLang.match(LangRegex)
            ? browserLang
            : 'en';
        this.langService.changeLang(lang);
      } else {
        const lang =
          storageLang && storageLang.match(LangRegex)
            ? storageLang
            : browserLang.match(LangRegex)
            ? browserLang
            : 'en';
        this.langService.changeLang(lang);
      }
    });

    // Check the app update stats:
    // 1. Check the App is statble status
    // 2. every 6 hours, check the update status
    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable === true)
    );
    const everySixHour$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHour$);
    everySixHoursOnceAppIsStable$.subscribe(() => {
      try {
        swUpdate.checkForUpdate();
      } catch (err) {
        console.log('Could not check the app update status');
      }
    });

    // Check the avaiable possible of the app update status
    swUpdate.available.subscribe((event) => {
      this.snackBar
        .open(
          `There is an update to crmgrow.  Please click Update to run the latest version.`,
          'Update',
          {
            verticalPosition: 'bottom',
            horizontalPosition: 'left'
          }
        )
        .onAction()
        .subscribe(() => {
          this.updateApp();
        });
    });
    // Check the updated status of the app
    swUpdate.activated.subscribe((event) => {
      this.snackBar.open(
        `Thank you. crmgrow has been updated successfully.`,
        'Close',
        {
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        }
      );
    });

    window.onstorage = (e) => {
      if (e && e.key === 'token') {
        location.reload();
      }
    };

    moment.tz.setDefault(moment.tz.guess());
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    const modals_calendar = document.querySelectorAll('.event-container');
    modals_calendar.forEach((modal) => {
      (modal as HTMLElement).style.display = 'none';
    });
    const modals = document.querySelectorAll('.label-panel'); // Get all elements with class `.label-panel
    modals.forEach((modal) => {
      (modal as HTMLElement).style.display = 'none'; // Hide modal on scroll
    });
  }

  ngOnInit(): void {
    this.titleHandle();

    if (navigator.userAgent.indexOf('SamsungBrowser') !== -1) {
      this.document.body.classList.add('samsung-app');
    }
  }

  titleHandle(): void {
    const appTitle = this.titleService.getTitle();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;
          while (child.firstChild) {
            child = child.firstChild;
          }
          if (child.snapshot.data['title']) {
            return child.snapshot.data['title'];
          }
          return appTitle;
        })
      )
      .subscribe((ttl: string) => {
        if (environment.isSspa) {
          this.titleService.setTitle(this.title);
        } else {
          const title = ttl ? `${ttl} | ${this.title}` : this.title;
          this.titleService.setTitle(title);
        }
      });
  }

  /**
   * Update the app to new version
   */
  updateApp(): void {
    this.swUpdate.activateUpdate().then(() => {
      document.location.reload();
    });
  }

  private updateLocalStoragePrototype() {
    localStorage.__proto__.setCrmItem = (key, value) => {
      let itemKey = key;
      if (
        key !== 'u_id' &&
        key !== 'token' &&
        key !== 'contact_columns' &&
        key !== 'task_columns' &&
        key !== 'activity_columns'
      ) {
        itemKey = 'crm.' + key;
      }
      localStorage.setItem(itemKey, value);
    };
    localStorage.__proto__.getCrmItem = (key) => {
      let itemKey = key;
      if (
        key !== 'u_id' &&
        key !== 'token' &&
        key !== 'contact_columns' &&
        key !== 'task_columns' &&
        key !== 'activity_columns'
      ) {
        itemKey = 'crm.' + key;
      }
      const value = localStorage.getItem(itemKey);
      return value;
    };
    localStorage.__proto__.removeCrmItem = (key) => {
      let itemKey = key;
      if (
        key !== 'u_id' &&
        key !== 'token' &&
        key !== 'contact_columns' &&
        key !== 'task_columns' &&
        key !== 'activity_columns'
      ) {
        itemKey = 'crm.' + key;
      }
      localStorage.removeItem(itemKey);
    };
  }
}
