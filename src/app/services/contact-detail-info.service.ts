import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Subject,
  Observable,
  Subscription,
  catchError,
  map,
  of
} from 'rxjs';
import moment from 'moment-timezone';
import _ from 'lodash';
import {
  ActionDataType,
  ActivityListResponse,
  ActivityListResponseItem,
  ActivityTrackerType,
  Contact,
  ContactActivityActionV2,
  ContactActivityDetail,
  ContactDetailActionType,
  LabelOnContactType
} from '@app/models/contact.model';
import { Draft } from '@app/models/draft.model';
import { HttpService } from './http.service';
import { ErrorService } from './error.service';
import { SspaService } from './sspa.service';
import { StoreService } from './store.service';
import { UserService } from './user.service';
import { LabelService } from './label.service';
import { EmailService } from './email.service';
import { getUserTimezone, replaceToken } from '@app/helper';
import { CONTACT } from '@app/constants/api.constant';
import { TabItem, TemplateToken } from '@app/utils/data.types';
import { convertToStringArray } from '@app/utils/functions';
import { environment } from '@environments/environment';

function isActionDataType(value: string): value is ActionDataType {
  return ['automation', 'follow_up', 'appointment', 'deal'].includes(value);
}

@Injectable({
  providedIn: 'root'
})
export class ContactDetailInfoService extends HttpService {
  lastUsedContactId: string | null = null;
  lastSelectedActivitySortType: TabItem | null = null;

  lastSelectedTaskSortType: { label: string; id: string } | null = null;
  lastSelectedTaskSortQuery: {
    sort: number | null;
    startDate: Date | null;
    endDate: Date | null;
    dateOption: string | null;
  } | null = null;

  activities: BehaviorSubject<ContactActivityActionV2[]> = new BehaviorSubject(
    []
  );
  activities$ = this.activities.asObservable();

  private timelineRefreshSource = new Subject<Date>();
  timelineRefresh$ = this.timelineRefreshSource.asObservable();

  actions: {
    [key in Exclude<
      ContactDetailActionType,
      'activity' | 'assigner' | 'user' | 'team' | 'single_id'
    >]: BehaviorSubject<Array<ContactActivityActionV2>>;
  } = {
    note: new BehaviorSubject([]),
    email: new BehaviorSubject([]),
    text: new BehaviorSubject([]),
    appointment: new BehaviorSubject([]),
    follow_up: new BehaviorSubject([]),
    tasks: new BehaviorSubject([]),
    deal: new BehaviorSubject([]),
    phone_log: new BehaviorSubject([]),
    automation: new BehaviorSubject([]),
    event: new BehaviorSubject([])
  };
  actions$ = {
    note: this.actions.note.asObservable(),
    email: this.actions.email.asObservable(),
    text: this.actions.text.asObservable(),
    appointment: this.actions.appointment.asObservable(),
    follow_up: this.actions.follow_up.asObservable(),
    tasks: this.actions.tasks.asObservable(),
    deal: this.actions.deal.asObservable(),
    phone_log: this.actions.phone_log.asObservable(),
    automation: this.actions.automation.asObservable(),
    event: this.actions.event.asObservable()
  };

  actionTotalCount: {
    [key in ActionDataType]: BehaviorSubject<number>;
  } = {
    appointment: new BehaviorSubject(0),
    follow_up: new BehaviorSubject(0),
    deal: new BehaviorSubject(0),
    automation: new BehaviorSubject(0),
    task: new BehaviorSubject(0)
  };
  actionTotalCount$ = {
    appointment: this.actionTotalCount.appointment.asObservable(),
    follow_up: this.actionTotalCount.follow_up.asObservable(),
    deal: this.actionTotalCount.deal.asObservable(),
    automation: this.actionTotalCount.automation.asObservable(),
    tasks: this.actionTotalCount.task.asObservable()
  };

  newTextIsAdd = new BehaviorSubject(false);
  newTextIsAdd$ = this.newTextIsAdd.asObservable();

  lastActivityId = null;

