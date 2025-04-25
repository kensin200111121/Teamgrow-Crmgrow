import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SendTextComponent } from './send-text.component';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog
} from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { ContactService } from '@services/contact.service';
import { SmsService } from '@services/sms.service';
import { MaterialService } from '@services/material.service';
import { ToastrService } from 'ngx-toastr';
import { ScheduleService } from '@services/schedule.service';
import { HelperService } from '@services/helper.service';
import { StoreService } from '@services/store.service';
import { TaskService } from '@services/task.service';
import { ConnectService } from '@services/connect.service';
import { TemplatesService } from '@app/services/templates.service';
import { DealsService } from '@app/services/deals.service';
import { of, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { mockContact } from 'src/test/mock.data';
import { HttpClientModule } from '@angular/common/http';
import { HandlerService } from '@app/services/handler.service';

describe('SendTextComponent', () => {
  let component: SendTextComponent;
  let fixture: ComponentFixture<SendTextComponent>;
  let mockDialog: any;
  let mockDialogRef: any;
  let mockUserService: any;
  let mockContactService: any;
  let mockSmsService: any;
  let mockMaterialService: any;
  let mockToast: any;
  let mockScheduleService: any;
  let mockHelperService: any;
  let mockStoreService: any;
  let mockTaskService: any;
  let mockConnectService: any;
  let mockTemplatesService: any;
  let mockDealsService: any;
  let mockHandlerService: any;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['open', 'close']);
    mockDialog = jasmine.createSpyObj('MatDialog', [
      'open',
      'close',
      'closeAll'
    ]);
    mockUserService = {
      garbage$: of('mockGarbageData'),
      profile: {
        getValue: () => ({ _id: 'userId' })
      },
      getToken: () => 'mockToken',
      sms: new BehaviorSubject({ _id: 'templateId' })
    };
    mockContactService = {
      contactConversation$: new Subject(),
      getMessage: jasmine.createSpy('getMessage').and.returnValue(of([])),
      contactConversation: { next: jasmine.createSpy('next') }
    };
    mockSmsService = {
      getMessage: jasmine.createSpy('getMessage').and.returnValue(of([])),
      markRead: jasmine
        .createSpy('markRead')
        .and.returnValue(of({ status: true }))
    };
    mockMaterialService = {};
    mockToast = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    mockScheduleService = {
      getEventTypes: jasmine.createSpy('getEventTypes').and.returnValue(of([]))
    };
    mockHelperService = jasmine.createSpyObj('HelperService', [
      'getSMSMaterials'
    ]);
    mockHelperService.getSMSMaterials.and.returnValue(of([]));
    mockStoreService = {};
    mockTaskService = {
      scheduleData$: new Subject()
    };
    mockConnectService = {
      loadCalendlyAll: jasmine.createSpy('loadCalendlyAll')
    };
    mockTemplatesService = {
      loadAll: jasmine.createSpy('loadAll').and.returnValue(of([])),
      read: jasmine
        .createSpy('read')
        .and.returnValue(of({ content: 'Mock Template' }))
    };
    mockDealsService = {};
    mockHandlerService = jasmine.createSpyObj('HandlerService', [
      'activityAdd$',
      'reload$',
      'runScheduleTasks'
    ]);
    mockHandlerService.readMessageContact = new Subject();

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        NoopAnimationsModule,
        HttpClientModule,
        TranslateModule.forRoot()
      ],
      declarations: [SendTextComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: UserService, useValue: mockUserService },
        { provide: ContactService, useValue: mockContactService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: MaterialService, useValue: mockMaterialService },
        { provide: ToastrService, useValue: mockToast },
        { provide: ScheduleService, useValue: mockScheduleService },
        { provide: HelperService, useValue: mockHelperService },
        { provide: HandlerService, useValue: mockHandlerService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: TaskService, useValue: mockTaskService },
        { provide: ConnectService, useValue: mockConnectService },
        { provide: TemplatesService, useValue: mockTemplatesService },
        { provide: DealsService, useValue: mockDealsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SendTextComponent);
    component = fixture.componentInstance;

    component.loadSubscription = new Subscription();
    component.updateTimer = new Subscription();
    component.conversationLoadSubscription = new Subscription();
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up any subscriptions or states after each test
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load messages when type is single', () => {
    component.type = 'single';
    component.contact = mockContact;
    component.load();
    expect(mockSmsService.getMessage).toHaveBeenCalledWith(component.contact);
  });

  it('should mark messages as read', () => {
    const messages = [
      { type: 1, status: 0, _id: 'messageId1' },
      { type: 2, status: 1, _id: 'messageId2' }
    ];
    component.contact = mockContact;
    component.markAsRead(messages);
    expect(mockSmsService.markRead).toHaveBeenCalledWith(
      'messageId1',
      component.contact._id
    );
  });

  it('should update messages when type is single', () => {
    component.type = 'single';
    component.contact = mockContact;
    component.update();
    expect(mockSmsService.getMessage).toHaveBeenCalledWith(component.contact);
  });

  it('should set focus correctly', () => {
    component.setFocus();
    expect(component.toFocus).toBeTrue();
  });

  it('should handle message insert correctly', () => {
    mockHelperService.getSMSMaterials.and.returnValue({
      videoIds: ['video1', 'video2'],
      imageIds: ['image1'],
      pdfIds: ['pdf1']
    });
    component.messageText = {
      nativeElement: {
        focus: jasmine.createSpy('focus'),
        select: jasmine.createSpy('select'),
        selectionEnd: 0
      }
    };
    component.message = '';

    mockDialog.open.and.returnValue({
      afterClosed: () =>
        of({
          materials: [
            { material_type: 'video', _id: 'video1' },
            { material_type: 'image', _id: 'image1' }
          ]
        }),
      _ref: {
        overlayRef: {
          _host: {
            classList: {
              add: jasmine.createSpy('add')
            }
          }
        }
      }
    });

    component.openMaterialsDlg();
    expect(component.messageText.nativeElement.focus).toHaveBeenCalled();
  });

  it('should unsubscribe from observables on destroy', () => {
    spyOn(component.loadSubscription, 'unsubscribe').and.callThrough();
    spyOn(component.updateTimer, 'unsubscribe').and.callThrough();
    spyOn(
      component.conversationLoadSubscription,
      'unsubscribe'
    ).and.callThrough();

    component.ngOnDestroy();

    expect(component.loadSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.updateTimer.unsubscribe).toHaveBeenCalled();
    expect(
      component.conversationLoadSubscription.unsubscribe
    ).toHaveBeenCalled();
  });
});
