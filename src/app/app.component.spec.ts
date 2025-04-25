import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { LangService } from '@services/lang.service';
import { Subject, of } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ApplicationRef } from '@angular/core';
import moment from 'moment-timezone';
import { environment } from '@environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

class MockLangService {
  language$ = new Subject<string>();
  changeLang = jasmine.createSpy('changeLang');
  getCountry = jasmine.createSpy('getCountry').and.returnValue(of('loc=en'));
}

class MockSwUpdate {
  available = new Subject<any>();
  activated = new Subject<any>();
  checkForUpdate = jasmine.createSpy('checkForUpdate');
  activateUpdate = jasmine
    .createSpy('activateUpdate')
    .and.returnValue(Promise.resolve());
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let langService: MockLangService;
  let swUpdate: MockSwUpdate;
  let titleService: Title;
  let snackBar: MatSnackBar;
  let routerEventsSubject: Subject<any>;

  beforeEach(async () => {
    routerEventsSubject = new Subject();

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot(),
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: LangService, useClass: MockLangService },
        { provide: SwUpdate, useClass: MockSwUpdate },
        Title,
        ApplicationRef,
        {
          provide: ActivatedRoute,
          useValue: {
            firstChild: {
              snapshot: { data: { title: 'Test Title' } }
            }
          }
        },
        {
          provide: Router,
          useValue: {
            events: routerEventsSubject.asObservable()
          }
        },
        {
          provide: DOCUMENT,
          useValue: document
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    langService = TestBed.inject(LangService) as unknown as MockLangService;
    swUpdate = TestBed.inject(SwUpdate) as unknown as MockSwUpdate;
    titleService = TestBed.inject(Title);
    snackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should set the default title based on environment', () => {
    expect(component.title).toBe(environment.isSspa ? 'Vortex' : 'crmgrow');
  });

  it('should change language based on country data', () => {
    expect(langService.getCountry).toHaveBeenCalled();
    expect(langService.changeLang).toHaveBeenCalledWith('en');
  });

  it('should set the title based on the activated route data', () => {
    spyOn(titleService, 'setTitle');
    component.titleHandle();
    routerEventsSubject.next(new NavigationEnd(0, '', ''));
    fixture.detectChanges();
    expect(titleService.setTitle).toHaveBeenCalledWith('Test Title | crmgrow');
  });

  it('should check for updates every 6 hours', () => {
    expect(swUpdate.checkForUpdate).toHaveBeenCalled();
  });

  it('should show snackbar on activation', () => {
    spyOn(snackBar, 'open').and.callThrough();
    swUpdate.activated.next({});
    fixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(
      `Thank you. crmgrow has been updated successfully.`,
      'Close',
      {
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      }
    );
  });

  it('should set moment timezone to default', () => {
    expect(moment.tz.guess()).toBeTruthy();
  });
});