  actionListOffset: {
    [key in Exclude<
      ContactDetailActionType,
      'activity' | 'assigner' | 'user' | 'team' | 'single_id'
    >]: number;
  } = {
    note: 0,
    email: 0,
    text: 0,
    appointment: 0,
    follow_up: 0,
    tasks: 0,
    deal: 0,
    phone_log: 0,
    event: 0,
    automation: 0
  };

  templateTokens: TemplateToken[] = [];
  allLabels = null;
  labelSubscriptrion: Subscription;

  additional_fields;
  timezone_info;
  userId = '';

  contactMainInfo: Contact = new Contact(); // contact main informations
  contactMainInfoReadSubscription: Subscription;

  oldParentFollowUps = [];

  constructor(
    private emailService: EmailService,
    errorService: ErrorService,
    private httpClient: HttpClient,
    public sspaService: SspaService,
    private userService: UserService,
    private storeService: StoreService,
    public labelService: LabelService
  ) {
    super(errorService);

    this.userService.profile$.subscribe((profile) => {
      if (!profile._id) {
        return;
      }
      this.userId = profile._id;
      this.timezone_info = getUserTimezone(profile);

      const garbage = this.userService.garbage.getValue();
      if (garbage.template_tokens && garbage.template_tokens.length) {
        this.templateTokens = [...garbage.template_tokens];
      }
      this.additional_fields = garbage.additional_fields || [];
    });

    this.labelSubscriptrion && this.labelSubscriptrion.unsubscribe();
    this.labelSubscriptrion = this.labelService.allLabels$.subscribe((res) => {
      if (res) {
        this.allLabels = res;
      }
    });

    this.contactMainInfoReadSubscription &&
      this.contactMainInfoReadSubscription.unsubscribe();
    this.contactMainInfoReadSubscription =
      this.storeService.selectedContactMainInfo$.subscribe((contact) => {
        if (!contact?._id) {
          return;
        }
        this.contactMainInfo = new Contact().deserialize({ ...contact });
      });
  }

  /**
   * fetch activity overview map and first limited activities list with contact ID
   * @param contactId {string} contact id
   * @param pagination? {from?: number,limit?:number }
   * @returns subscribes for activity overview map and first limited activities list
   */
  loadActivities(
    contactId: string,
    pagination?: { from?: string | null; limit?: number | null }
  ) {
    this.loadActivitiesImpl(contactId, pagination).subscribe((res) => {
      if (res) {
        const response = res as ActivityListResponse;
        const originList = this.activities.getValue();
        if (pagination?.from) {
          const filteredList = response.data.filter((item) => {
            // keep latest activity item from previous fetched list
            const actionId = Object.values(item._id)[0];
            const type =
              !actionId || !item._id
                ? 'activity'
                : (Object.keys(item._id)[0] as ContactDetailActionType);
            const existItem = originList.find((originItem) => {
              return (
                originItem.actionId === actionId && originItem.type === type
              );
            });

            return !existItem ? true : false;
            //return type === 'activity' || !existItem ? true : false;
          });
          const contactActivityList = filteredList
            .map((item) => this.getParseActivityList(item, response.details))
            .filter((e) => e.type === 'single_id' || e.action);
          this.activities.next([...originList, ...contactActivityList]);
        } else {
          // first load
          const contactActivityList = response.data
            .map((item) => this.getParseActivityList(item, response.details))
            .filter((e) => e.type === 'single_id' || e.action);
          this.activities.next(contactActivityList);
        }
        if (response.lastActivityId && response.data?.length) {
          this.lastActivityId = response.lastActivityId;
        }
      }
    });
  }

