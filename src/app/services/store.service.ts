import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Image } from '@models/image.model';
import { Pdf } from '@models/pdf.model';
import { Video } from '@models/video.model';
import { Template } from '@models/template.model';
import { TaskDetail } from '@models/task.model';
import { Activity } from '@models/activity.model';
import { Contact, ContactActivity, ContactDetail } from '@models/contact.model';
import { DetailActivity, PureActivity } from '@models/activityDetail.model';
import { Material } from '@models/material.model';
import { Automation } from '@models/automation.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  tags: BehaviorSubject<string[]> = new BehaviorSubject([]);
  profileInfo: BehaviorSubject<any> = new BehaviorSubject(null);

  tasks: BehaviorSubject<TaskDetail[]> = new BehaviorSubject([]);
  activities: BehaviorSubject<Activity[]> = new BehaviorSubject([]);
  pageContacts: BehaviorSubject<ContactActivity[]> = new BehaviorSubject([]);
  taskPageContacts: BehaviorSubject<ContactActivity[]> = new BehaviorSubject(
    []
  );
  selectedContact: BehaviorSubject<ContactDetail> = new BehaviorSubject(
    new ContactDetail()
  );
  selectedContactMainInfo: BehaviorSubject<ContactDetail> = new BehaviorSubject(
    new ContactDetail()
  );
  videos: BehaviorSubject<Video[]> = new BehaviorSubject([]);
  pdfs: BehaviorSubject<Pdf[]> = new BehaviorSubject([]);
  images: BehaviorSubject<Image[]> = new BehaviorSubject([]);
  materials: BehaviorSubject<Material[]> = new BehaviorSubject([]);
  templates: BehaviorSubject<Template[]> = new BehaviorSubject([]);
  libraries: BehaviorSubject<Material[]> = new BehaviorSubject([]);

  tags$ = this.tags.asObservable();
  profileInfo$ = this.profileInfo.asObservable();

  tasks$ = this.tasks.asObservable();
  activities$ = this.activities.asObservable();
  pageContacts$ = this.pageContacts.asObservable();
  taskPageContacts$ = this.taskPageContacts.asObservable();
  selectedContact$ = this.selectedContact.asObservable();
  selectedContactMainInfo$ = this.selectedContactMainInfo.asObservable();

  videos$ = this.videos.asObservable();
  pdfs$ = this.pdfs.asObservable();
  images$ = this.images.asObservable();
  materials$ = this.materials.asObservable();
  templates$ = this.templates.asObservable();
  libraries$ = this.libraries.asObservable();

  emailWindowType: BehaviorSubject<boolean> = new BehaviorSubject(true);
  emailWindowType$ = this.emailWindowType.asObservable();
  emailContactDraft: BehaviorSubject<any> = new BehaviorSubject({});
  emailContactDraft$ = this.emailContactDraft.asObservable();
  emailDealDraft: BehaviorSubject<any> = new BehaviorSubject({});
  emailDealDraft$ = this.emailDealDraft.asObservable();
  emailGlobalDraft: BehaviorSubject<any> = new BehaviorSubject({});
  emailGlobalDraft$ = this.emailGlobalDraft.asObservable();

  textWindowType: BehaviorSubject<boolean> = new BehaviorSubject(true);
  textWindowType$ = this.textWindowType.asObservable();
  textContactDraft: BehaviorSubject<any> = new BehaviorSubject({});
  textContactDraft$ = this.textContactDraft.asObservable();
  textDealDraft: BehaviorSubject<any> = new BehaviorSubject({});
  textDealDraft$ = this.textDealDraft.asObservable();
  textGlobalDraft: BehaviorSubject<any> = new BehaviorSubject({});
  textGlobalDraft$ = this.textGlobalDraft.asObservable();

  openedDraftDialogs: BehaviorSubject<any[]> = new BehaviorSubject([]);
  openedDraftDialogs$ = this.openedDraftDialogs.asObservable();

  sharedMaterials: BehaviorSubject<Material[]> = new BehaviorSubject([]);
  sharedMaterials$ = this.sharedMaterials.asObservable();
  sharedAutomations: BehaviorSubject<Automation[]> = new BehaviorSubject([]);
  sharedAutomations$ = this.sharedAutomations.asObservable();
  sharedTemplates: BehaviorSubject<Template[]> = new BehaviorSubject([]);
  sharedTemplates$ = this.sharedTemplates.asObservable();
  sharedContacts: BehaviorSubject<ContactActivity[]> = new BehaviorSubject([]);
  sharedContacts$ = this.sharedContacts.asObservable();

  dealContacts: BehaviorSubject<any> = new BehaviorSubject(null);
  dealContacts$ = this.dealContacts.asObservable();

  contactPage: BehaviorSubject<any> = new BehaviorSubject(null);
  contactPage$ = this.contactPage.asObservable();

  taskPage: BehaviorSubject<any> = new BehaviorSubject(null);
  taskPage$ = this.taskPage.asObservable();

  campaignData: BehaviorSubject<any> = new BehaviorSubject(null);
  campaignData$ = this.campaignData.asObservable();

  // add or edit action for automation
  actionInputData: BehaviorSubject<any> = new BehaviorSubject(null);
  actionInputData$ = this.actionInputData.asObservable();

  actionOutputData: BehaviorSubject<any> = new BehaviorSubject(null);
  actionOutputData$ = this.actionOutputData.asObservable();

  // add or edit action for contact timeline
  timelineInputData: BehaviorSubject<any> = new BehaviorSubject(null);
  timelineInputData$ = this.timelineInputData.asObservable();

  timelineOutputData: BehaviorSubject<any> = new BehaviorSubject(null);
  timelineOutputData$ = this.timelineOutputData.asObservable();

  automationType: BehaviorSubject<any> = new BehaviorSubject('contact');
  automationType$ = this.automationType.asObservable();

  pipelineLoadMoreStatus: BehaviorSubject<any> = new BehaviorSubject(null);
  pipelineLoadMoreStatus$ = this.pipelineLoadMoreStatus.asObservable();

  /**
   * Clear All Data
   */
  clearData(): void {
    this.tags.next([]);
    this.tasks.next([]);
    this.activities.next([]);
    this.materials.next([]);
    this.videos.next([]);
    this.pdfs.next([]);
    this.images.next([]);
    this.templates.next([]);
    this.pageContacts.next([]);
    this.taskPageContacts.next([]);
    this.selectedContact.next(new ContactDetail());
    this.sharedMaterials.next([]);
    this.sharedAutomations.next([]);
    this.sharedTemplates.next([]);
    this.sharedContacts.next([]);
    this.campaignData.next(null);
    this.actionInputData.next(null);
    this.actionOutputData.next(null);
    this.timelineInputData.next(null);
    this.timelineOutputData.next(null);
    this.automationType.next('contact');
    this.pipelineLoadMoreStatus.next(null);
    this.profileInfo.next(null);
  }

  constructor() {}
}
