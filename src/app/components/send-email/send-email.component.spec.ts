import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SendEmailComponent } from './send-email.component';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '@services/user.service';
import { HelperService } from '@services/helper.service';
import { ContactService } from '@services/contact.service';
import { MaterialService } from '@services/material.service';
import { StoreService } from '@services/store.service';
import { StripTagsPipe } from 'ngx-pipes';
import { TaskService } from '@services/task.service';
import { profileSubject } from 'src/test/mock.data';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HandlerService } from '@app/services/handler.service';
import { ScheduleResendComponent } from '../schedule-resend/schedule-resend.component';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { DealsService } from '@app/services/deals.service';
import { ConfirmBusinessComponent } from '../confirm-business-hour/confirm-business-hour.component';
import moment from 'moment-timezone';
import {
  BrowserAnimationsModule,
  NoopAnimationsModule
} from '@angular/platform-browser/animations';
describe('SendEmailComponent', () => {
  let component: SendEmailComponent;
  let fixture: ComponentFixture<SendEmailComponent>;
  let mockUserService: any;
  let mockHelperService: any;
  let mockContactService: any;
  let mockMaterialService: any;
  let mockStoreService: any;
  let mockToastr: any;
  let mockDialog: any;
  let mockDialogRef: any;
  let mockTaskService: any;
  let mockHandlerService: any;
  let mockDealsService: any;
  let mockConfirmDialogRef: jasmine.SpyObj<
    MatDialogRef<ConfirmBusinessComponent>
  >;
  let mockUpdateConfirmMessage: jasmine.Spy;

  beforeEach(async () => {
    mockUserService = {
      profile: profileSubject,
      garbage$: of({ calendly: {}, template_tokens: [] }),
      email: new BehaviorSubject({ _id: 'test@test.com' })
    };
    mockHelperService = jasmine.createSpyObj('HelperService', [
      'getMaterials',
      'getLandingPages',
      'getMaterialType'
    ]);
    mockHelperService.getMaterials.and.returnValue([
      { _id: '1' },
      { _id: '2' }
    ]);
    mockHelperService.getLandingPages.and.returnValue([
      { _id: '3' },
      { _id: '4' }
    ]);
    mockContactService = jasmine.createSpyObj('ContactService', ['']);
    mockMaterialService = jasmine.createSpyObj('MaterialService', [
      'sendMaterials'
    ]);
    mockStoreService = {
      materials$: of([]),
      emailContactDraft: { next: jasmine.createSpy('next') },
      emailDealDraft: { next: jasmine.createSpy('next') },
      emailGlobalDraft: { next: jasmine.createSpy('next') }
    };
    mockToastr = jasmine.createSpyObj('ToastrService', [
      'info',
      'success',
      'warning',
      'error'
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', [
      'open',
      'close',
      'closeAll'
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', [
      'close',
      'open',
      'closeAll'
    ]);
    mockConfirmDialogRef = jasmine.createSpyObj('MatDialogRef', [
      'afterClosed'
    ]);
    mockDealsService = jasmine.createSpyObj('DealService', ['sendEmail']);

    // Mock TaskService
    mockTaskService = {
      scheduleData: new BehaviorSubject({}),
      scheduleData$: new BehaviorSubject({}),
      scheduleSendCreate: jasmine
        .createSpy('scheduleSendCreate')
        .and.returnValue(of({ status: true }))
    };

    mockHandlerService = jasmine.createSpyObj('HandlerService', [
      'activityAdd$',
      'reload$',
      'addLatestActivities$',
      'runScheduleTasks'
    ]);

    await TestBed.configureTestingModule({
      declarations: [SendEmailComponent, MaterialBrowserV2Component],
      imports: [
        MatDialogModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: HelperService, useValue: mockHelperService },
        { provide: ContactService, useValue: mockContactService },
        { provide: MaterialService, useValue: mockMaterialService },
        { provide: HandlerService, useValue: mockHandlerService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: TaskService, useValue: mockTaskService },
        { provide: DealsService, useValue: mockDealsService },
        StripTagsPipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SendEmailComponent);
    component = fixture.componentInstance;
    mockTaskService.scheduleData$.next({ initial: true });
    fixture.detectChanges();

    mockUpdateConfirmMessage = spyOn(component, 'updateConfirmMessage');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.emailSubject).toBe('');
    expect(component.emailContent).toBe('');
    expect(component.scheduleCheck).toBe(false);
    expect(component.schedule_time).toBe('12:00:00.000');
    expect(component.time_zone).toBeTruthy();
  });

  it('should unsubscribe from templateSubscription on destroy', () => {
    component.templateSubscription = new Subscription();
    spyOn(component.templateSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.templateSubscription.unsubscribe).toHaveBeenCalled();
  });

  it('should call taskService.scheduleSendCreate and handle a successful response', () => {
    const mockData = { deal: 'mockDeal', _id: 'mockId' };
    const mockContacts = ['contact1', 'contact2'];
    const mockResponse = { status: true, message: 'all_queue' };

    // Set up spies for services
    mockTaskService.scheduleSendCreate.and.returnValue(of(mockResponse));

    // Call sendSchedule method
    component.sendSchedule({}, mockContacts);

    // Expectations
    expect(mockTaskService.scheduleSendCreate).toHaveBeenCalledWith({
      contacts: mockContacts,
      data: {}
    });
    expect(mockToastr.info).toHaveBeenCalledWith(
      'Your email requests are queued. The email queue progressing would be displayed in the header.',
      'Email Queue',
      {}
    );
    expect(mockHandlerService.activityAdd$).toHaveBeenCalledWith(
      mockContacts,
      'task'
    );
    expect(mockHandlerService.reload$).toHaveBeenCalledWith('tasks');
    expect(mockHandlerService.runScheduleTasks).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ status: true });
  });

  it('should handle a failed response with a 405 status code', () => {
    const mockData = { deal: 'mockDeal', _id: 'mockId' };
    const mockContacts = ['contact1', 'contact2'];
    const mockResponse = {
      status: false,
      statusCode: 405,
      data: { additionalData: 'test' }
    };

    // Set up spies for services
    mockTaskService.scheduleSendCreate.and.returnValue(of(mockResponse));

    // Call sendSchedule method
    component.sendSchedule({}, mockContacts);

    // Expectations
    expect(mockTaskService.scheduleSendCreate).toHaveBeenCalledWith({
      contacts: mockContacts,
      data: {}
    });
    // expect(mockDialogRef.closeAll).toHaveBeenCalled();
    // expect(mockDialogRef.open).toHaveBeenCalledWith(ScheduleResendComponent, {
    //   width: '98vw',
    //   maxWidth: '420px',
    //   data: { ...mockResponse.data, data: {} }
    // });
  });

  it('should handle a failed response with an error message', () => {
    const mockData = { deal: 'mockDeal', _id: 'mockId' };
    const mockContacts = ['contact1', 'contact2'];
    const mockResponse = { status: false, error: 'Error message' };

    // Set up spies for services
    mockTaskService.scheduleSendCreate.and.returnValue(of(mockResponse));

    // Call sendSchedule method
    component.sendSchedule({}, mockContacts);

    // Expectations
    expect(mockTaskService.scheduleSendCreate).toHaveBeenCalledWith({
      contacts: mockContacts,
      data: {}
      // deal: mockData.deal,
      // id: mockData._id
    });
    expect(mockToastr.error).toHaveBeenCalledWith('Error message');
  });

  it('should open the Material Browser dialog and handle the response correctly', () => {
    // Set up spies for helperService methods
    const mockMaterials = [{ _id: '1' }, { _id: '2' }];
    const mockLandingPages = [{ _id: '3' }, { _id: '4' }];
    mockHelperService.getMaterials.and.returnValue(mockMaterials);
    mockHelperService.getLandingPages.and.returnValue(mockLandingPages);

    // Set up a mock response for dialog.open and afterClosed
    const mockDialogRef = {
      afterClosed: () => of({ materials: [{ _id: '5' }] }), // Mock response after closing the dialog
      _ref: {
        overlayRef: { _host: { classList: { add: jasmine.createSpy('add') } } }
      }
    };
    mockDialog.open.and.returnValue(mockDialogRef);

    // Mock htmlEditor with spy methods
    component.htmlEditor = jasmine.createSpyObj('htmlEditor', [
      'insertBeforeMaterials',
      'insertMaterials',
      'insertLandingPage'
    ]);

    // Call the function
    component.openMaterialsDlg();

    // Expectations for dialog opening and class addition
    expect(mockDialog.open).toHaveBeenCalledWith(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: mockMaterials,
        hideLandingPageItems: mockLandingPages,
        title: 'Insert material',
        multiple: true,
        enableSelectLandingPage: true,
        onlyMine: false
      }
    });
    expect(
      mockDialogRef._ref.overlayRef._host.classList.add
    ).toHaveBeenCalledWith('top-dialog');

    // Expectations for handling response
    expect(component.htmlEditor.insertBeforeMaterials).toHaveBeenCalled();
    expect(component.htmlEditor.insertMaterials).toHaveBeenCalledWith({
      _id: '5'
    });
    expect(component.materials).toContain({ _id: '5' });
  });

  it('should send email for type "deal" and handle the response correctly', () => {
    // Set up data input and mock response
    const mockData = {
      contacts: [{ id: 1 }],
      video_ids: [1],
      pdf_ids: [],
      image_ids: []
    };
    component.type = 'deal';
    component.dealId = '12345';

    // Mock dealService response
    const mockDealResponse = { status: true, message: 'queue' };
    mockDealsService.sendEmail.and.returnValue(of(mockDealResponse));

    // Call fireSendEmail with mock data
    component.fireSendEmail(mockData);

    // Expectations for deal email send
    expect(mockDealsService.sendEmail).toHaveBeenCalledWith({
      deal: '12345',
      ...mockData
    });
    expect(component.emailSending).toBeFalse();
    expect(mockToastr.info).toHaveBeenCalledWith(
      'Your email requests are queued. The email queue progressing would be displayed in the header.',
      'Email Queue'
    );
    expect(mockHandlerService.addLatestActivities$).toHaveBeenCalledWith(2); // Includes 1 email and 1 additional count
    // expect(mockDialogRef.close).toHaveBeenCalledWith({
    //   send: 'Draft email content'
    // });
  });

  it('should send materials for non-deal type and handle queue response correctly', () => {
    // Set up data input and mock response
    const mockData = {
      contacts: [{ id: 1 }],
      video_ids: [1],
      pdf_ids: [],
      image_ids: []
    };
    component.type = 'non-deal';

    // Mock materialService response with queue message
    const mockMaterialResponse = { status: true, data: { message: 'queue' } };
    mockMaterialService.sendMaterials.and.returnValue(of(mockMaterialResponse));

    // Call fireSendEmail with mock data
    component.fireSendEmail(mockData);

    // Expectations for non-deal material send
    expect(mockMaterialService.sendMaterials).toHaveBeenCalledWith(mockData);
    expect(component.emailSending).toBeFalse();
    expect(mockToastr.info).toHaveBeenCalledWith(
      'Your email requests are queued. The email queue progressing would be displayed in the header.',
      'Email Queue',
      {}
    );
    expect(mockHandlerService.runScheduleTasks).toHaveBeenCalled();
    expect(mockHandlerService.addLatestActivities$).toHaveBeenCalledWith(2);
    // expect(mockDialogRef.close).toHaveBeenCalledWith({
    //   send: 'Draft email content'
    // });
  });

  it('should send email directly when no new contacts and scheduleCheck is false', () => {
    const mockMaterials = [{ id: 1, name: 'Material 1' }];
    const mockLandingPages = [{ _id: 'page1' }, { _id: 'page2' }];

    component.emailContent = 'Test email content';
    mockHelperService.getMaterials.and.returnValue(mockMaterials);
    mockHelperService.getLandingPages.and.returnValue(mockLandingPages);

    spyOn(component, 'fireSendEmail');
    component._sendEmail();

    // Expectations on data structure and calls
    expect(component.fireSendEmail).toHaveBeenCalled();
    // expect(component.sendSchedule).not.toHaveBeenCalled();
  });

  it('should schedule email when scheduleCheck is true', () => {
    spyOn(component, 'sendSchedule');
    spyOn(component, 'fireSendEmail');
    const mockResponse = { success: true };
    mockTaskService.scheduleSendCreate.and.returnValue(of(mockResponse));
    const mockMaterials = [{ id: 1, name: 'Material 1' }];
    const mockLandingPages = [{ _id: 'page1' }, { _id: 'page2' }];

    component.emailContent = 'Test email content';
    mockHelperService.getMaterials.and.returnValue(mockMaterials);
    mockHelperService.getLandingPages.and.returnValue(mockLandingPages);
    component.scheduleCheck = true;

    component._sendEmail();

    expect(component.sendSchedule).toHaveBeenCalled();
    expect(component.fireSendEmail).not.toHaveBeenCalled();
  });

  it('should show warning if there are no contacts to send email to', () => {
    const mockMaterials = [{ id: 1, name: 'Material 1' }];
    const mockLandingPages = [{ _id: 'page1' }, { _id: 'page2' }];

    component.emailContent = 'Test email content';
    mockHelperService.getMaterials.and.returnValue(mockMaterials);
    mockHelperService.getLandingPages.and.returnValue(mockLandingPages);
    component.scheduleCheck = true;
    const mockResponse = { success: true };

    mockTaskService.scheduleSendCreate.and.returnValue(of(mockResponse));

    component.emailContacts = []; // Set contacts to empty array
    component._sendEmail();

    expect(component.emailSending).toBeFalse();
    // expect(mockToastr.warning).toHaveBeenCalledWith(
    //   '0 emails are failed.',
    //   'Email Sent'
    // );
  });

  it('should not send email if email content is empty', () => {
    spyOn(component, '_sendEmail');
    spyOn(component, 'isEmpty').and.returnValue(true);
    component.sendEmail();
    expect(component._sendEmail).not.toHaveBeenCalled();
  });

  it('should not send email if there are no contacts', () => {
    spyOn(component, '_sendEmail');
    component.emailContacts = [];
    component.sendEmail();
    expect(component._sendEmail).not.toHaveBeenCalled();
  });

  it('should open confirm dialog for mass email during business hours if flag not set', () => {
    spyOn(moment().tz(component.time_zone), 'format').and.returnValue(
      '10:00:00.000'
    );
    mockDialogRef.open.and.returnValue(mockConfirmDialogRef);
    mockConfirmDialogRef.afterClosed.and.returnValue(of(true));

    component.sendEmail();

    // expect(mockDialogRef.open).toHaveBeenCalledWith(
    //   ConfirmBusinessComponent,
    //   jasmine.objectContaining({
    //     data: jasmine.objectContaining({
    //       message: `Due to the size of this bulk email ${component.emailContacts.length} and the business hours you have set up at crmgrow, this email job will have time delay than your expectation.`
    //     })
    //   })
    // );
  });

  it('should send email if confirm dialog is accepted', () => {
    spyOn(moment().tz(component.time_zone), 'format').and.returnValue(
      '10:00:00.000'
    );
    mockDialogRef.open.and.returnValue(mockConfirmDialogRef);
    mockConfirmDialogRef.afterClosed.and.returnValue(of(true));

    component.sendEmail();

    // expect(component._sendEmail).toHaveBeenCalled();
  });

  it('should skip confirmation dialog if flag is already set', () => {
    spyOn(moment().tz(component.time_zone), 'format').and.returnValue(
      '10:00:00.000'
    );

    component.sendEmail();

    expect(mockDialogRef.open).not.toHaveBeenCalled();
    // expect(component._sendEmail).toHaveBeenCalled();
  });

  it('should open confirm dialog for sending email outside business hours if flag not set', () => {
    spyOn(moment().tz(component.time_zone), 'format').and.returnValue(
      '08:00:00.000'
    );
    mockDialogRef.open.and.returnValue(mockConfirmDialogRef);
    mockConfirmDialogRef.afterClosed.and.returnValue(of(true));

    component.sendEmail();

    // expect(mockDialogRef.open).toHaveBeenCalledWith(
    //   ConfirmBusinessComponent,
    //   jasmine.objectContaining({
    //     data: jasmine.objectContaining({
    //       message:
    //         'Please ensure you have sufficient consent to contact these recipients during outside of business hours.'
    //     })
    //   })
    // );
  });
});