  /**
   * fetch  first limited activities list with contact ID
   * @param contactId {string} contact id
   * @param count? {number} fetch item count
   * @returns subscribes for  first limited activities list
   */
  loadLastActivities(contactId: string, count?: number) {
    this.loadActivitiesImpl(contactId, { limit: count ?? 25 }).subscribe(
      (res) => {
        if (res) {
          const response = res as ActivityListResponse;
          const originList = this.activities.getValue();
          const contactActivityList = response.data
            .map((item) => this.getParseActivityList(item, response.details))
            .filter((e) => e.type === 'single_id' || e.action);
          contactActivityList.map((item) => {
            const findIndex = originList.findIndex((originItem) => {
              return (
                originItem.actionId === item.actionId &&
                originItem.type === item.type
              );
            });
            if (findIndex === -1) {
              originList.unshift(item);
            } else {
              originList.splice(findIndex, 1, item);
            }
          });
          originList.sort(
            (a, b) =>
              new Date(b.activityOverView.time).getTime() -
              new Date(a.activityOverView.time).getTime()
          );

          this.activities.next(originList);
        }
      }
    );
  }

  /**
   * fetch activity overview map and first limited activities list with contact ID
   * @param contactId {string} contact id
   * @param pagination? {from?: string,limit?:number }
   * @returns {data, details} activity overview map and first limited activities list
   */
  loadActivitiesImpl(
    contactId: string,
    pagination?: { from?: string; limit?: number }
  ): Observable<any> {
    if (!contactId) {
      return of({
        data: [],
        details: {},
        lastActivityId: null
      });
    }
    const param =
      !this.lastSelectedActivitySortType ||
      this.lastSelectedActivitySortType?.id === 'all'
        ? { ...pagination }
        : { ...pagination, type: this.lastSelectedActivitySortType.id };

    return this.httpClient
      .post(this.server + CONTACT.LOAD_GROUP_ACTIVITIES + contactId, param)
      .pipe(
        map((res) => res),
        catchError(
          this.handleError('CONTACT ACTIVITIES', {
            data: [],
            details: {},
            lastActivityId: null
          })
        )
      );
  }

  /**
   * fetch activity detail info
   * @param contactId {string} contact id
   * @param param
      type: ContactDetailActionType;
      id: string;
   */
  loadContactActivityDetail(
    contactId: string,
    {
      type,
      id
    }: {
      type: ContactDetailActionType;
      id: string;
    }
  ) {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_CONTACT_ACTIVITY_DETAIL + contactId, {
        type,
        id
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CONTACT MORE ACTIVITIES', null))
      );
  }

  /**
   * fetch limited actions list with contact ID and action type,  pagination params
   * @param contactId {string} contact id
   * @param type: ContactDetailActionType;
   * @param page: fetch page index;
   * @param  pagination: { skip: number; limit:number; after?: string }
   * @param  sortQuery: { startDate: Date; endDate:Date; sort: number }
   * @returns  subscribes for limited actions list
   */
  loadActionsWithType(
    contactId: string,
    type: ContactDetailActionType,
    pagination: { skip: number; limit: number; after?: string },
    sortQuery?: {
      startDate: Date | null;
      endDate: Date | null;
      sort: number | null;
      dateOption: string | 'null';
    }
  ) {
    let skip = pagination?.skip ?? 0;
    let parentFollowUps = [];
    if (
      type === 'follow_up' &&
      (sortQuery?.dateOption === 'all' ||
        sortQuery?.dateOption === 'this_week' ||
        sortQuery?.dateOption === 'next_week' ||
        sortQuery?.dateOption === 'future')
    ) {
      parentFollowUps = this.oldParentFollowUps;
      if (skip > 0) {
        const originList = this.actions[type].getValue();
        skip = originList.length - this.oldParentFollowUps.length;
        if (skip === 0) {
          skip = originList.length;
        }
      }
    }
    this.loadActionsWithTypeImpl(contactId, {
      type,
      limit: pagination.limit,
      skip,
      after: pagination?.after,
      sortQuery: {
        dateOption: 'all',
        ...sortQuery,
        timezone: this.timezone_info
      },
      status: environment.isSspa ? -1 : 0,
      parentFollowUps
    }).subscribe((res) => {
      const contactActivityActionList = this.getParseActionList(
        type,
        res['data'],
        res['activities'] ?? [],
        res['details'] ?? []
      );

      if (skip === 0 && !this.oldParentFollowUps.length) {
        this.actions[type].next(contactActivityActionList);
        if (
          type === 'follow_up' &&
          (sortQuery?.dateOption === 'all' ||
            sortQuery?.dateOption === 'this_week' ||
            sortQuery?.dateOption === 'next_week' ||
            sortQuery?.dateOption === 'future')
        ) {
          this.oldParentFollowUps = contactActivityActionList
            .filter((e) => e.action?.parent_follow_up)
            .map((e) => e.action?.parent_follow_up);
        }
      } else {
        const originList = this.actions[type].getValue();
        if (
          type === 'follow_up' &&
          (sortQuery?.dateOption === 'all' ||
            sortQuery?.dateOption === 'this_week' ||
            sortQuery?.dateOption === 'next_week' ||
            sortQuery?.dateOption === 'future')
        ) {
          const originParentFollowUpIds = originList
            .filter((e) => e.action?.parent_follow_up)
            .map((e) => e.action?.parent_follow_up);
          const activityActionList = contactActivityActionList.filter(
            (e) => !originParentFollowUpIds.includes(e.action?.parent_follow_up)
          );
          const parent_follow_ups = activityActionList
            .filter((e) => e.action?.parent_follow_up)
            .map((e) => e.action?.parent_follow_up);
          this.actions[type].next(originList.concat(...activityActionList));
          this.oldParentFollowUps = this.oldParentFollowUps.concat(
            ...parent_follow_ups
          );
        } else {
          this.actions[type].next(
            originList
              .concat(...contactActivityActionList)
              .sort(
                (a, b) =>
                  new Date(b.activityOverView?.time).getTime() -
                  new Date(a.activityOverView?.time).getTime()
              )
          );
        }
      }
    });
  }

