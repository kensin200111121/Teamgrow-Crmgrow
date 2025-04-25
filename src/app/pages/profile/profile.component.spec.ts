import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { User } from '@models/user.model';
import { SubscriptionCancelReasonComponent } from '../../components/subscription-cancel-reason/subscription-cancel-reason.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

class MockUserService {
  profile$ = new Subject<any>();
}

class MockMatDialog {
  open = jasmine.createSpy().and.returnValue({
    afterClosed: () => of(true),
    _ref: {
      overlayRef: {
        _host: {
          classList: {
            add: jasmine.createSpy()
          }
        }
      }
    }
  });
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockUserService: MockUserService;
  let mockMatDialog: MockMatDialog;
  let router: Router;
  let route: ActivatedRoute;

  beforeEach(async () => {
    mockUserService = new MockUserService();
    mockMatDialog = new MockMatDialog();

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      imports: [RouterTestingModule, MatDialogModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: MatDialog, useValue: mockMatDialog },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ page: 'general', action: '' })
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore errors related to unknown elements and attributes
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.user).toEqual(new User());
    expect(component.defaultPage).toBe('general');
    expect(component.currentPage).toBe('general');
    expect(component.currentAction).toBe('');
  });

  it('should set activeItems based on profile data', () => {
    const profile = {
      _id: '123',
      subscription: { is_failed: false },
      billing_access_enabled: true,
      organization_info: { is_enabled: true }
    };

    mockUserService.profile$.next(profile);

    expect(component.activeItems.length).toBe(component.menuItems.length);
  });

  it('should update currentPage and currentAction based on route params', () => {
    route.params = of({ page: 'billing', action: '' });
    component.ngOnInit();
    expect(component.currentPage).toBe('billing');
    expect(component.currentAction).toBe('');
  });

  it('should open cancel account dialog when cancelAccount is called', () => {
    component.cancelAccount();
    expect(mockMatDialog.open).toHaveBeenCalledWith(
      SubscriptionCancelReasonComponent,
      {
        width: '800px',
        maxWidth: '800px',
        disableClose: true,
        data: {}
      }
    );
  });

  it('should unsubscribe from all subscriptions on ngOnDestroy', () => {
    spyOn(component.profileSubscription, 'unsubscribe');
    spyOn(component.routeChangeSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.profileSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.routeChangeSubscription.unsubscribe).toHaveBeenCalled();
  });

  it('should navigate to the correct page when changeMenu is called', () => {
    spyOn(router, 'navigate');
    const menu = { id: 'billing', icon: '', label: 'Billing' };
    component.changeMenu(menu);
    expect(router.navigate).toHaveBeenCalledWith(['profile/billing']);
  });

  it('should navigate to the correct page when changeTab is called', () => {
    spyOn(router, 'navigate');
    const tab = { id: 'security', icon: '', label: 'Security' };
    component.changeTab(tab);
    expect(router.navigate).toHaveBeenCalledWith(['profile/security']);
  });
});
