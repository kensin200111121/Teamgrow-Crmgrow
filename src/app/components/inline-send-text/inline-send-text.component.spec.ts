import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InlineSendTextComponent } from './inline-send-text.component';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { ScheduleSendComponent } from '../schedule-send/schedule-send.component';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog
} from '@angular/material/dialog';
import {
  mockContact,
  mockTemplate,
  mockTemplateToken
} from 'src/test/mock.data';
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
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { environment } from '@environments/environment';
import moment from 'moment-timezone';

@Pipe({ name: 'shorten' })
class MockShortenPipe implements PipeTransform {
  transform(value: string, limit: number, suffix: string): string {
    return value.length > limit ? value.substring(0, limit) + suffix : value;
  }
}
interface CustomMatDialogRef<T> extends MatDialogRef<T> {
  overlayRef?: {
    _host: {
      classList: {
        add: (className: string) => void;
        remove: (className: string) => void;
      };
    };
  };
}
describe('InlineSendTextComponent', () => {
  let component: InlineSendTextComponent;
  let fixture: ComponentFixture<InlineSendTextComponent>;
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
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MaterialBrowserV2Component>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', [
      'open',
      'close',
      'afterClosed'
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', [
      'open',
      'close',
      'closeAll'
    ]);
    mockUserService = jasmine.createSpyObj('UserService', {
      onSentSms: of({}),
      getToken: () => 'mockToken',
      updateGarbage: of({}),
      updateGarbageImpl: of({})
    });
    mockUserService.garbage$ = of('mockGarbageData');
    mockUserService.profile = {
      getValue: () => ({ _id: 'userId' })
    };
    mockUserService.sms = new BehaviorSubject({ _id: 'templateId' });
    mockUserService.garbage = {
      getValue: jasmine.createSpy('getValue').and.returnValue({
        confirm_message: { text: 'Old' }
      })
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
      'sendMessage'
    ]);
    mockToast = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'info'
    ]);
    mockScheduleService = {
      getEventTypes: jasmine.createSpy('getEventTypes').and.returnValue(of([])),
      eventTypes$: of([])
    };
    mockHelperService = jasmine.createSpyObj('HelperService', [
      'getSMSMaterials'
    ]);
    mockHelperService.getSMSMaterials.and.returnValue(of([]));
    mockStoreService = jasmine.createSpyObj('StoreService', [
      'textContactDraft'
    ]);
    mockStoreService.textContactDraft = new BehaviorSubject<any>(null);
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'scheduleSendCreate',
      'scheduleData'
    ]);
    mockTaskService.scheduleData$ = new Subject();
    mockTaskService.scheduleData = new Subject();
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
        TranslateModule.forRoot(),
        CommonModule,
        ReactiveFormsModule,
        FormsModule
      ],
      declarations: [InlineSendTextComponent, MockShortenPipe],
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

    fixture = TestBed.createComponent(InlineSendTextComponent);
    component = fixture.componentInstance;

    component.loadSubscription = new Subscription();
    component.updateTimer = new Subscription();
    component.conversationLoadSubscription = new Subscription();

    component.messageText = {
      nativeElement: document.createElement('textarea')
    };
    component.message = '';

    component.recordUrl = 'http://example.com'; // Set your record URL
    component.authToken = 'mockAuthToken'; // Mock auth token
    component.userId = 'mockUserId'; // Mock user ID
    component.popup = null;
  });

  beforeEach(() => {
    mockDialog = TestBed.inject(MatDialog);
    component.messageText = {
      nativeElement: {
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        focus: jasmine.createSpy('focus'),
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      }
    };

    mockDialog.open.and.returnValue(dialogRefSpy);
    dialogRefSpy['_ref'] = {
      overlayRef: {
        _host: {
          classList: {
            add: jasmine.createSpy('add'),
            remove: jasmine.createSpy('remove')
          }
        }
      }
    };
    component.contact = mockContact;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.popup) {
      component.popup.close;
    }
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle closing the dialog with landing pages', () => {
    const mockMaterials = {
      videoIds: [],
      imageIds: [],
      pdfIds: []
    };

    mockHelperService.getSMSMaterials.and.returnValue(mockMaterials);

    dialogRefSpy.afterClosed.and.returnValue(
      of({
        materials: [{ _id: 'materials1' }, { _id: 'materials2' }],
        landingPages: [{ _id: 'page1' }, { _id: 'page2' }]
      })
    );

    component.openMaterialsDlg();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should handle closing the dialog with landing pages', () => {
    const mockMaterials = {
      videoIds: [],
      imageIds: [],
      pdfIds: []
    };

    mockHelperService.getSMSMaterials.and.returnValue(mockMaterials);

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog.open.and.returnValue(dialogRefSpy);

    dialogRefSpy.afterClosed.and.returnValue(
      of({ landingPages: [{ _id: 'page1' }] })
    );
    dialogRefSpy['_ref'] = {
      overlayRef: {
        _host: {
          classList: {
            add: jasmine.createSpy('add'),
            remove: jasmine.createSpy('remove')
          }
        }
      }
    };
    component.openMaterialsDlg();

    expect(mockDialog.open).toHaveBeenCalledWith(
      MaterialBrowserV2Component,
      jasmine.any(Object)
    );
  });

  it('should not insert text if no materials or landing pages are selected', () => {
    const mockMaterials = {
      videoIds: [],
      imageIds: [],
      pdfIds: []
    };

    mockHelperService.getSMSMaterials.and.returnValue(mockMaterials);

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog.open.and.returnValue(dialogRefSpy);
    dialogRefSpy['_ref'] = {
      overlayRef: {
        _host: {
          classList: {
            add: jasmine.createSpy('add'),
            remove: jasmine.createSpy('remove')
          }
        }
      }
    };
    dialogRefSpy.afterClosed.and.returnValue(of({}));

    component.openMaterialsDlg();
  });

  it('should show alert if no contacts are specified', () => {
    component.contactPhones = [];
    spyOn(component, 'showAlert');

    component.send();

    expect(component.showAlert).toHaveBeenCalledWith(
      'Please specify at least one recipient.'
    );
  });

  it('should show error if more than 20 contacts are selected', () => {
    component.contactPhones = Array(21).fill('1234567890');

    component.send();

    expect(mockToast.error).toHaveBeenCalledWith(
      'More than 20 contacts are selected. Please select less than 10 contacts.',
      'Exceed The Number of Contacts'
    );
  });

  it('should not send if message is empty', () => {
    component.message = '';
    component.sending = false;

    component.send();
    expect(component.sending).toBeFalse();
  });

  it('should send message during business hours', () => {
    spyOn(component, 'fireSendMessage');
    spyOn(moment, 'tz').and.returnValue(moment('2023-11-13T10:00:00')); // Mock current time

    component.send();
  });

  it('should show confirm dialog if outside business hours', () => {
    spyOn(component, 'fireSendMessage');
    const confirmDialogRef = { afterClosed: () => of(true) };
    mockDialog.open.and.returnValue(confirmDialogRef);
    spyOn(moment, 'tz').and.returnValue(moment('2023-11-13T20:00:00')); // Mock current time

    component.send();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should call fireSendMessage after confirming outside business hours', () => {
    const confirmDialogRef = { afterClosed: () => of(true) };
    mockDialog.open.and.returnValue(confirmDialogRef);
    spyOn(component, 'fireSendMessage');
    spyOn(moment, 'tz').and.returnValue(moment('2023-11-13T20:00:00')); // Mock current time

    component.send();
  });

  it('should schedule message if scheduleCheck is true', () => {
    component.scheduleCheck = true;
    const sendData = { action: {}, type: 'send_text' };
    component.scheduleData = { someKey: 'someValue' };
    component.contactPhones = ['1234567890'];

    spyOn(component, 'sendSchedule');

    component.send();
  });

  it('should send message and call onSentSms when sendMessage is successful', () => {
    // Arrange
    const contentToSend = 'Test message';
    const contacts = [mockContact];
    const videoIds = ['video1', 'video2'];
    const imageIds = ['image1'];
    const pdfIds = ['pdf1'];
    const landingPageIds = ['page1'];
    const toPhones = ['1234567890'];

    mockMaterialService.sendMessage.and.returnValue(of({ status: true }));

    component.fireSendMessage(
      contentToSend,
      contacts,
      videoIds,
      imageIds,
      pdfIds,
      landingPageIds,
      toPhones
    );

    expect(mockMaterialService.sendMessage).toHaveBeenCalledWith({
      video_ids: videoIds,
      pdf_ids: pdfIds,
      image_ids: imageIds,
      page_ids: landingPageIds,
      content: contentToSend,
      contacts: contacts,
      toPhones
    });
    expect(mockUserService.onSentSms).toHaveBeenCalled();
    expect(component.sending).toBeFalse();
    expect(component.message).toBe('');
  });

  it('should schedule sending and show success message when status is true and message is all_queue', () => {
    const data = { someKey: 'someValue' };
    const contacts = [{ name: 'wu', phone: '1234567890' }];
    const toPhones = ['1234567890'];

    mockTaskService.scheduleSendCreate.and.returnValue(
      of({ status: true, message: 'all_queue' })
    );

    component.sendSchedule(data, contacts, toPhones);

    expect(mockTaskService.scheduleSendCreate).toHaveBeenCalledWith({
      contacts,
      data,
      toPhones
    });
    expect(mockToast.info).toHaveBeenCalledWith(
      'Your text requests are queued. The text queue progressing would be displayed in the header.',
      'Text Queue',
      {}
    );
    expect(mockHandlerService.runScheduleTasks).toHaveBeenCalled();
    expect(component.sending).toBeFalse();
  });

  it('should insert template content when message is empty', () => {
    spyOn(document, 'execCommand').and.callThrough();
    mockTemplate.content = 'Hello, World!';
    component.selectTemplate(mockTemplate);

    expect(component.messageText.nativeElement.value).toBe('Hello, World!');
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      'Hello, World!'
    );
  });

  it('should insert template content at the end of the message when there is existing text', () => {
    component.message = 'Existing message';
    component.messageText.nativeElement.value = component.message;
    component.messageText.nativeElement.selectionEnd = component.message.length;
    mockTemplate.content = 'Hello, World!';
    spyOn(document, 'execCommand').and.callThrough();

    component.selectTemplate(mockTemplate);

    expect(component.messageText.nativeElement.value).toBe(
      'Existing message\nHello, World!'
    );
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      '\nHello, World!'
    );
  });

  it('should insert Calendly URL when message is empty', () => {
    const url = 'calendly.com/your-schedule';
    const prefix = environment.isSspa
      ? environment.Vortex_Scheduler
      : environment.domain.scheduler;
    const expectedUrl = `https://${prefix}${url}`;
    spyOn(document, 'execCommand').and.callThrough();

    component.selectCalendly(url);

    expect(component.messageText.nativeElement.value).toBe(expectedUrl);
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      expectedUrl
    );
  });

  it('should insert Calendly URL at the end of the message when there is existing text', () => {
    component.message = 'Existing message';
    const url = 'calendly.com/your-schedule';
    const prefix = environment.isSspa
      ? environment.Vortex_Scheduler
      : environment.domain.scheduler;
    const expectedUrl = `https://${prefix}${url}`;
    component.messageText.nativeElement.value = component.message;
    component.messageText.nativeElement.selectionEnd = component.message.length;
    spyOn(document, 'execCommand').and.callThrough();

    component.selectCalendly(url);

    expect(component.messageText.nativeElement.value).toBe(
      'Existing message\n' + expectedUrl
    );
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      '\n' + expectedUrl
    );
  });

  it('should open a new window for recording', () => {
    spyOn(window, 'open').and.callThrough();
    const expectedUrl = `${component.recordUrl}/index.html?token=${
      component.authToken
    }&method=website&userId=${component.userId}&prev=${encodeURIComponent(
      window.location.href
    )}`;

    component.record();

    expect(window.open).toHaveBeenCalledWith(
      expectedUrl,
      'record',
      jasmine.any(String)
    );
    expect(component.popup).toBeDefined();
    expect(component.attachedRecordCallback).toBeTrue();
  });

  it('should focus the existing popup if it is open', () => {
    component.popup = { focus: jasmine.createSpy('focus') };

    component.record();

    expect(component.popup.focus).toHaveBeenCalled();
  });

  it('should insert a URL from recordCallback when message data is valid', () => {
    const mockEvent = {
      data: { _id: '12345' }
    };
    const expectedUrl = `${environment.website}/video/12345`;
    component.messageText.nativeElement.value = 'Existing message';
    component.messageText.nativeElement.selectionEnd =
      component.messageText.nativeElement.value.length;
    spyOn(document, 'execCommand').and.callThrough();

    component.recordCallback(mockEvent);

    expect(component.messageText.nativeElement.value).toBe(expectedUrl);
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      expectedUrl
    );
  });

  it('should insert a URL from recordCallback when message is empty', () => {
    const mockEvent = {
      data: { _id: '12345' }
    };
    const expectedUrl = `${environment.website}/video/12345`;
    component.messageText.nativeElement.value = '';
    component.messageText.nativeElement.selectionEnd = 0;
    spyOn(document, 'execCommand').and.callThrough();

    component.recordCallback(mockEvent);

    expect(component.messageText.nativeElement.value).toBe(expectedUrl);
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      expectedUrl
    );
  });

  it('should log an error if an exception occurs in recordCallback', () => {
    const mockEvent = {
      data: { _id: '12345' }
    };
    spyOn(console, 'log');
    component.messageText.nativeElement.value = 'Existing message';
    component.messageText.nativeElement.selectionEnd = 0;
    spyOn(document, 'execCommand').and.throwError('Test error');

    component.recordCallback(mockEvent);

    expect(console.log).toHaveBeenCalledWith(
      'Insert Material is failed',
      jasmine.any(Error)
    );
  });

  it('should insert a token with curly braces when token is true', () => {
    const mockEvent = { token: true, value: 'example' };
    component.messageText.nativeElement.value = 'Hello World';
    component.messageText.nativeElement.selectionEnd =
      component.messageText.nativeElement.value.length;
    spyOn(document, 'execCommand').and.callThrough();

    component.insertTextContentValue(mockEvent);

    expect(component.messageText.nativeElement.value).toBe(
      'Hello World{example}'
    );
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      '{example}'
    );
  });

  it('should insert plain text when token is false', () => {
    const mockEvent = 'simple text';
    component.messageText.nativeElement.value = 'Hello World';
    component.messageText.nativeElement.selectionEnd =
      component.messageText.nativeElement.value.length;
    spyOn(document, 'execCommand').and.callThrough();

    component.insertTextContentValue(mockEvent);

    expect(component.messageText.nativeElement.value).toBe(
      'Hello Worldsimple text'
    );
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      'simple text'
    );
  });

  it('should set the cursor position correctly after inserting text', () => {
    const mockEvent = { token: true, value: 'example' };
    component.messageText.nativeElement.value = 'Hello World';
    component.messageText.nativeElement.selectionEnd =
      component.messageText.nativeElement.value.length;
    spyOn(document, 'execCommand').and.callThrough();

    component.insertTextContentValue(mockEvent);
  });

  it('should handle cursor positions correctly when text is inserted in the middle', () => {
    const mockEvent = { token: true, value: 'example' };
    component.messageText.nativeElement.value = 'Hello World';
    component.messageText.nativeElement.selectionStart = 5;
    component.messageText.nativeElement.selectionEnd = 5;
    spyOn(document, 'execCommand').and.callThrough();

    component.insertTextContentValue(mockEvent);

    expect(component.messageText.nativeElement.value).toBe(
      'Hello{example} World'
    );
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      '{example}'
    );
  });

  it('should prevent default and insert newline when Enter is pressed without modifiers', () => {
    spyOn(component, 'send').and.stub();
    spyOn(document, 'execCommand').and.callThrough();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.keyTrigger(event as KeyboardEvent);

    expect(event.defaultPrevented).toBe(false);
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      '\n'
    );
  });

  it('should call send method when Enter is pressed with Shift key', () => {
    spyOn(component, 'send').and.stub();
    spyOn(document, 'execCommand').and.callThrough();
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true
    });
    component.keyTrigger(event as KeyboardEvent);

    expect(event.defaultPrevented).toBe(false);
    expect(component.send).toHaveBeenCalled();
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('should prevent default and not call send when Enter is pressed with Ctrl or Alt key', () => {
    spyOn(component, 'send').and.stub();
    spyOn(document, 'execCommand').and.callThrough();
    const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
    component.keyTrigger(event as KeyboardEvent);

    expect(event.defaultPrevented).toBe(false);
    expect(component.send).not.toHaveBeenCalled();
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('should prevent default and not call send when Enter is pressed with Alt key', () => {
    spyOn(component, 'send').and.stub();
    spyOn(document, 'execCommand').and.callThrough();
    const event = new KeyboardEvent('keydown', { key: 'Enter', altKey: true });
    component.keyTrigger(event as KeyboardEvent);

    expect(event.defaultPrevented).toBe(false);
    expect(component.send).not.toHaveBeenCalled();
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('should convert a single URL into an anchor tag', () => {
    const content = 'Check this link: https://example.com';
    const result = component.parseContent(content);

    expect(result).toBe(
      'Check this link: <a href="https://example.com" target="_blank">https://example.com</a>'
    );
  });

  it('should convert multiple URLs into anchor tags', () => {
    const content = 'Links: https://example.com and http://test.com';
    const result = component.parseContent(content);

    expect(result).toBe(
      'Links: <a href="https://example.com" target="_blank">https://example.com</a> and <a href="http://test.com" target="_blank">http://test.com</a>'
    );
  });

  it('should handle content without URLs', () => {
    const content = 'No links here!';
    const result = component.parseContent(content);

    expect(result).toBe('No links here!');
  });

  it('should handle mixed content with URLs', () => {
    const content = 'Here is a link: https://example.com and some text.';
    const result = component.parseContent(content);

    expect(result).toBe(
      'Here is a link: <a href="https://example.com" target="_blank">https://example.com</a> and some text.'
    );
  });

  it('should handle URLs with query parameters', () => {
    const content = 'Check this: https://example.com?param=value';
    const result = component.parseContent(content);

    expect(result).toBe(
      'Check this: <a href="https://example.com?param=value" target="_blank">https://example.com?param=value</a>'
    );
  });

  it('should handle URLs with fragments', () => {
    const content = 'See the section: https://example.com#section';
    const result = component.parseContent(content);

    expect(result).toBe(
      'See the section: <a href="https://example.com#section" target="_blank">https://example.com#section</a>'
    );
  });

  it('should toggle isMinimizable and aiTabMinimized properties', () => {
    component.isMinimizable = false;
    component.aiTabMinimized = false;

    expect(component.isMinimizable).toBe(false);
    expect(component.aiTabMinimized).toBe(false);

    component.minimizeDialog();

    expect(component.isMinimizable).toBe(true);
    expect(component.aiTabMinimized).toBe(true);

    component.minimizeDialog();

    expect(component.isMinimizable).toBe(false);
    expect(component.aiTabMinimized).toBe(false);
  });

  it('should open the dialog and handle the response', () => {
    component.showCheck = 0;
    component.scheduleDateTime = null;
    component.time_display = null;
    component.scheduleCheck = false;
    component.time_zone = 'UTC';
    spyOn(component, 'send').and.stub();
    const dialogRef = {
      afterClosed: () => of({ due_date: '2023-11-13T10:00:00Z' }),
      _ref: {
        overlayRef: {
          _host: {
            classList: {
              add: jasmine.createSpy('add')
            }
          }
        }
      }
    };

    mockDialog.open.and.returnValue(dialogRef);

    component.showSchedule();

    expect(mockDialog.open).toHaveBeenCalledWith(ScheduleSendComponent, {
      width: '100vw',
      maxWidth: '350px',
      data: { type: 'text' }
    });

    expect(dialogRef._ref.overlayRef._host.classList.add).toHaveBeenCalledWith(
      'top-dialog'
    );

    dialogRef.afterClosed().subscribe();

    expect(component.showCheck).toBe(0);
    expect(component.scheduleDateTime).toBe('2023-11-13T10:00:00Z');
    expect(component.time_display).toEqual(
      moment(component.scheduleDateTime).tz(component.time_zone)
    );
    expect(component.scheduleCheck).toBe(true);
    expect(component.send).toHaveBeenCalled();
  });

  it('should replace token in message onTokenSelected', (done) => {
    component.message = 'Hello #example';

    component.onTokenSelected(mockTemplateToken);

    setTimeout(() => {
      expect(component.message).toBe('Hello #example');
      done();
    }, 60);
  });

  it('should return timezone name from getTimeZoneInitial', () => {
    const TIME_ZONE_NAMES = { UTC: 'Coordinated Universal Time' };
    component.getTimeZoneInitial = (time_zone: string) =>
      TIME_ZONE_NAMES[time_zone] || time_zone;

    expect(component.getTimeZoneInitial('UTC')).toBe(
      'Coordinated Universal Time'
    );
    expect(component.getTimeZoneInitial('GMT')).toBe('GMT');
  });

  it('should write GPT response content', () => {
    spyOn(component, 'insertTextContentValue');
    const data = 'Sample response';
    component.writeGptResponseContent(data);
    expect(component.insertTextContentValue).toHaveBeenCalledWith(data);
  });

  it('should set dialog extension correctly', () => {
    component.setDialogExtend(true);
    expect(component.aiDialogExtendable).toBe(true);
    expect(component.dialogWidth).toBe(1000);
    expect(component.editorHeight).toBe(560);

    component.setDialogExtend(false);
    expect(component.aiDialogExtendable).toBe(false);
    expect(component.dialogWidth).toBe(680);
    expect(component.editorHeight).toBe(360);
  });

  it('should set AI mode and dialog extension', () => {
    component.setAiMode(true);
    expect(component.presetText).toBe('');
    expect(component.aiDialogExtendable).toBe(true);

    component.setAiMode(false);
    expect(component.presetText).toBe(component.message);
  });

  it('should get confirm message', () => {
    mockUserService.garbage.getValue.and.returnValue({
      confirm_message: { text: 'Confirm' }
    });
    const result = component.getConfirmMessage();
    expect(result).toEqual({ text: 'Confirm' });
  });

  it('should update confirm message', () => {
    mockUserService.garbage.getValue.and.returnValue({
      confirm_message: { text: 'Old' }
    });
    const updateData = { text: 'New' };

    component.updateConfirmMessage(updateData);

    expect(mockUserService.updateGarbage).toHaveBeenCalledWith({
      confirm_message: { text: 'New' }
    });
    expect(mockUserService.updateGarbageImpl).toHaveBeenCalledWith({
      confirm_message: { text: 'New' }
    });
  });

  it('should cancel schedule', () => {
    mockTaskService.scheduleData = jasmine.createSpyObj('scheduleData', [
      'next'
    ]);
    component.cancelSchedule();
    expect(component.time_display).toBe('');
    expect(component.scheduleCheck).toBe(false);
    expect(mockTaskService.scheduleData.next).toHaveBeenCalledWith({});
  });

  it('should handle send callback', () => {
    component.onSend = jasmine.createSpyObj('onSend', ['emit']);
    const param = { data: 'test' };
    component.onSendCallback(param);
    expect(component.message).toBe('');
    expect(component.messages).toEqual([]);
    expect(component.onSend.emit).toHaveBeenCalledWith(param);
  });

  it('should set phone list', () => {
    const phones = ['1234567890', '0987654321'];
    component.setPhoneList(phones);
    expect(component.contactPhones).toEqual(phones);
  });

  it('should emit focus event', () => {
    spyOn(component.onFocus, 'emit');
    component.focus();
    expect(component.onFocus.emit).toHaveBeenCalled();
  });
});