  /**
   * fetch  first limited activities list with contact ID
   * @param contactId {string} contact id
   * @param type {ContactDetailActionType} contact action type
   * @param count? {number} fetch item count
   * @returns subscribes for  first limited activities list
   */
  loadLastActions(
    contactId: string,
    type: ContactDetailActionType,
    count?: number
  ) {
    const sortQuery =
      type === 'follow_up'
        ? { ...this.lastSelectedTaskSortQuery, timezone: this.timezone_info }
        : null;
    this.loadActionsWithTypeImpl(contactId, {
      type,
      limit: count ?? 10,
      skip: 0,
      sortQuery: sortQuery,
      status: environment.isSspa ? -1 : 0
    }).subscribe((res) => {
      if (res) {
        const response = res as ActivityListResponse;
        const originList = this.actions[type].getValue();

        const contactActivityActionList = this.getParseActionList(
          type,
          res['data'],
          res['activities'] ?? [],
          res['details'] ?? []
        );
        contactActivityActionList.map((item) => {
          const findIndex = originList.findIndex((originItem) => {
            return originItem.actionId === item.actionId;
          });
          if (findIndex !== -1) {
            originList.splice(findIndex, 1, item);
          } else {
            originList.unshift(item);
          }
        });
        if (type === 'follow_up')
          this.actions[type].next(this.sortActions(originList));
        else this.actions[type].next(originList);
        if (type === 'text') {
          this.newTextIsAdd.next(true);
        }
      }
    });
  }

  sortActions(actions: any[]): any[] {
    return actions.sort((a, b) => {
      if (a.action.status === 0 && b.action.status === 2) {
        return -1;
      } else if (a.action.status === 2 && b.action.status === 0) {
        return 1;
      } else {
        if (a.action.status === 0) {
          return (
            new Date(a.action.due_date).getTime() -
            new Date(b.action.due_date).getTime()
          );
        } else {
          return (
            new Date(b.action.due_date).getTime() -
            new Date(a.action.due_date).getTime()
          );
        }
      }
    });
  }

