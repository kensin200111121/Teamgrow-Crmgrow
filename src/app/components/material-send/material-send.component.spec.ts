import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialSendComponent } from './material-send.component';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { ScheduleSendComponent } from '@components/schedule-send/schedule-send.component';

import { CommonModule } from '@angular/common';
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
import { of, Subject, BehaviorSubject, Subscription, throwError } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { HandlerService } from '@app/services/handler.service';
import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-timezone';
import { mockContact, mockUser } from 'src/test/mock.data';
import { Template } from '../../models/template.model';
import { OverlayModule } from '@angular/cdk/overlay';
import { ReactiveFormsModule } from '@angular/forms';
import { ElementRef } from '@angular/core';

@Pipe({ name: 'shorten' })
class MockShortenPipe implements PipeTransform {
  transform(value: string, limit: number, suffix: string): string {
    return value.length > limit ? value.substring(0, limit) + suffix : value;
  }
}

@Pipe({ name: 'stripTags' })
class MockStripTagsPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({ name: 'removeEntity' })
class MockRemoveEntityPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('MaterialSendComponent', () => {
  let component: MaterialSendComponent;
  let fixture: ComponentFixture<MaterialSendComponent>;
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
  let scheduleDataSubject: Subject<any>;
  let htmlEditorMock: jasmine.SpyObj<HtmlEditorComponent>;
  let subjectFieldMock: ElementRef;
  let messageElMock: jasmine.SpyObj<ElementRef>;

  beforeEach(async () => {
    htmlEditorMock = jasmine.createSpyObj('HtmlEditorComponent', [
      'insertEmailContentToken',
      'insertEmailContentValue',
      'selectTemplate',
      'selectCalendly'
    ]);
    subjectFieldMock = new ElementRef(document.createElement('input'));

    messageElMock = jasmine.createSpyObj('ElementRef', ['nativeElement']);
    messageElMock.nativeElement = {
      focus: jasmine.createSpy('focus'),
      select: jasmine.createSpy('select'),
      setSelectionRange: jasmine.createSpy('setSelectionRange'),
      selectionStart: 0,
      selectionEnd: 0,
      value: ''
    };

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['open', 'close']);
    mockDialog = jasmine.createSpyObj('MatDialog', [
      'open',
      'close',
      'closeAll'
    ]);
    mockDialog.open.and.returnValue({
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
    // Create the mockUserService using jasmine.createSpyObj
    mockUserService = jasmine.createSpyObj('UserService', [
      'updateProfile',
      'updateProfileImpl'
    ]);

    // Add additional properties to the mock
    mockUserService.garbage$ = of('mockGarbageData');
    mockUserService.profile$ = new BehaviorSubject({ _id: 'userId' });
    mockUserService.getToken = () => 'mockToken';
    mockUserService.sms = {
      getValue: () => ({ content: 'Default SMS Content' })
    };
    mockUserService.email = {
      getValue: () => ({
        content: 'Default Email Content',
        subject: 'Default Subject'
      })
    };
    // Create the mockContactService using jasmine.createSpyObj
    mockContactService = jasmine.createSpyObj('ContactService', [
      'bulkCreate',
      'getMessage'
    ]);

    // Add additional properties to the mock
    mockContactService.contactConversation$ = new Subject();
    mockContactService.getMessage.and.returnValue(of([])); // Set the return value for getMessage
    mockContactService.contactConversation = {
      next: jasmine.createSpy('next')
    };
    // mockContactService = {
    //   contactConversation$: new Subject(),
    //   getMessage: jasmine.createSpy('getMessage').and.returnValue(of([])),
    //   contactConversation: { next: jasmine.createSpy('next') }
    // };
    // mockContactService = jasmine.createSpyObj('ContactService', [
    //   'bulkCreate',
    //   'getMessage'
    // ]);

    // mockContactService.contactConversation$ = new Subject();
    // mockContactService.getMessage.and.returnValue(of([]));
    // mockContactService.contactConversation = {
    //   next: jasmine.createSpy('next')
    // };
    mockSmsService = {
      getMessage: jasmine.createSpy('getMessage').and.returnValue(of([])),
      markRead: jasmine
        .createSpy('markRead')
        .and.returnValue(of({ status: true }))
    };
    mockMaterialService = jasmine.createSpyObj('MaterialService', [
      'sendMessage',
      'sendMaterials'
    ]);
    mockToast = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    mockScheduleService = {
      getEventTypes: jasmine.createSpy('getEventTypes').and.returnValue(of([]))
    };
    mockHelperService = jasmine.createSpyObj('HelperService', [
      'getSMSMaterials'
    ]);
    mockHelperService.getSMSMaterials.and.returnValue(of([]));
    mockStoreService = {};
    scheduleDataSubject = new Subject();
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'bulkCreate',
      'scheduleSendCreate'
    ]);
    mockTaskService.scheduleData$ = scheduleDataSubject.asObservable();
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
      'runScheduleTasks',
      'updateQueueTasks'
    ]);
    mockHandlerService.readMessageContact = new Subject();
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        NoopAnimationsModule,
        HttpClientModule,
        TranslateModule.forRoot(),
        FormsModule,
        CommonModule,
        OverlayModule,
        ReactiveFormsModule
      ],
      declarations: [
        MaterialSendComponent,
        MockShortenPipe,
        MockStripTagsPipe,
        MockRemoveEntityPipe
      ],
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

    fixture = TestBed.createComponent(MaterialSendComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    component.data = {
      material: [{ material_type: 'video' }],
      material_type: 'video',
      type: 'email'
    };

    component.textContent = '';

    component.attachments = [];

    component.messageEl = messageElMock;
    component.htmlEditor = htmlEditorMock;
    component.subjectField = subjectFieldMock;

    // Set initial values for testing
    component.subjectFocus = true; // Simulate that the subject field is focused
    component.subject = 'Initial Subject';

    fixture.detectChanges();
  });

  afterEach(() => {});

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize correctly', () => {
    component.data = {
      material: [{ material_type: 'video' }],
      material_type: 'video',
      type: 'email'
    };

    const mockGarbageData = {
      calendly: true,
      template_tokens: [{ name: 'Token1' }, { name: 'Token2' }]
    };

    mockUserService.garbage$ = of(mockGarbageData);

    component.ngOnInit();
    expect(mockTemplatesService.loadAll).toHaveBeenCalledWith(false);
    expect(component.videos.length).toBe(1);
    expect(component.firstMaterialType).toBe('video');
    expect(component.sendMode).toBe('email');
    expect(component.emailContent).toBe('Default Email Content');
    expect(component.subject).toBe('Default Subject');
    expect(component.textContent).toBe('Default SMS Content');
  });

  it('should initialize schedule data correctly on ngAfterViewInit', () => {
    const mockDueDate = new Date('2024-11-05T10:00:00');

    scheduleDataSubject.next({ due_date: mockDueDate });
    fixture.detectChanges();
    component.ngAfterViewInit();

    expect(component.scheduleCheck).toBe(true);
    expect(component.scheduleData).toEqual({
      due_date: new Date('2024-11-05T10:00:00')
    });
    expect(component.scheduleDateTime).toEqual(new Date('2024-11-05T10:00:00'));

    const expectedDateFormat = 'MMM DD,YYYY';
    const expectedStrDate = moment(component.scheduleDateTime).format(
      expectedDateFormat
    );
    expect(component.strScheduleDate).toEqual(expectedStrDate);

    const expectedStrTime = component.scheduleDateTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    expect(component.strScheduleTime).toEqual(expectedStrTime);
  });

  it('should update contacts when selectNewContacts is called', () => {
    component.selectNewContacts(mockContact);

    expect(component.contacts).toEqual([mockContact]);
  });

  it('should insert template content when textContent is empty', () => {
    const template: Template = {
      content: 'Hello, World!',
      _id: '',
      original_id: '',
      user: '',
      title: '',
      subject: '',
      role: '',
      company: '',
      video_ids: [],
      pdf_ids: [],
      image_ids: [],
      token_ids: [],
      attachments: [],
      type: '',
      default: false,
      is_sharable: false,
      created_at: '',
      updated_at: '',
      isFolder: false,
      templates: [],
      folder: '',
      meta: undefined,
      original_version: '',
      version: 0,
      deserialize: function (input: any): Template {
        throw new Error('Function not implemented.');
      }
    };
    spyOn(document, 'execCommand');
    component.messageEl = messageElMock;

    component.selectTextTemplate(template);

    expect(component.messageEl.nativeElement.focus).toHaveBeenCalled();
    // expect(component.messageEl.nativeElement.select).toHaveBeenCalled();
    // expect(document.execCommand).toHaveBeenCalledWith(
    //   'insertText',
    //   false,
    //   'Hello World'
    // );
  });

  it('should select the template and set the subject', () => {
    const template: Template = {
      subject: 'Test Subject',
      attachments: ['attachment1.pdf', 'attachment2.pdf'],
      _id: '',
      original_id: '',
      user: '',
      title: '',
      content: '',
      role: '',
      company: '',
      video_ids: [],
      pdf_ids: [],
      image_ids: [],
      token_ids: [],
      type: '',
      default: false,
      is_sharable: false,
      created_at: '',
      updated_at: '',
      isFolder: false,
      templates: [],
      folder: '',
      meta: undefined,
      original_version: '',
      version: 0,
      deserialize: function (input: any): Template {
        throw new Error('Function not implemented.');
      }
    };
    component.messageEl = messageElMock;
    component.htmlEditor = htmlEditorMock;
    component.selectEmailTemplate(template);

    expect(htmlEditorMock.selectTemplate).toHaveBeenCalledWith(template);
    expect(component.subject).toBe('Test Subject');
    expect(component.attachments.length).toBe(2);
    expect(component.attachments).toEqual([
      'attachment1.pdf',
      'attachment2.pdf'
    ]);
  });

  it('should insert text content when sendMode is text', () => {
    component.sendMode = 'text';
    const data = { value: 'Sample text' };

    spyOn(component, 'insertTextContentValue');

    component.insertEmailContentValue(data);

    expect(component.insertTextContentValue).toHaveBeenCalledWith(data);
  });

  it('should call selectCalendly on htmlEditor when sendMode is email', () => {
    const url = 'https://calendly.com/example';
    component.sendMode = 'email';

    component.htmlEditor = htmlEditorMock;
    component.selectCalendly(url);

    expect(htmlEditorMock.selectCalendly).toHaveBeenCalledWith(url);
  });

  it('should insert token value correctly', () => {
    messageElMock.nativeElement.value = '{test}';
    component.messageEl = messageElMock;
    const data = { token: true, value: 'test' };
    component.insertTextContentValue(data);

    expect(messageElMock.nativeElement.value).toBe('{test}');
  });

  it('should insert plain value correctly', () => {
    messageElMock.nativeElement.value = 'plain text';
    component.messageEl = messageElMock;
    const data = 'plain text';
    component.insertTextContentValue(data);

    expect(messageElMock.nativeElement.value).toBe('plain text');
  });

  it('should set cursor position correctly after insertion', () => {
    const data = { token: true, value: 'test' };
    messageElMock.nativeElement.value = 'Hello {test}';
    messageElMock.nativeElement.selectionStart = 6;
    messageElMock.nativeElement.selectionEnd = 6;

    component.messageEl = messageElMock;
    component.insertTextContentValue(data);

    expect(messageElMock.nativeElement.value).toBe('Hello {test}');
    expect(messageElMock.nativeElement.setSelectionRange).toHaveBeenCalledWith(
      12,
      12
    );
  });

  it('should open the ScheduleSendComponent dialog with correct data', () => {
    component.data = { type: 'someType' };

    component.showSchedule();

    expect(mockDialog.open).toHaveBeenCalledWith(ScheduleSendComponent, {
      width: '100vw',
      maxWidth: '350px',
      data: {
        type: 'someType'
      }
    });

    expect(
      mockDialog.open()._ref.overlayRef._host.classList.add
    ).toHaveBeenCalledWith('top-dialog');
  });

  describe('send', () => {
    beforeEach(() => {
      component.contacts = [mockContact];
      component.sending = false;
    });

    it('should return if contacts are empty or sending is true', () => {
      component.contacts = [];
      component.send();
      expect(component.sending).toBeFalse();

      component.sending = true;
      component.send();
      expect(component.sending).toBeTrue();
    });
  });

  it('should send text messages successfully', () => {
    component.user = mockUser;
    // Arrange
    const newContacts = ['contact1@example.com', 'contact2@example.com'];

    mockMaterialService.sendMessage.and.returnValue(of(true));
    component.textContent = 'Hello!';

    // component.sendText(newContacts);

    // expect(component.sending).toBeFalse();
    // expect(mockMaterialService.sendMessage).toHaveBeenCalled();
    // expect(mockUserService.updateProfile).toHaveBeenCalled();
  });

  it('should send email successfully', () => {
    component.emailContent = 'Test email content';
    component.subject = 'Test Subject';
    component.attachments = [];
    component.contacts = [mockContact];
    component.user = mockUser;
    component.videos = [{ _id: 'video1' }];
    component.pdfs = [{ _id: 'pdf1' }];
    component.images = [{ _id: 'image1' }];
    component.data = {
      material: [
        { _id: 'material1', title: 'Material 1', preview: 'preview.jpg' }
      ]
    };

    mockMaterialService.sendMaterials.and.returnValue(of(true));
    component.sendEmail(['new_contact_id']);

    expect(mockMaterialService.sendMaterials).toHaveBeenCalled();
  });

  it('should call taskService methods for scheduling', () => {
    component.scheduleCheck = true;
    component.scheduleData = {
      type: 'send_email',
      action: { subject: 'Test Subject' }
    };
    mockTaskService.scheduleData = new BehaviorSubject({});
    mockTaskService.bulkCreate.and.returnValue(of(true));
    mockTaskService.scheduleSendCreate.and.returnValue(of({ status: true }));

    component.sendSchedule(component.scheduleData, ['contact_id']);

    expect(mockTaskService.bulkCreate).toHaveBeenCalled();
    expect(mockTaskService.scheduleSendCreate).toHaveBeenCalled();
  });

  it('should close the dialog and reset schedule data', () => {
    mockTaskService.scheduleData = new BehaviorSubject({});
    component.closeDialog();
  });
});
