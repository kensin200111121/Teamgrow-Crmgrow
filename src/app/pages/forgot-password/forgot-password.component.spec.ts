import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { UserService } from '@services/user.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ElementRef } from '@angular/core';
import { SspaService } from '../../services/sspa.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngForm

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  let sspaService: jasmine.SpyObj<SspaService>;
  let elRef: ElementRef;

  beforeEach(async () => {
    userService = jasmine.createSpyObj('UserService', ['requestResetPassword']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    sspaService = jasmine.createSpyObj('SspaService', ['someMethod']);

    await TestBed.configureTestingModule({
      declarations: [ForgotPasswordComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
        { provide: SspaService, useValue: sspaService },
        {
          provide: ElementRef,
          useValue: { nativeElement: document.createElement('div') }
        }
      ],
      imports: [
        FormsModule,                // Import FormsModule for template-driven forms (ngForm)
        TranslateModule.forRoot()    // Import TranslateModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    elRef = fixture.componentRef.location as ElementRef;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should focus on email input after view init', () => {
    const emailInput = document.createElement('input');
    emailInput.setAttribute('name', 'email');
    spyOn(elRef.nativeElement, 'querySelector').and.returnValue(emailInput);
    spyOn(emailInput, 'focus');

    component.ngAfterViewInit();

    expect(emailInput.focus).toHaveBeenCalled();
  });

  it('should send reset code and navigate on success', () => {
    userService.requestResetPassword.and.returnValue(of(true));
    component.resetEmail = 'test@example.com';

    component.sendResetCode();

    expect(component.loading).toBe(false);
    expect(component.submitting).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/reset-password'], {
      queryParams: { email: 'test@example.com' },
    });
  });

  it('should handle failed reset code request', () => {
    userService.requestResetPassword.and.returnValue(of(false));
    component.resetEmail = 'test@example.com';

    component.sendResetCode();

    expect(component.loading).toBe(false);
    expect(component.submitting).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