  /**
   * fetch limited actions list with contact ID and action type,  pagination params
   * @param contactId {string} contact id
   * @param param
      type: ContactDetailActionType;
      skip: number;
      limit: number;
      after?: string;
      sortQuery?:{ startDate: Date; endDate:Date; sort: number , timezone:string, dateOption: string }
   * @returns [key in ContactDetailActionType]: Array<ContactActivityDetail & object>  limited activities list
   */
  loadActionsWithTypeImpl(
    contactId: string,
    param: {
      type: ContactDetailActionType;
      skip: number;
      limit: number;
      after?: string;
      sortQuery?: {
        startDate: Date | null;
        endDate: Date | null;
        sort: number | null;
        timezone: string | null;
        dateOption: string | null;
      };
      status?: number;
      parentFollowUps?: any;
    }
  ) {
    return this.httpClient
      .post(this.server + CONTACT.LOAD_ACTIONS + contactId, param)
      .pipe(
        map(
          (
            res:
              | {
                  data: {
                    count: number;
                    data: ContactActivityDetail[];
                  };
                }
              | undefined
          ) => {
            return res['data'];
          }
        ),
        catchError(this.handleError('CONTACT MORE ACTIONS', null))
      );
  }

  /**
   * fetch limited actions list with contact ID and action type,  pagination params
   * @param contactId {string} contact id
   * @param param
      type: ContactDetailActionType;

   * @returns  count number
   */
  getActionTotalCountWithType(contactId: string, type: ActionDataType) {
    return this.httpClient
      .post(this.server + CONTACT.GET_ACTION_TOTAL_COUNT + contactId, {
        type,
        status: environment.isSspa ? -1 : 0
      })
      .pipe(
        map((res) => {
          this.actionTotalCount[type].next(res['data'] ?? 0);
          return res['data'];
        }),
        catchError(this.handleError('getActionTotalCountWithType', null))
      );
  }

  /**
   *update activities and actions along with remove contact action
   * @param actionId {string} contact action id
   * @param type {ContactDetailActionType} contact contact type
   */
  callbackForRemoveContactAction(
    actionId: string,
    type: ContactDetailActionType
  ) {
    this.actionListOffset[type]--;
    const originActionList = this.actions[type].getValue();
    this.actions[type].next(
      originActionList.filter((item) => item?.actionId !== actionId)
    );

    const originActivityList = this.activities.getValue();
    this.activities.next(
      originActivityList.filter((item) => item?.actionId !== actionId)
    );
    if (isActionDataType(type)) {
      this.getActionTotalCountWithType(this.lastUsedContactId, type).subscribe(
        (res) => {}
      );
    }
  }

  /**
   *update activities and actions along with add contact action
   * @param contactId {string} contact id
   * @param type? {ContactDetailActionType} contact contact type
   */
  callbackForAddContactAction(
    contactId: string | null,
    type?: ContactDetailActionType
  ) {
    this.loadLastActions(contactId ?? this.lastUsedContactId, type);
    this.loadLastActivities(contactId ?? this.lastUsedContactId);
    if (isActionDataType(type)) {
      this.getActionTotalCountWithType(contactId, type).subscribe((res) => {});
    }
  }

  /**
   *update activities and actions along with edit contact action
   * @param contactId {string} contact id
   * @param type? {ContactDetailActionType} contact contact type
   */
  callbackForEditContactAction(
    contactId: string | null,
    type?: ContactDetailActionType
  ) {
    this.loadLastActions(contactId ?? this.lastUsedContactId, type);
    this.loadLastActivities(contactId ?? this.lastUsedContactId);

    if (isActionDataType(type)) {
      this.getActionTotalCountWithType(contactId, type).subscribe((res) => {});
    }
  }

  /**
   *refetch  activities
   * @param contactId {string} contact id
   */
  refetchContactActivity(contactId: string | null) {
    this.loadLastActivities(contactId ?? this.lastUsedContactId, 100);
    this.timelineRefreshSource.next(new Date());
  }

