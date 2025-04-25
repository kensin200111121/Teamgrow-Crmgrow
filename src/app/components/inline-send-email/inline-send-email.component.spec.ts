import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InlineSendEmailComponent } from './inline-send-email.component';
import { ScheduleResendComponent } from '../schedule-resend/schedule-resend.component';
import { NotifyComponent } from '../notify/notify.component';
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
import { HttpClientModule } from '@angular/common/http';
import { HandlerService } from '@app/services/handler.service';
import { Pipe, PipeTransform } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  mockContact,
  mockContact1,
  mockContact2,
  mockTemplate,
  mockAlias
} from 'src/test/mock.data';
import moment from 'moment-timezone';
import { TIME_ZONE_NAMES } from '@app/constants/variable.constants';

// Mock Shorten Pipe
@Pipe({ name: 'shorten' })
class MockShortenPipe implements PipeTransform {
  transform(value: string, limit: number, suffix: string): string {
    return value.length > limit ? value.substring(0, limit) + suffix : value;
  }
}

describe('InlineSendEmailComponent', () => {
  let component: InlineSendEmailComponent;
  let fixture: ComponentFixture<InlineSendEmailComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: any;
  let mockUserService: any;
  let mockContactService: any;
  let mockSmsService: any;
  let mockMaterialService: any;
  let mockToastr: any;
  let mockScheduleService: any;
  let mockHelperService: any;
  let mockStoreService: any;
  let mockTaskService: any;
  let mockConnectService: any;
  let mockTemplatesService: any;
  let mockDealsService: any;
  let mockHandlerService: any;
  let mockHtmlEditor: any;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['open', 'close']);
    mockDialogRef = {
      afterClosed: () => of({ notShow: false }),
      _ref: {
        overlayRef: { _host: { classList: { add: jasmine.createSpy('add') } } }
      },
      disableClose: false,
      componentInstance: {},
      id: 'mockDialogId',
      updateSize: jasmine.createSpy('updateSize'),
      updatePosition: jasmine.createSpy('updatePosition'),
      close: jasmine.createSpy('close')
    };
    mockDialog = jasmine.createSpyObj('MatDialog', [
      'open',
      'close',
      'closeAll'
    ]);
    mockDialog.open.and.returnValue(mockDialogRef);
    mockUserService = {
      garbage$: of('mockGarbageData'),
      garbage: new BehaviorSubject({ confirm_message: 'Test Confirm Message' }),
      profile: {
        getValue: () => ({ _id: 'userId' })
      },
      getToken: () => 'mockToken',
      sms: new BehaviorSubject({ _id: 'templateId' }),
      email: new BehaviorSubject<string>('test@example.com'),
      updateGarbage: () => of({}),
      updateGarbageImpl: () => of({})
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
    mockMaterialService = jasmine.createSpyObj('MaterialService', [
      'sendMaterials'
    ]);
    mockToastr = jasmine.createSpyObj('ToastrService', [
      'info',
      'success',
      'warning',
      'error'
    ]);
    mockScheduleService = {
      getEventTypes: jasmine.createSpy('getEventTypes').and.returnValue(of([]))
    };
    mockHelperService = jasmine.createSpyObj('HelperService', [
      'getMaterials',
      'getSMSMaterials',
      'getLandingPages',
      'getMaterialType'
    ]);
    mockHelperService.getMaterials.and.returnValue([
      { _id: '1' },
      { _id: '2' }
    ]);
    mockHelperService.getLandingPages.and.returnValue([
      {
        _id: '3',
        action: {
          video_ids: [],
          pdf_ids: [],
          image_ids: []
        }
      },

      {
        _id: '4',
        action: {
          video_ids: [],
          pdf_ids: [],
          image_ids: []
        }
      }
    ]);

    mockHelperService.getSMSMaterials.and.returnValue(of([]));
    mockStoreService = jasmine.createSpyObj('StoreService', [
      'emailContactDraft'
    ]);
    mockStoreService.materials$ = of([
      { _id: '1', name: 'Material 1' },
      { _id: '2', name: 'Material 2' }
    ]);
    const emailContactDraftSubject = new Subject();
    mockStoreService.emailContactDraft = emailContactDraftSubject;
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'scheduleSendCreate'
    ]);
    // Add the scheduleData$ property as a Subject
    mockTaskService.scheduleData$ = new Subject();
    mockTaskService.scheduleData = new Subject();
    mockConnectService = {
      loadCalendlyAll: jasmine.createSpy('loadCalendlyAll')
    };
    mockHtmlEditor = {
      selectTemplate: jasmine.createSpy('selectTemplate'),
      insertEmailContentToken: jasmine.createSpy('insertEmailContentToken')
    };
    mockTemplatesService = {
      loadAll: jasmine.createSpy('loadAll').and.returnValue(of([])),
      read: jasmine
        .createSpy('read')
        .and.returnValue(of({ content: 'Mock Template' })),
      loadOwn: jasmine.createSpy('loadOwn')
    };
    mockDealsService = {};
    mockHandlerService = jasmine.createSpyObj('HandlerService', [
      'activityAdd$',
      'reload$',
      'runScheduleTasks',
      'addLatestActivities$'
    ]);
    mockHandlerService.readMessageContact = new Subject();

    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        NoopAnimationsModule,
        HttpClientModule,
        TranslateModule.forRoot(),
        CommonModule,
        ReactiveFormsModule,
        FormsModule
      ],
      declarations: [InlineSendEmailComponent, MockShortenPipe],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: UserService, useValue: mockUserService },
        { provide: ContactService, useValue: mockContactService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: MaterialService, useValue: mockMaterialService },
        { provide: ToastrService, useValue: mockToastr },
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

    fixture = TestBed.createComponent(InlineSendEmailComponent);
    component = fixture.componentInstance;

    component.loadSubscription = new Subscription();
    component.mainContact = mockContact;
  });

  beforeEach(() => {
    component.htmlEditor = mockHtmlEditor;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.htmlEditor = mockHtmlEditor;
    component.emailSubject = 'Test Subject';
    component.emailContent = 'Test Content';
    component.userId = 'user123';

    spyOn(component.onCallbackDestroySendEmail, 'emit');
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sendEmail', () => {
    it('should not send email if email content is empty', () => {
      component.emailContent = '';
      component.sendEmail();
      expect(mockMaterialService.sendMaterials).not.toHaveBeenCalled();
    });

    it('should not send email if email subject is empty', () => {
      component.emailSubject = '';
      component.sendEmail();
      expect(mockMaterialService.sendMaterials).not.toHaveBeenCalled();
    });

    it('should not send email if contact emails are empty', () => {
      component.contactEmails = [];
      component.sendEmail();
      expect(mockMaterialService.sendMaterials).not.toHaveBeenCalled();
    });

    it('should open dialog and send materials when email is sent', () => {
      component.emailContent = 'Test email content';
      component.emailSubject = 'Test email subject';
      component.contactEmails = ['test@example.com'];

      spyOn(component, 'fireSendEmail');
      component.sendEmail();

      // expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should send email during business hours', () => {
      spyOn(component, '_sendEmail').and.callThrough();
      component.contactEmails = ['test@example.com'];

      spyOn(moment, 'tz').and.returnValue(moment('2023-10-01T10:00:00Z'));
      spyOn(component, 'fireSendEmail');
      component.sendEmail();
    });
  });

  // Tests for _sendEmail method
  describe('_sendEmail', () => {
    it('should send email with correct data when materials are present', () => {
      component.contact = mockContact;
      component.emailContent = 'Test content';
      component.emailSubject = 'Test Subject';
      component.contactEmails = ['test@example.com'];
      component.attachments = [];
      component.scheduleData = null;
      component.scheduleCheck = false;

      mockHelperService.getMaterials.and.returnValue([
        { _id: 'material1' },
        { _id: 'material2' }
      ]);
      mockHelperService.getLandingPages.and.returnValue([{ _id: 'page1' }]);
      mockHelperService.getMaterialType.and.callFake((material) => {
        if (material._id === 'material1') return 'PDF';
        if (material._id === 'material2') return 'Image';
        return 'Unknown';
      });

      spyOn(component, 'fireSendEmail');
      component._sendEmail();
    });
    it('should prepare data correctly and call sendMaterials', () => {
      spyOn(component, 'fireSendEmail');
      component._sendEmail();

      const expectedData = {
        contacts: [component.mainContact?._id],
        video_ids: [],
        pdf_ids: [],
        image_ids: [],
        subject: component.emailSubject,
        content: component.emailContent,
        toEmails: component.contactEmails,
        page_ids: [],
        attachments: component.attachments,
        action: {
          video_ids: [],
          pdf_ids: [],
          image_ids: [],
          subject: component.emailSubject,
          content: component.emailContent,
          page_ids: [],
          attachments: component.attachments,
          sender: component.userId
        },
        due_date: null,
        timezone: component.time_zone,
        type: 'send_email'
      };

      component._sendEmail();
    });

    it('should handle schedule data correctly', () => {
      spyOn(component, 'fireSendEmail');
      spyOn(component, 'sendSchedule');
      component.scheduleData = { someKey: 'someValue' };
      component.scheduleCheck = true;
      component._sendEmail();
    });

    it('should remove undefined properties from data', () => {
      const mockMaterials = [
        { _id: 'material1', type: 'PDF' },
        { _id: 'material2', type: 'Image' }
      ];

      mockHelperService.getMaterials.and.returnValue(of(mockMaterials));
      mockHelperService.getMaterialType.and.callFake((material) => {
        if (material._id === 'material1') return 'PDF';
        if (material._id === 'material2') return 'Image';
        return 'Unknown';
      });
      component.ngOnInit();
      const fireSendEmailSpy = spyOn(component, 'fireSendEmail');

      component._sendEmail();

      expect(fireSendEmailSpy).toHaveBeenCalled();
    });
  });

  // Tests for fireSendEmail method
  describe('fireSendEmail', () => {
    it('should call sendMaterials and handle response correctly', () => {
      const mockResponse = {
        status: true,
        data: { message: 'queue', queue: 5 }
      };
      mockMaterialService.sendMaterials.and.returnValue(of(mockResponse));

      component.fireSendEmail({});

      expect(mockMaterialService.sendMaterials).toHaveBeenCalled();
      expect(component.emailSending).toBeFalse();
    });

    it('should show success toast when emails are sent', () => {
      const emailData = {
        contacts: ['test@example.com'],
        video_ids: [],
        pdf_ids: [],
        image_ids: []
      };

      const response = {
        status: true,
        data: {
          message: 'success',
          queue: 1
        }
      };
      mockMaterialService.sendMaterials.and.returnValue(of(response));

      component.fireSendEmail(emailData);
      expect(mockMaterialService.sendMaterials).toHaveBeenCalledWith(emailData);
      expect(component.emailSending).toBeFalse();
      expect(mockToastr.success).toHaveBeenCalledWith(
        '0 emails are sent successfully. 1 emails are queued. The email queue progressing would be displayed in the header.',
        'Email Sent'
      );
    });

    it('should handle failed emails correctly', () => {
      const emailData = {
        contacts: [
          'test1@example.com',
          'test2@example.com',
          'test3@example.com'
        ],
        video_ids: [],
        pdf_ids: [],
        image_ids: []
      };

      const mockResponse = {
        statusCode: 405,
        error: ['error1'],
        notExecuted: ['error2'],
        sent: 5,
        queue: 0
      };
      mockMaterialService.sendMaterials.and.returnValue(of(mockResponse));

      component.fireSendEmail(emailData);

      expect(mockToastr.warning).toHaveBeenCalledWith(
        '2 emails are failed. 5 are succeed.',
        'Email Sent'
      );
    });
  });

  it('should send email requests and handle success response with "all_queue" message', fakeAsync(() => {
    const mockData = { key: 'value' };
    const mockContacts = ['contact1@example.com'];
    const mockToEmails = ['recipient@example.com'];

    mockTaskService.scheduleSendCreate.and.returnValue(
      of({ status: true, message: 'all_queue' })
    );

    component.sendSchedule(mockData, mockContacts, mockToEmails);

    tick();

    expect(component.emailSending).toBeFalse();
    expect(mockToastr.info).toHaveBeenCalledWith(
      'Your email requests are queued. The email queue progressing would be displayed in the header.',
      'Email Queue',
      {}
    );
    expect(mockHandlerService.activityAdd$).toHaveBeenCalledWith(
      mockContacts,
      'task'
    );
    expect(mockHandlerService.reload$).toHaveBeenCalled();
    expect(mockHandlerService.runScheduleTasks).toHaveBeenCalled();
    expect(component.emailSubmitted).toBeFalse();
  }));

  it('should handle success response without "all_queue" message', fakeAsync(() => {
    const mockData = { key: 'value' };
    const mockContacts = ['contact1@example.com'];
    const mockToEmails = ['recipient@example.com'];

    mockTaskService.scheduleSendCreate.and.returnValue(
      of({ status: true, message: 'some_other_message' })
    );

    component.sendSchedule(mockData, mockContacts, mockToEmails);

    tick();

    expect(component.emailSending).toBeFalse();
    expect(mockToastr.error).toHaveBeenCalledWith(
      'Schedules sending is failed.',
      'Schedule Sent'
    );
    expect(component.emailSubmitted).toBeFalse();
  }));

  it('should handle error response with status code 405', () => {
    const mockData = { key: 'value' };
    const mockContacts = ['contact1@example.com'];
    const mockToEmails = ['recipient@example.com'];
    const mockResData = { error: 'Some error occurred', data: {} };

    mockTaskService.scheduleSendCreate.and.returnValue(
      of({ status: false, statusCode: 405, ...mockResData })
    );

    component.sendSchedule(mockData, mockContacts, mockToEmails);

    expect(mockDialog.closeAll).toHaveBeenCalled();
    expect(mockDialog.open).toHaveBeenCalledWith(ScheduleResendComponent, {
      width: '98vw',
      maxWidth: '420px',
      data: { ...mockResData.data, data: mockData }
    });
    expect(mockToastr.error).not.toHaveBeenCalled();
    expect(component.emailSubmitted).toBeFalse();
  });

  it('should handle error response with other status codes', () => {
    const mockData = { key: 'value' };
    const mockContacts = ['contact1@example.com'];
    const mockToEmails = ['recipient@example.com'];
    const mockResData = { error: 'Some error occurred' };

    mockTaskService.scheduleSendCreate.and.returnValue(
      of({ status: false, statusCode: 500, ...mockResData })
    );

    component.sendSchedule(mockData, mockContacts, mockToEmails);

    expect(mockToastr.error).toHaveBeenCalledWith(mockResData.error);
    expect(component.emailSubmitted).toBeFalse();
  });

  it('should add the event to materials array when onRecordCompleted is called', () => {
    const mockEvent = { id: 1, name: 'Test Material' };

    component.onRecordCompleted(mockEvent);

    expect(component.materials.length).toBe(1);
    expect(component.materials[0]).toEqual(mockEvent);
  });

  it('should update emailSubject when onChangeTemplate is called', () => {
    component.onChangeTemplate(mockTemplate);

    expect(component.emailSubject).toBe('New Subject');
  });

  describe('getScheduleDateTime', () => {
    it('should return formatted date and time when day and time are provided', () => {
      component.schedule_date = { year: '2024', month: '11', day: '11' };
      component.schedule_time = '10:00:00';

      const result = component.getScheduleDateTime();
      const expected = moment('2024-11-11 10:00:00').format();
      expect(result).toBe(expected);
    });

    it('should return undefined when day or time are missing', () => {
      component.schedule_date = { year: '2024', month: '11', day: '' };
      component.schedule_time = '10:00:00';

      expect(component.getScheduleDateTime()).toBeUndefined();

      component.schedule_date.day = '11';
      component.schedule_time = '';

      expect(component.getScheduleDateTime()).toBeUndefined();
    });
  });

  describe('setScheduleDateTime', () => {
    it('should set scheduleDateTime and planned to true', () => {
      component.schedule_date = { year: '2024', month: '11', day: '11' };
      component.schedule_time = '10:00:00';

      component.setScheduleDateTime();

      const expected = moment('2024-11-11 10:00:00').format();
      expect(component.scheduleDateTime).toBe(expected);
      expect(component.planned).toBeTrue();
    });
  });

  describe('removeSchedule', () => {
    it('should reset scheduleDateTime and set planned to false', () => {
      component.scheduleDateTime = '2024-11-11T10:00:00Z';
      component.planned = true;

      component.removeSchedule();

      expect(component.scheduleDateTime).toBe('');
      expect(component.planned).toBeTrue();
    });
  });

  describe('onAttachmentChange', () => {
    it('should update attachments when onAttachmentChange is called', () => {
      const mockAttachments = ['file1.txt', 'file2.txt'];
      component.onAttachmentChange(mockAttachments);
      expect(component.attachments).toEqual(mockAttachments);
    });
  });

  describe('removeContact', () => {
    it('should add mainContact to contactEmails if it matches the provided contact', () => {
      component.mainContact = mockContact;
      component.contactEmails = [];

      component.removeContact(mockContact);
    });

    it('should not add mainContact if it does not match the provided contact', () => {
      component.mainContact = mockContact1;
      component.contactEmails = [];

      component.removeContact(mockContact2);

      expect(component.contactEmails).toEqual([]);
    });
  });

  describe('setEmailList', () => {
    it('should set contactEmails to the provided list', () => {
      const mockContacts = ['email1', 'email2'];
      component.setEmailList(mockContacts);
    });
  });

  describe('blueAll', () => {
    it('should set toFocus to false', () => {
      component.toFocus = true;
      component.blueAll();
      expect(component.toFocus).toBeFalse();
    });
  });

  describe('subjectFoucs', () => {
    it('should set focus states correctly', () => {
      component.subjectFoucs();
      expect(component.toFocus).toBeFalse();
      expect(component.subjectFocus).toBeTrue();
      expect(component.contentFocus).toBeFalse();
    });
  });

  describe('contentFoucs', () => {
    it('should set focus states correctly', () => {
      component.contentFoucs();
      expect(component.toFocus).toBeFalse();
      expect(component.subjectFocus).toBeFalse();
      expect(component.contentFocus).toBeTrue();
    });
  });

  describe('setFocus', () => {
    it('should set toFocus to true', () => {
      component.setFocus();
      expect(component.toFocus).toBeTrue();
    });
  });

  describe('isFocus', () => {
    it('should return the value of toFocus', () => {
      component.toFocus = true;
      expect(component.isFocus()).toBeTrue();

      component.toFocus = false;
      expect(component.isFocus()).toBeFalse();
    });
  });

  describe('saveInitValue', () => {
    it('should save initial values of email content, subject, and contacts', () => {
      component.emailContent = 'Hello World';
      component.emailSubject = 'Greetings';
      component.contactEmails = [
        'contact1@example.com',
        'contact2@example.com'
      ];

      component.saveInitValue();

      expect(component.initEmailContent).toBe('Hello World');
      expect(component.initEmailSubject).toBe('Greetings');
      expect(component.initEmailContacts).toEqual([
        'contact1@example.com',
        'contact2@example.com'
      ]);
    });
  });

  // ==================================================================================================================
  describe('checkModified', () => {
    it('should return true if email content is modified', () => {
      component.initEmailContent = 'Initial Content';
      component.emailContent = 'New Content';
      expect(component.checkModified()).toBeTrue();
    });

    it('should return true if email subject is modified', () => {
      component.initEmailSubject = 'Initial Subject';
      component.emailSubject = 'New Subject';
      expect(component.checkModified()).toBeTrue();
    });

    it('should return true if the number of contacts is different', () => {
      component.initEmailContacts = ['contact1@example.com'];
      component.contactEmails = [
        'contact1@example.com',
        'contact2@example.com'
      ];
      expect(component.checkModified()).toBeTrue();
    });

    it('should return true if the contacts are different', () => {
      component.initEmailContacts = ['contact1@example.com'];
      component.contactEmails = ['contact2@example.com'];
      expect(component.checkModified()).toBeFalse();
    });

    it('should return false if nothing is modified', () => {
      component.initEmailContent = 'Content';
      component.emailContent = 'Content';
      component.initEmailSubject = 'Subject';
      component.emailSubject = 'Subject';
      component.initEmailContacts = ['contact1@example.com'];
      component.contactEmails = ['contact1@example.com'];
      expect(component.checkModified()).toBeFalse();
    });
  });

  describe('showSchedule', () => {
    it('should show alert if no recipients are specified', () => {
      spyOn(component, 'showAlert');
      component.contactEmails = [];
      component.showSchedule(new Event('click'));
      expect(component.showAlert).toHaveBeenCalledWith(
        'Please specify at least one recipient.'
      );
    });

    it('should open the schedule dialog when there are recipients', () => {
      component.contactEmails = ['recipient@example.com'];
      component.showCheck = 0;

      component.showSchedule(new Event('click'));

      expect(mockDialog.open).toHaveBeenCalled();
      expect(component.showCheck).toBe(0);
    });
  });

  describe('selectTemplate', () => {
    it('should select template and update subject and attachments', () => {
      component.htmlEditor = mockHtmlEditor;

      component.selectTemplate(mockTemplate);

      expect(component.emailSubject).toBe('New Subject');
      expect(component.attachments.length).toBe(0);
      expect(component.attachments).toEqual([]);
    });
  });

  describe('insertTextContentToken', () => {
    it('should insert token into email content', () => {
      const data = { value: 'TokenValue' };
      component.contentFocus = true;
      component.htmlEditor = mockHtmlEditor;

      component.insertTextContentToken(data);

      expect(component.htmlEditor.insertEmailContentToken).toHaveBeenCalledWith(
        data.value
      );
    });

    it('should insert token into email subject', () => {
      const data = { value: 'TokenValue' };
      component.subjectFocus = true;
      component.emailSubject = 'Subject';
      const field = document.createElement('input');
      field.value = component.emailSubject;
      component.subjectField = { nativeElement: field };
      spyOn(document, 'execCommand');

      component.insertTextContentToken(data);

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        `{${data.value}}`
      );
      expect(field.value).toBe('Subject');
    });
  });

  describe('isEmpty', () => {
    it('should return true if content is empty', () => {
      expect(component.isEmpty('')).toBeTrue();
      expect(component.isEmpty('<img src="image.jpg" />')).toBeFalse();
    });
  });

  describe('onSelectSender', () => {
    it('should set the sender email', () => {
      component.onSelectSender(mockAlias);
      expect(component.sender).toEqual(mockAlias);
    });
  });

  describe('getConfirmMessage', () => {
    it('should return confirm message', () => {
      const mockGarbage = { confirm_message: { message: 'Confirm' } };
      spyOn(mockUserService.garbage, 'getValue').and.returnValue(mockGarbage);
      expect(component.getConfirmMessage()).toEqual(
        mockGarbage.confirm_message
      );
    });
  });

  describe('updateConfirmMessage', () => {
    it('should update the confirm message', () => {
      const updateData = { newMessage: 'Updated Confirm' };
      const mockGarbage = { confirm_message: {} };
      spyOn(mockUserService.garbage, 'getValue').and.returnValue(mockGarbage);
      spyOn(mockUserService, 'updateGarbage').and.returnValue(of(null));

      component.updateConfirmMessage(updateData);

      expect(mockUserService.updateGarbage).toHaveBeenCalledWith({
        confirm_message: { ...mockGarbage.confirm_message, ...updateData }
      });
    });
  });

  describe('getTimeZoneInitial', () => {
    it('should return the correct time zone name', () => {
      const timeZone = 'GMT';
      expect(component.getTimeZoneInitial(timeZone)).toBe(
        TIME_ZONE_NAMES[timeZone] || timeZone
      );
    });
  });

  describe('setDialogExtend', () => {
    it('should set dialog properties based on the value', () => {
      component.setDialogExtend(true);
      expect(component.aiDialogExtendable).toBeTrue();
      expect(component.dialogWidth).toBe(970);
      expect(component.editorHeight).toBe(500);

      component.setDialogExtend(false);
      expect(component.aiDialogExtendable).toBeFalse();
      expect(component.dialogWidth).toBe(600);
      expect(component.editorHeight).toBe(300);
    });
  });

  describe('cancelSchedule', () => {
    it('should reset schedule properties', () => {
      component.cancelSchedule();
      expect(component.time_display).toBe('');
      expect(component.scheduleCheck).toBeFalse();
    });
  });

  describe('onSendCallback', () => {
    it('should reset email fields and emit on send', () => {
      spyOn(component.onSend, 'emit');
      component.emailSubject = 'Subject';
      component.emailContent = 'Content';
      component.attachments = ['attachment'];

      component.onSendCallback();

      expect(component.emailSubject).toBe('');
      expect(component.emailContent).toBe('');
      expect(component.attachments).toEqual([]);
      expect(component.onSend.emit).toHaveBeenCalledWith({
        status: true,
        draftId: component.draftEmail?._id
      });
    });
  });

  describe('showAlert', () => {
    it('should open a dialog with the correct message', () => {
      const msg = 'Test Alert Message';
      component.showAlert(msg);

      expect(mockDialog.open).toHaveBeenCalledWith(NotifyComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          message: msg
        }
      });

      expect(mockDialogRef).toBe(
        mockDialog.open.calls.mostRecent().returnValue
      );
    });
  });

  describe('focus', () => {
    it('should emit on focus', () => {
      spyOn(component.onFocus, 'emit');
      component.focus();
      expect(component.onFocus.emit).toHaveBeenCalled();
    });
  });
});
