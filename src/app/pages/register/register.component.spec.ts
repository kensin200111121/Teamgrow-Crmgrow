import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { SspaService } from '../../services/sspa.service';
import { UserService } from '@services/user.service';
import { HelperService } from '@services/helper.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { StripeScriptTag } from 'stripe-angular';
import { of, throwError, Subject } from 'rxjs';
import { CountryISO } from 'ngx-intl-tel-input';
import {
  PACKAGE_LEVEL,
  PHONE_COUNTRIES,
  STRIPE_KEY,
  WIN_TIMEZONE
} from '@constants/variable.constants';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { SelectTimezoneComponent } from '@components/select-timezone/select-timezone.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import '../../../test/localStorage.mock';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockUserService;
  let mockHelperService;
  let mockToastrService;
  let mockDialog;
  let mockRouter;
  let mockActivatedRoute;
  let mockLocation;
  let mockStripeScriptTag;
  let mockSspaService;
  let mockTranslateService;

  beforeEach(async () => {
    // Mock fbq function
    (window as any).fbq = jasmine.createSpy('fbq');
    mockUserService = jasmine.createSpyObj('UserService', [
      'checkEmail',
      'checkPhone',
      'requestOAuthUrl',
      'requestOutlookProfile', // Ensure this is included
      'requestGoogleProfile',
      'extensionUpgrade',
      'signup',
      'socialSignUp',
      'setToken',
      'setUser'
    ]);
    mockHelperService = jasmine.createSpyObj('HelperService', ['']);
    mockToastrService = jasmine.createSpyObj('ToastrService', ['error']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      queryParams: of({}),
      snapshot: { params: {} }
    };
    mockLocation = jasmine.createSpyObj('Location', ['replaceState']);
    mockStripeScriptTag = jasmine.createSpyObj('StripeScriptTag', [
      'setPublishableKey'
    ]);

    mockSspaService = jasmine.createSpyObj('SspaService', ['toAsset']);
    mockSspaService.toAsset.and.returnValue({}); // Adjust this as needed

    await TestBed.configureTestingModule({
      declarations: [
        RegisterComponent,
        PhoneInputComponent,
        SelectTimezoneComponent
      ],
      imports: [
        TranslateModule.forRoot(),
        FormsModule, // Add FormsModule if using template-driven forms
        ReactiveFormsModule // Add ReactiveFormsModule if using reactive forms
      ],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: HelperService, useValue: mockHelperService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Location, useValue: mockLocation },
        { provide: StripeScriptTag, useValue: mockStripeScriptTag },
        { provide: SspaService, useValue: mockSspaService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    mockStripeScriptTag.StripeInstance = false; // To simulate Stripe instance not being set
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.defaultTimeZone).toBeTrue();
    expect(component.timezones).toEqual(WIN_TIMEZONE);
    expect(component.countries).toEqual(PHONE_COUNTRIES);
    expect(component.CountryISO).toEqual(CountryISO);
    expect(component.step).toBe(1);
    expect(component.package_level).toBe(PACKAGE_LEVEL.GROWTH.package);
    expect(component.is_trial).toBeTrue();
  });

  it('should set publishable key if StripeInstance is not set', () => {
    expect(mockStripeScriptTag.setPublishableKey).toHaveBeenCalledWith(
      STRIPE_KEY
    );
  });

  it('should call checkEmail when email is valid and debounced', fakeAsync(() => {
    const mockEmail = 'test@example.com';
    mockUserService.checkEmail.and.returnValue(of({ status: true }));

    component.user.email = mockEmail;
    component.confirmEmail.next(mockEmail);

    tick(500); // Simulate debounce time

    expect(component.checkingUser).toBeFalse();
    expect(mockUserService.checkEmail).toHaveBeenCalledWith(mockEmail);
  }));

  it('should handle social signup via Outlook', fakeAsync(() => {
    mockActivatedRoute.queryParams = of({ code: 'test_code' });
    mockActivatedRoute.snapshot.params = { social: 'outlook' };
    mockUserService.requestOutlookProfile.and.returnValue(
      of({ data: { user_name: 'Outlook User' } })
    );

    component.ngOnInit();
    tick();

    expect(component.socialLoading).toBe('');
    expect(component.user.user_name).toBe('Outlook User');
    expect(component.isSocialUser).toBeTrue();
  }));

  it('should handle social signup errors', fakeAsync(() => {
    mockActivatedRoute.queryParams = of({ code: 'test_code' });
    mockActivatedRoute.snapshot.params = { social: 'outlook' };
    mockUserService.requestOutlookProfile.and.returnValue(
      throwError({ message: 'Error' })
    );

    component.ngOnInit();
    tick();

    expect(component.socialLoading).toBe('');
    expect(mockToastrService.error).toHaveBeenCalledWith(
      'Error: Error',
      'Social sign up is failed!',
      { timeOut: 3000 }
    );
  }));

  it('should validate phone and call checkPhone service', () => {
    const mockPhoneEvent = { e164Number: '+1234567890' };
    mockUserService.checkPhone.and.returnValue(of({ status: true }));

    component.confirmPhone(mockPhoneEvent);
    expect(component.checkingPhone).toBeFalse();
    expect(mockUserService.checkPhone).toHaveBeenCalledWith(
      mockPhoneEvent.e164Number
    );
  });

  it('should handle successful sign up for social user', fakeAsync(() => {
    component.isSocialUser = true;
    component.user = {
      user_name: 'test',
      email: 'test@example.com',
      password: 'password',
      cell_phone: '+1234567890',
      phone: {},
      time_zone_info: '',
      level: '',
      is_trial: true,
      promo: ''
    };
    mockUserService.socialSignUp.and.returnValue(
      of({
        status: true,
        data: { token: 'test_token', user: { _id: '12345' } }
      })
    );

    component.signUp();
    tick();

    expect(component.saving).toBeFalse();
    expect(mockUserService.setToken).toHaveBeenCalledWith('test_token');
    expect(mockUserService.setUser).toHaveBeenCalledWith({ _id: '12345' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home'], {
      queryParams: { prev: 'signup' }
    });
  }));

  it('should navigate to step 2 on gotoBasic call', fakeAsync(() => {
    component.gotoBasic();
    tick(100);
    expect(component.step).toBe(2);
  }));
});