  refreshContactAllActivityAndActions(contactId: string | null) {
    this.refetchContactActivity(contactId ?? this.lastUsedContactId);
    this.refetchContactActionOnType(
      contactId ?? this.lastUsedContactId,
      'phone_log'
    );
    this.refetchContactActionOnType(
      contactId ?? this.lastUsedContactId,
      'note'
    );
    this.refetchContactActionOnType(
      contactId ?? this.lastUsedContactId,
      'email'
    );
    this.refetchContactActionOnType(
      contactId ?? this.lastUsedContactId,
      'text'
    );
  }

  /**
   *refetch  actions on type
   * @param contactId {string} contact id
   * @param type? {ContactDetailActionType} contact contact type
   */
  refetchContactActionOnType(
    contactId: string | null,
    type?: ContactDetailActionType
  ) {
    this.loadLastActions(contactId ?? this.lastUsedContactId, type, 10);
  }

  private getParseActivityList(
    activityItem: ActivityListResponseItem,
    details: { [key: string]: object }
  ) {
    const { activity, _id, time } = activityItem;
    const isTrackerActivityItem = !!activity.type?.includes('trackers');

    let actionId = Object.values(_id)[0];
    let type =
      !actionId || !_id
        ? 'activity'
        : (Object.keys(_id)[0] as ContactDetailActionType);

    // single activity detail data getting
    if (Object.keys(_id)?.length > 1 && _id['single_id']) {
      const data = { ..._id };
      delete data['single_id'];
      if (Object.values(data)[0]) {
        actionId = Object.values(data)[0];
        type = Object.keys(data)[0] as ContactDetailActionType;
      }
    }

    const trackerDetail = isTrackerActivityItem
      ? details[activity.type.slice(0, -1)]?.[
          activity?.[activity.type] as string
        ]
      : null;
    var _action = details[type]?.[actionId];
    const userId = !_action?.user
      ? activity.user
      : Array.isArray(_action?.user)
      ? _action?.user[0]
      : _action?.user;

    const contactActivityAction: ContactActivityActionV2 = {
      type,
      actionId,
      action: _action,
      trackerType: isTrackerActivityItem
        ? (activity.type as ActivityTrackerType)
        : null,
      trackerDetail,
      activityOverView: {
        content: activity?.content,
        created_at: activity.created_at,
        time: time,
        receivers: activity?.receivers ?? [],
        type:
          activity?.type +
          (trackerDetail?.type ? ' ' + trackerDetail?.type : ''),
        user: details['user']?.[userId]
      },
      status: activity?.status,
      messageId: activity.message_id
    };

    if (
      ['images', 'pdfs', 'videos'].includes(activity?.type) &&
      ['email', 'text'].includes(type)
    ) {
      // replace  "sent video/image/pdf using email" activity content to "sent email"
      contactActivityAction.activityOverView.content = `sent ${type}`;
      contactActivityAction.activityOverView.type = `${type}s`;
    }

    if (
      contactActivityAction.trackerType === 'video_trackers' &&
      trackerDetail
    ) {
      const videoId = convertToStringArray(
        contactActivityAction.trackerDetail.video
      )[0];
      if (videoId && details.video[videoId]) {
        contactActivityAction.trackerDetail.videoDuration =
          details.video[videoId].duration;
      }
    }

    const materials = {
      videos: (activityItem.videos as string[]).map(
        (videoId) => details.video[videoId]
      ),
      images: (activityItem.images as string[]).map(
        (imageId) => details.image[imageId]
      ),
      pdfs: (activityItem.pdfs as string[]).map((pdfId) => details.pdf[pdfId])
    };
    contactActivityAction.materials = materials;
    contactActivityAction.includeMaterials =
      (materials.videos?.length || 0) +
      (materials.pdfs?.length || 0) +
      (materials.images?.length || 0);
    return contactActivityAction;
  }

