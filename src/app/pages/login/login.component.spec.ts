import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { SspaService } from '../../services/sspa.service';
import { UserService } from '@services/user.service';
import {
  GoogleLoginProvider,
  SocialAuthService as GoogleAuth
} from '@abacritt/angularx-social-login';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UpgradePlanErrorComponent } from '@components/upgrade-plan-error/upgrade-plan-error.component';
import { Cookie } from '@app/utils/cookie';
import { socialUserData } from 'src/test/mock.data';
import { TranslateModule } from '@ngx-translate/core'; // Import TranslateModule
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import '../../../test/localStorage.mock';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let googleAuthSpy: jasmine.SpyObj<GoogleAuth>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    const userServiceMock = jasmine.createSpyObj('UserService', [
      'login',
      'socialSignIn',
      'setToken',
      'setProfile'
    ]);
    const googleAuthMock = jasmine.createSpyObj('GoogleAuth', ['signIn']);
    // Set up authState as a BehaviorSubject
    googleAuthMock.authState = new BehaviorSubject(null);
    const toastrMock = jasmine.createSpyObj('ToastrService', ['error']);
    const dialogMock = jasmine.createSpyObj('MatDialog', ['open']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteMock = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        queryParams: { returnUrl: '/home' }
      }
    });
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: GoogleAuth, useValue: googleAuthMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        SspaService
      ],
      imports: [FormsModule, ReactiveFormsModule, TranslateModule.forRoot()]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    googleAuthSpy = TestBed.inject(GoogleAuth) as jasmine.SpyObj<GoogleAuth>;
    toastrSpy = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRouteSpy = TestBed.inject(
      ActivatedRoute
    ) as jasmine.SpyObj<ActivatedRoute>;
  });

  it('should focus on email input after view init', () => {
    const emailElement = jasmine.createSpyObj('email', ['focus']);
    spyOn(component['elRef'].nativeElement, 'querySelector').and.returnValue(
      emailElement
    );
    component.ngAfterViewInit();
    expect(emailElement.focus).toHaveBeenCalled();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set returnUrl on init', () => {
    component.ngOnInit();
    expect(component.returnUrl).toBe('/home');
  });

  it('should login successfully', fakeAsync(() => {
    const loginResponse = {
      data: { user: { _id: '123', subscription: { is_failed: false } } }
    };
    userServiceSpy.login.and.returnValue(of(loginResponse));
    spyOn(component, 'goHome');

    component.login();
    tick();
    expect(userServiceSpy.login).toHaveBeenCalledWith(component.user);
    expect(component.submitting).toBeFalse();
    expect(component.goHome).toHaveBeenCalledWith(loginResponse.data);
  }));

  it('should handle social login through Google successfully', fakeAsync(() => {
    googleAuthSpy.signIn.and.returnValue(
      Promise.resolve(socialUserData.googleLogin)
    );
    spyOn(component, 'signWithSocial');

    component.signInGoogle();
    tick();
    expect(component.socialLoading).toBeTrue();
    expect(googleAuthSpy.signIn).toHaveBeenCalledWith(
      GoogleLoginProvider.PROVIDER_ID,
      {
        prompt: 'consent',
        offline_access: true
      }
    );
    expect(component.signWithSocial).toHaveBeenCalledWith({
      social_id: socialUserData.googleLogin.id
    });
  }));

  it('should handle social login through Google failure', fakeAsync(() => {
    const error = { message: 'Google Error' };
    googleAuthSpy.signIn.and.returnValue(Promise.reject(error));

    component.signInGoogle();
    tick();
    expect(component.socialLoading).toBeFalse();
    expect(toastrSpy.error).toHaveBeenCalledWith(
      `Google authentication is failed with error (${error.message})`,
      'Google SignIn',
      { timeOut: 3000 }
    );
  }));

  it('should handle social login through Outlook successfully', fakeAsync(() => {
    spyOn(component.msalInstance, 'loginPopup').and.returnValue(
      Promise.resolve(socialUserData.outlookLogin)
    );
    spyOn(component, 'signWithSocial');

    component.signInOutlook();
    tick();
    expect(component.socialLoading).toBeTrue();
    expect(component.msalInstance.loginPopup).toHaveBeenCalledWith({
      scopes: ['user.read'],
      prompt: 'select_account'
    });
    expect(component.signWithSocial).toHaveBeenCalledWith({
      social_id: socialUserData.outlookLogin.account.accountIdentifier
    });
  }));

  it('should handle social login through Outlook failure', fakeAsync(() => {
    const error = { message: 'Outlook Error' };
    spyOn(component.msalInstance, 'loginPopup').and.returnValue(
      Promise.reject(error)
    );

    component.signInOutlook();
    tick();
    expect(component.socialLoading).toBeFalse();
    expect(toastrSpy.error).toHaveBeenCalledWith(
      `Outlook authentication is failed with error (${error.message})`,
      'Outlook Signin',
      { timeOut: 3000 }
    );
  }));

  it('should handle social sign in successfully', fakeAsync(() => {
    const socialResponse = {
      data: { user: { _id: '123', subscription: { is_failed: false } } }
    };
    userServiceSpy.socialSignIn.and.returnValue(of(socialResponse));
    spyOn(component, 'goHome');

    component.signWithSocial({ social_id: '123' });
    tick();
    expect(component.socialLoading).toBeFalse();
    expect(userServiceSpy.socialSignIn).toHaveBeenCalledWith({
      social_id: '123'
    });
    expect(component.goHome).toHaveBeenCalledWith(socialResponse.data);
  }));

  it('should handle social sign in failure', fakeAsync(() => {
    userServiceSpy.socialSignIn.and.returnValue(
      throwError(() => new Error('Error'))
    );

    component.signWithSocial({ social_id: '123' });
    tick();
    expect(component.socialLoading).toBeFalse();
    expect(component.loading).toBeFalse();
  }));

  it('should navigate to home on successful login', () => {
    const data = {
      user: { _id: '123', subscription: { is_failed: false }, is_primary: true }
    };
    spyOn(Cookie, 'setLogin');
    spyOn(localStorage, 'setCrmItem');
    spyOn(component, 'goHome').and.callThrough();

    component.goHome(data);
    expect(Cookie.setLogin).toHaveBeenCalledWith(data.user._id);
    expect(localStorage.setCrmItem).toHaveBeenCalledWith(
      'primary_loggin',
      data.user.is_primary
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['']);
  });

  it('should handle failed subscription on goHome', () => {
    const data = {
      user: {
        _id: '123',
        subscription: { is_failed: true, is_suspended: true },
        disabled_at: '2023-08-20'
      }
    };
    spyOn(Cookie, 'setLogin');
    spyOn(localStorage, 'setCrmItem');
    spyOn(component, 'goHome').and.callThrough();

    component.goHome(data);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/billing']);
    expect(dialogSpy.open).toHaveBeenCalledWith(UpgradePlanErrorComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '450px',
      disableClose: true,
      data: { cancelDate: data.user.disabled_at }
    });
  });
});
