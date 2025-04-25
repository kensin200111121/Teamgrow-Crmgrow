import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SidebarComponent } from './sidebar.component';
import { UserService } from '@services/user.service';
import { SspaService } from '../../services/sspa.service';
import { of, BehaviorSubject, Subscription } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockUserService;
  let mockSspaService;
  let profileSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    profileSubject = new BehaviorSubject({
      _id: '1',
      subscription: { is_failed: false },
      automation_info: { is_enabled: true },
      calendar_info: { is_enabled: true },
      campaign_info: { is_enabled: true },
      scheduler_info: { is_enabled: true },
      landing_page_info: { is_enabled: true },
    });

    mockUserService = jasmine.createSpyObj('UserService', [], {
      profile$: profileSubject.asObservable()
    });

    mockSspaService = jasmine.createSpyObj(['toAsset']);

    await TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot() // Import TranslateModule
      ],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: SspaService, useValue: mockSspaService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with menu items', () => {
    expect(component.menuItems.length).toBeGreaterThan(0);
  });

  it('should handle profile subscription', () => {
    component.profileSubscription = new Subscription();
    component.ngOnDestroy();
    expect(component.profileSubscription.closed).toBeTrue();
  });

  it('should disable menu items based on user profile', () => {
    const user = {
      _id: '1',
      subscription: { is_failed: false },
      automation_info: { is_enabled: false },
      calendar_info: { is_enabled: false },
      campaign_info: { is_enabled: false },
    };
    profileSubject.next(user); // Emit the new user profile
    fixture.detectChanges();

    // Check if the disableMenuItems array has the correct number of disabled items
    expect(component.disableMenuItems.length).toBe(3);
  });

  it('should toggle menu items', () => {
    component.toggle(0);
    expect(component.menuItems[0].active).toBeTrue();
    component.toggle(0);
    expect(component.menuItems[0].active).toBeFalse();
  });

  it('should return true if menu item is disabled', () => {
    const menuItem = {
      path: 'automations/own/root',
      title: 'automations',
      icon: 'i-automation bgc-dark',
      class: '',
      beta: false,
      betaClass: '',
      betaLabel: '',
      protectedRole: null,
      active: false,
      subMenuItems: []
    };
    component.disableMenuItems.push(menuItem);
    expect(component.isDisableItem(menuItem)).toBeTrue();
  });

  it('should return false if menu item is not disabled', () => {
    const menuItem = { title: 'automations' };
    expect(component.isDisableItem(menuItem)).toBeFalse();
  });
});