  /**
   * @param type ContactDetailActionType
   * @param actionList
   * @param materialList
   * @returns ContactActivityActionV2 list
   */
  getParseActionList(
    type: ContactDetailActionType,
    actionList,
    activityList,
    details
  ) {
    return _.map(actionList, (item) => {
      const subjectTitle =
        type === 'email' ? 'Sent Email' : LabelOnContactType[type];
      const dataItem = activityList?.[item?._id];
      const activity = dataItem?.activity;
      if (activity && activity.user && activity.user._id !== this.userId) {
        item['user_name'] = activity.user.user_name;
        item['picture_profile'] = activity.user.picture_profile;
      }

      const contactActivityAction: ContactActivityActionV2 = {
        type: type,
        actionId: item?._id,
        action: item,
        activityOverView: {
          content: subjectTitle,
          created_at: item.created_at,
          time: item.created_at,
          receivers: activity?.receivers ?? [],
          user: Array.isArray(item.user) ? item.user[0] : item.user,
          type: type + 's'
        },
        status: activity?.status,
        messageId: activity?.message_id
      };

      if (!activity) {
        return contactActivityAction;
      }
      if (type === 'text' && item.type === 1) {
        contactActivityAction.activityOverView.content = 'Received Text';
      }

      const isTrackerActivityItem = !!activity.type?.includes('trackers');
      const trackerDetail = isTrackerActivityItem
        ? details[activity.type.slice(0, -1)]?.[
            activity?.[activity.type] as string
          ]
        : null;
      contactActivityAction['trackerType'] = isTrackerActivityItem
        ? (activity.type as ActivityTrackerType)
        : null;
      contactActivityAction['trackerDetail'] = trackerDetail;
      if (
        contactActivityAction.trackerType === 'video_trackers' &&
        trackerDetail
      ) {
        const videoId = convertToStringArray(
          contactActivityAction.trackerDetail.video
        )[0];
        if (videoId && details.video[videoId]) {
          contactActivityAction.trackerDetail.videoDuration =
            details.video[videoId].duration;
        }
      }
      const materials = {
        videos: (dataItem.videos as string[]).map(
          (videoId) => details.video[videoId]
        ),
        images: (dataItem.images as string[]).map(
          (imageId) => details.image[imageId]
        ),
        pdfs: (dataItem.pdfs as string[]).map((pdfId) => details.pdf[pdfId])
      };
      contactActivityAction.materials = materials;
      contactActivityAction.includeMaterials =
        (materials.videos?.length || 0) +
        (materials.pdfs?.length || 0) +
        (materials.images?.length || 0);
      return contactActivityAction;
    });
  }

  resetActivityFilter(type: TabItem) {
    this.lastSelectedActivitySortType = type;
    this.activities.next([]);
    this.lastActivityId = null;
  }

  resetActivity() {
    this.activities.next([]);
    this.lastActivityId = null;
  }

  resetActionFilter(action: ContactDetailActionType) {}

  /**
   * reset all contact activity history and config observes if new contact is opened
   * @param contactId
   */
  resetContactDetailInfo(contactId: string) {
    if (this.lastUsedContactId !== contactId) {
      this.activities.next([]);

      this.actions.note.next([]);
      this.actions.email.next([]);
      this.actions.text.next([]);
      this.actions.appointment.next([]);
      this.actions.follow_up.next([]);
      this.actions.deal.next([]);
      this.actions.phone_log.next([]);
      this.actions.automation.next([]);
      this.actions.event.next([]);

      this.actionTotalCount.appointment.next(0);
      this.actionTotalCount.automation.next(0);
      this.actionTotalCount.deal.next(0);
      this.actionTotalCount.follow_up.next(0);
      this.actionTotalCount.task.next(0);

      this.lastUsedContactId = contactId;
      this.lastSelectedActivitySortType = null;
      this.lastSelectedTaskSortType = null;
      this.lastSelectedTaskSortQuery = null;
      this.lastActivityId = null;
    }
  }

  resetLastUsedContactId() {
    this.lastUsedContactId = null;
  }

  /**
   * Load the properties list that used in agentfire incoming events
   * @param string contactId
   */
  loadProperties(contactId: string): Observable<any[]> {
    return this.httpClient
      .get(this.server + CONTACT.LOAD_PROPERTIES + contactId)
      .pipe(
        map((res) => res?.['data']),
        catchError(this.handleError('CONTACT PROPERTIES', []))
      );
  }

  getLabelName(contact: Contact): string {
    let _labelName = '';
    if (this.allLabels?.length > 0) {
      this.allLabels.forEach((e) => {
        if (e._id == contact?.label) _labelName = e.name;
      });
    }
    return _labelName;
  }

  replaceContent(content: string, assigned?: any | null): string {
    const user = this.userService.profile.getValue();
    let labelName = '';
    if (content?.match(/{label}/gi)) {
      labelName = this.getLabelName(this.contactMainInfo);
    }
    if (assigned) {
      content = content
        .replace(/{assignee_name}/gi, assigned?.user_name || '')
        .replace(
          /{assignee_first_name}/gi,
          assigned?.user_name?.split(' ')[0] || ''
        )
        .replace(
          /{assignee_last_name}/gi,
          assigned?.user_name?.split(' ')[1] || ''
        )
        .replace(
          /{assignee_email}/gi,
          assigned?.connected_email || assigned?.email || ''
        )
        .replace(/{assignee_phone}/gi, assigned?.cell_phone || '');
    }
    return replaceToken(
      user,
      this.contactMainInfo,
      this.templateTokens,
      content,
      labelName,
      this.additional_fields,
      this.timezone_info
    );
  }

  /**
   * Get email draft information of the contact and Emit the Behavior Subject
   * @param _id: Contact Id
   */
  getEmailDraftOnContact(_id: string): void {
    this.emailService
      .getDraft({
        contact: _id,
        type: 'contact_email'
      })
      .subscribe((res) => {
        if (res?._id) {
          this.storeService.emailContactDraft.next(res);
        } else {
          this.storeService.emailContactDraft.next({});
        }
      });
  }

  /**
   * Get text draft information of the contact and Emit the Behavior Subject
   * @param _id: Contact Id
   */
  getTextDraftOnContact(_id: string): void {
    this.emailService
      .getDraft({
        contact: _id,
        type: 'contact_text'
      })
      .subscribe((res) => {
        if (res?._id) {
          this.storeService.textContactDraft.next(res);
        } else {
          this.storeService.textContactDraft.next({});
        }
      });
  }

  saveDraft(data: Draft | null): void {
    if (!data) return;
    if (data?._id) {
      this.emailService.updateDraft(data._id, data).subscribe((res) => {});
    } else {
      if (!data.content && !data.subject) {
        return;
      }
      const defaultEmail = this.userService.email.getValue();
      if (defaultEmail) {
        if (
          data.content === defaultEmail.content.replace(/^\s+|\s+$/g, '') &&
          data.subject === defaultEmail.subject
        ) {
          return;
        }
      }
      this.emailService.createDraft(data).subscribe((res) => {});
    }
  }

  refreshAll(_contactId: string, activeTabId: ContactDetailActionType) {
    const contactId = _contactId ?? this.lastUsedContactId;
    const actionList = ['activity', 'note', 'email', 'text', 'phone_log'];
    actionList.forEach((action) => {
      if (activeTabId === action) {
        if (activeTabId === 'activity') {
          this.refetchContactActivity(contactId);
        } else {
          this.refetchContactActionOnType(contactId, action);
        }
      } else {
        if (action === 'activity') {
          this.activities.next([]);
        } else {
          this.actions?.[action].next([]);
        }
      }
    });
  }

  setFirstTextOfDayFlag(
    actions: ContactActivityActionV2[]
  ): ContactActivityActionV2[] {
    let lastDate = '';

    actions.forEach((item) => {
      const messageDate = moment
        .tz(item?.action?.created_at, this.timezone_info)
        .format('YYYY-MM-DD');
      if (messageDate !== lastDate) {
        // This is the first message of this day
        item.action.isFirstMessage = true;
        lastDate = messageDate; // Mark that we have found the first message of this day
      } else {
        // Not the first message of this day
        item.action.isFirstMessage = false;
      }
    });
    return actions;
  }
}
