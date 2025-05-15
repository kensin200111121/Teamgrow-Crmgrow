import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpService } from '@services/http.service';
import { ErrorService } from '@services/error.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DEALSTAGE, DEAL, PIPELINE } from '@constants/api.constant';
import { STATUS } from '@constants/variable.constants';
import { DealStage } from '@models/deal-stage.model';
import { Deal } from '@models/deal.model';
import { Email } from '@models/email.model';
import { Note } from '@models/note.model';
import { DetailActivity } from '@models/activityDetail.model';
import { Pipeline, PipelineWithStages } from '@models/pipeline.model';
import moment from 'moment-timezone';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';
import { Timeline } from '@models/timeline.model';
@Injectable({
  providedIn: 'root'
})
export class DealsService extends HttpService {
  stageIdArray: BehaviorSubject<string[]> = new BehaviorSubject([]);
  stageIdArray$ = this.stageIdArray.asObservable();
  pipeArray: Pipeline[] = [];
  selectedPipeline: BehaviorSubject<Pipeline> = new BehaviorSubject(null);
  selectedPipeline$ = this.selectedPipeline.asObservable();
  pipelines: BehaviorSubject<Pipeline[]> = new BehaviorSubject([]);
  pipelineStages: BehaviorSubject<PipelineWithStages[]> = new BehaviorSubject(
    []
  );
  pipelines$ = this.pipelines.asObservable();
  pipelineStages$ = this.pipelineStages.asObservable();
  stages: BehaviorSubject<DealStage[]> = new BehaviorSubject([]);
  stages$ = this.stages.asObservable();
  stageSummaries: BehaviorSubject<DealStage[]> = new BehaviorSubject([]);
  stageSummaries$ = this.stageSummaries.asObservable();
  deals: BehaviorSubject<Deal[]> = new BehaviorSubject([]);
  deals$ = this.deals.asObservable();
  loadStageStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingStage$ = this.loadStageStatus.asObservable();
  loadPipelineStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadingPipeline$ = this.loadPipelineStatus.asObservable();
  loadDealStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingDeal$ = this.loadDealStatus.asObservable();
  stageContacts: BehaviorSubject<any> = new BehaviorSubject(null);
  stageContacts$ = this.stageContacts.asObservable();
  siblings: BehaviorSubject<any> = new BehaviorSubject(null);
  siblings$ = this.siblings.asObservable();
  timelines: BehaviorSubject<any[]> = new BehaviorSubject([]);
  timelines$ = this.timelines.asObservable();
  getStageSubscription: Subscription;

  pageStages: BehaviorSubject<DealStage[]> = new BehaviorSubject([]);
  pageStages$ = this.pageStages.asObservable();
  pageStageIdArray: BehaviorSubject<string[]> = new BehaviorSubject([]);
  pageStageIdArray$ = this.pageStageIdArray.asObservable();

  loadPageStageStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadingPageStage$ = this.loadPageStageStatus.asObservable();

  loadMoreStageStatus: BehaviorSubject<any> = new BehaviorSubject({});
  loadMoreStageStatus$ = this.loadMoreStageStatus.asObservable();

  searchDealsStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  searchDealsStatus$ = this.searchDealsStatus.asObservable();

  private created: BehaviorSubject<number> = new BehaviorSubject(Date.now());
  created$ = this.created.asObservable();

  called: BehaviorSubject<number> = new BehaviorSubject(Date.now());
  called$ = this.called.asObservable();
  pageStageLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  stageDictionary: BehaviorSubject<any> = new BehaviorSubject({});
  stageDictionary$ = this.stageDictionary.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
    const selectedPipeline = localStorage.getCrmItem(KEY.PIPELINE.SELECTED);
    this.selectedPipeline$.subscribe((value) => {
      if (value) {
        localStorage.setCrmItem(KEY.PIPELINE.SELECTED, JSON.stringify(value));
      }
    });

    this.pipelineStages$.subscribe((value) => {
      const dictionary = {};

      value.forEach((pipeline) => {
        pipeline.stages.forEach((stage) => {
          dictionary[stage._id] = stage;
        });
      });
      const _selectedPipeline = this.selectedPipeline.getValue();

      const bMyPipeLine = value.some(
        (element) => _selectedPipeline._id === element._id
      );
      this.stageDictionary.next(dictionary);
      if (selectedPipeline && value.length) {
        if (bMyPipeLine) {
          this.selectedPipeline.next(_selectedPipeline);
        } else {
          this.selectedPipeline.next(null);
        }
      }
    });
  }

  getPipeLine(): Observable<Pipeline[]> {
    return this.httpClient.get(this.server + PIPELINE.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Pipeline().deserialize(e))
      ),
      catchError(this.handleError('LOAD PIPELINES', null))
    );
  }
  getAllPipeLine(): Observable<PipelineWithStages[]> {
    return this.httpClient.get(this.server + PIPELINE.GETALL).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new PipelineWithStages().deserialize(e))
      ),
      catchError(this.handleError('LOAD PIPELINES', null))
    );
  }

  getPipeLineById(id: string): Observable<any> {
    return this.httpClient.get(this.server + PIPELINE.EDIT + id).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD PIPELINE', null))
    );
  }

  easyGetPipeLine(force = false): void {
    if (!force) {
      const loadStatus = this.loadPipelineStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadPipelineStatus.next(STATUS.REQUEST);
    this.getAllPipeLine().subscribe((pipeLines) => {
      pipeLines
        ? this.loadPipelineStatus.next(STATUS.SUCCESS)
        : this.loadPipelineStatus.next(STATUS.FAILURE);
      this.pipelineStages.next(pipeLines);
    });
  }

  createPipeLine(pipeline: Pipeline): Observable<any> {
    return this.httpClient.post(this.server + PIPELINE.GET, pipeline).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE PIPELINE', null))
    );
  }

  updatePipeLine(id: string, data: any): Observable<any> {
    return this.httpClient.put(this.server + PIPELINE.EDIT + id, data).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE PIPELINE', null))
    );
  }

  deletePipeLine(id: string): Observable<any> {
    return this.httpClient.delete(this.server + PIPELINE.EDIT + id).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE PIPELINE', null))
    );
  }

  easyLoad(force = false): void {
    if (!force) {
      const loadStatus = this.loadStageStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    // this.loadStageStatus.next(STATUS.REQUEST);
    this.easyLoadImpl().subscribe((dealStages) => {
      // dealStages
      //   ? this.loadStageStatus.next(STATUS.SUCCESS)
      //   : this.loadStageStatus.next(STATUS.FAILURE);
      dealStages.forEach((e) => {
        e.deals = [];
      });
      if (!this.stages.getValue() || !this.stages.getValue().length) {
        this.stages.next(dealStages || []);
        this.stageSummaries.next(dealStages || []);
      } else {
        this.stageSummaries.next(dealStages || []);
      }
    });
  }

  easyLoadImpl(): Observable<DealStage[]> {
    return this.httpClient.get(this.server + DEALSTAGE.EASY_LOAD).pipe(
      map((res) => {
        return (res['data'] || []).map((e) => new DealStage().deserialize(e));
      }),
      catchError(this.handleError('LOAD STAGES 3', null))
    );
  }

  /**
   * LOAD ALL DEAL STAGES
   * @param force Flag to load force
   */

  loadStage(pipeline: any): Observable<DealStage[]> {
    return this.httpClient.post(this.server + DEALSTAGE.LOAD, pipeline).pipe(
      map((res) => {
        return (res['data'] || []).map((e) => new DealStage().deserialize(e));
      }),
      catchError(this.handleError('LOAD STAGES 2', null))
    );
  }

  easyLoadStage(force = false, pipeline: any): void {
    if (!force) {
      const loadStatus = this.loadStageStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStageStatus.next(STATUS.REQUEST);
    this.loadStage(pipeline).subscribe((dealStages) => {
      dealStages
        ? this.loadStageStatus.next(STATUS.SUCCESS)
        : this.loadStageStatus.next(STATUS.FAILURE);
      this.stages.next(dealStages || []);
      this.stageIdArray.next([]);
      this.stages.forEach((next) => {
        next.forEach((element) => {
          const idArray = this.stageIdArray.getValue();
          idArray.push(element._id);
          this.stageIdArray.next(idArray);
        });
      });
    });
  }
  getDealSearch(keyWord: string): Observable<any> {
    return this.httpClient
      .post(this.server + DEALSTAGE.GETSEARCH, { keyWord })
      .pipe(
        map((res) => res['deals']),
        catchError(this.handleError('GET DEALS SEARCH', null))
      );
  }

  getDealStage(id: string): Observable<any> {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'No-Auth': 'True'
    });
    return this.httpClient
      .get(this.server + DEALSTAGE.GET + id, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('REQUEST DEAL STAGE', false))
      );
  }

  getStage(force = false): void {
    if (!force) {
      const loadStatus = this.loadStageStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStageStatus.next(STATUS.REQUEST);
    this.getStageSubscription && this.getStageSubscription.unsubscribe();
    this.getStageSubscription = this.getStageImpl().subscribe((dealStages) => {
      dealStages
        ? this.loadStageStatus.next(STATUS.SUCCESS)
        : this.loadStageStatus.next(STATUS.FAILURE);
      this.stages.next(dealStages || []);
      this.stages.forEach((next) => {
        next.forEach((element) => {
          const idArray = this.stageIdArray.getValue();
          idArray.push(element._id);
          this.stageIdArray.next(idArray);
        });
      });
    });
  }

  easyLoadPageStage(data: Pipeline): void {
    this.loadPageStageStatus.next(STATUS.REQUEST);
    this.loadStage(data).subscribe((dealStages) => {
      dealStages
        ? this.loadPageStageStatus.next(STATUS.SUCCESS)
        : this.loadPageStageStatus.next(STATUS.FAILURE);
      this.pageStages.next(dealStages || []);
      this.pageStageIdArray.next([]);
      this.pageStages.forEach((next) => {
        next.forEach((element) => {
          const idArray = this.pageStageIdArray.getValue();
          idArray.push(element._id);
          this.pageStageIdArray.next(idArray);
        });
      });
      this.pageStageLoaded.next(true);
    });
  }

  updatePageStages(id: string, request): void {
    const dealStages = this.pageStages.getValue();
    const stages = dealStages.map((item) => {
      if (item._id == id) {
        item = { ...item, ...request };
      }
      return item;
    });
    console.log(stages);
    this.pageStages.next(stages);
  }
  searchDeals(data: any): Observable<Deal[]> {
    return this.httpClient
      .post(this.server + DEALSTAGE.SEARCH_DEALS, data)
      .pipe(
        map((res) => (res['data'] || []).map((e) => new Deal().deserialize(e))),
        catchError(this.handleError('SEARCH DEALS', null))
      );
  }

  loadMore(data: any): Observable<Deal[]> {
    return this.httpClient.post(this.server + DEALSTAGE.LOAD_MORE, data).pipe(
      map((res) => (res['data'] || []).map((e) => new Deal().deserialize(e))),
      catchError(this.handleError('LOAD MORE STAGE', null))
    );
  }

  easyLoadMore(data: any, isRefresh = false): void {
    const loadMoreStatus = this.loadMoreStageStatus.getValue();
    if (loadMoreStatus[data.stage] === STATUS.REQUEST) return;
    loadMoreStatus[data.stage] = STATUS.REQUEST;
    this.loadMoreStageStatus.next(loadMoreStatus);
    this.loadMore(data).subscribe((deals) => {
      if (deals) {
        loadMoreStatus[data.stage] = STATUS.SUCCESS;
        const dealStages = this.pageStages.getValue();
        const index = dealStages.findIndex((item) => item._id == data.stage);
        if (index >= 0) {
          if (isRefresh || !data['skip']) {
            dealStages[index].deals = deals;
          } else {
            dealStages[index].deals = [...dealStages[index].deals, ...deals];
          }
        }
        this.pageStages.next(dealStages);
      } else {
        loadMoreStatus[data.stage] = STATUS.FAILURE;
      }
      this.loadMoreStageStatus.next(loadMoreStatus);
    });
  }

  getStageImpl(): Observable<DealStage[]> {
    return this.httpClient.get(this.server + DEALSTAGE.GET).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new DealStage().deserialize(e))
      ),
      catchError(this.handleError('LOAD STAGES 1', null))
    );
  }

  createStage(stage: any): Observable<any> {
    return this.httpClient.post(this.server + DEALSTAGE.GET, stage).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE STAGE', null))
    );
  }
  createStages(stage: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEALSTAGE.ADD, stage).pipe(
      map((res) => res['data']),
      catchError(this.handleError('CREATE STAGE', null))
    );
  }

  createStage$(stage: DealStage): void {
    const stages = this.stages.getValue();
    if (!stages.find((s) => s._id === stage._id)) {
      stages.push(stage);
      this.stages.next(stages);
      const idArray = this.stageIdArray.getValue();
      if (!idArray.includes(stage._id)) {
        idArray.push(stage._id);
        this.stageIdArray.next(idArray);
      }
    }

    const pageStages = this.pageStages.getValue();
    if (!pageStages.find((s) => s._id === stage._id)) {
      pageStages.push(stage);
      this.pageStages.next(pageStages);
      const pageIdArray = this.pageStageIdArray.getValue();
      if (!pageIdArray.includes(stage._id)) {
        pageIdArray.push(stage._id);
        this.pageStageIdArray.next(pageIdArray);
      }
    }
  }

  deleteStage(
    sourceId: string,
    targetId: string,
    assignAutomation = false
  ): any {
    return this.httpClient
      .post(this.server + DEALSTAGE.DELETE, {
        remove_stage: sourceId,
        move_stage: targetId,
        assign_automation: assignAutomation
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('STAGE REMOVE', false))
      );
  }

  updateStage(id: string, data: any): any {
    this.pageStageLoaded.next(false);
    return this.httpClient.put(this.server + DEALSTAGE.EDIT + id, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE DEAL STAGE', false))
    );
  }

  changeStageOrder(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEALSTAGE.CHANGE_ORDER, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('CHANGE ORDER', false))
      );
  }

  getDeal(id: string): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET + id).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET DEAL', null))
    );
  }

  getDeals(dealIds: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.GET_DEALS, dealIds).pipe(
      map((res) => res['data']),
      catchError(this.handleError('GET DEALS', null))
    );
  }

  editDeal(id: string, deal: any): Observable<any> {
    return this.httpClient.put(this.server + DEAL.GET + id, deal).pipe(
      map((res) => res['status']),
      catchError(this.handleError('Edit DEAL', false))
    );
  }

  updateContact({
    dealId,
    action,
    ids,
    deleteAllData = true,
    isAssign = false
  }: {
    dealId: string;
    action: string;
    ids: string[];
    deleteAllData?: boolean;
    isAssign?: boolean;
  }): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.UPDATE_CONTACT + dealId, {
        action,
        contacts: ids,
        deleteAllDealData: deleteAllData,
        isAssign
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('EDIT DEAL CONTACTS', false))
      );
  }

  createDeal(deal: any): any {
    return this.httpClient
      .post(this.server + DEAL.GET, deal)
      .pipe(catchError(this.handleError('DEAL CREATE', null)));
  }

  deleteDeal(deal: string): Observable<boolean> {
    return this.httpClient.delete(this.server + DEAL.GET + deal).pipe(
      map((res) => !!res['status']),
      catchError(this.handleError('DELETE DEAL', false))
    );
  }

  bulkDelete(data: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEAL.BULK_DELETE, data).pipe(
      map((res) => res['removed_deals'] || []),
      catchError(this.handleError('BULK DELETE DEALS', []))
    );
  }

  deleteOnlyDeal(deal: string): Observable<boolean> {
    return this.httpClient.delete(this.server + DEAL.ONLY_DEAL + deal).pipe(
      map((res) => !!res['status']),
      catchError(this.handleError('DELETE DEAL', false))
    );
  }

  moveDeal(data: any): any {
    return this.httpClient.post(this.server + DEAL.MOVE, data);
  }

  clear$(): void {
    this.loadStageStatus.next(STATUS.NONE);
    this.loadDealStatus.next(STATUS.NONE);
    this.stages.next([]);
    this.stageIdArray.next([]);
    this.deals.next([]);
    this.pipelines.next([]);
    this.pageStages.next([]);
    this.pageStageIdArray.next([]);
    this.selectedPipeline.next(null);
  }

  addNote(data: any): Observable<any> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .post(this.server + DEAL.ADD_NOTE, data, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('ADD DEAL NOTE', []))
      );
  }

  editNote(data: any): Observable<boolean> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient
      .post(this.server + DEAL.EDIT_NOTE, data, {
        headers: reqHeader
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('EDIT DEAL NOTE', false))
      );
  }

  removeNote(data: any): Observable<boolean> {
    return this.httpClient.post(this.server + DEAL.REMOVE_NOTE, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('REMOVE DEAL NOTE', false))
    );
  }

  getNotes(data: any): Observable<Note[]> {
    return this.httpClient.post(this.server + DEAL.GET_NOTES, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL NOTE', []))
    );
  }

  sendEmail(data: any): Observable<any> {
    data['timezone'] = moment.tz.guess();
    return this.httpClient.post(this.server + DEAL.SEND_EMAIL, data).pipe(
      map((res) => res),
      catchError(this.handleError('DEAL SEND EMAIL', [], true))
    );
  }

  getEmails(data: any): Observable<Email[]> {
    return this.httpClient.post(this.server + DEAL.GET_EMAILS, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL EMAILS', []))
    );
  }

  addFollowUp(data: any): Observable<any> {
    if (!data.timezone) {
      data.timezone = moment()['_z'].name;
    }
    return this.httpClient.post(this.server + DEAL.ADD_FOLLOWUP, data).pipe(
      map((res) => res),
      catchError(this.handleError('ADD DEAL FOLLOWUP', []))
    );
  }

  editFollowUp(data: any): Observable<any> {
    if (!data.timezone) {
      data.timezone = moment()['_z']?.name
        ? moment()['_z'].name
        : moment.tz.guess();
    }
    return this.httpClient.post(this.server + DEAL.EDIT_FOLLOWUP, data).pipe(
      map((res) => res),
      catchError(this.handleError('EDIT DEAL FOLLOWUP', null))
    );
  }

  completeFollowUp(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.COMPLETE_FOLLOWUP, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('COMPLETE DEAL FOLLOWUP', false))
      );
  }

  removeFollowUp(data: any): Observable<boolean> {
    return this.httpClient.post(this.server + DEAL.REMOVE_FOLLOWUP, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('REMOVE DEAL FOLLOWUP', false))
    );
  }

  getFollowUp(data: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEAL.GET_FOLLOWUP, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL FOLLOWUP', []))
    );
  }

  getActivity(data: any): Observable<DetailActivity[]> {
    return this.httpClient.post(this.server + DEAL.GET_ACTIVITY, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL ACTIVITY', []))
    );
  }

  addAppointment(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.ADD_APPOINTMENT, data).pipe(
      map((res) => res),
      catchError(this.handleError('ADD DEAL APPOINTMENT', []))
    );
  }

  updateAppointment(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.UPDATE_APPOINTMENT, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REMOVE DEAL APPOINTMENT', false))
      );
  }

  removeAppointment(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.REMOVE_APPOINTMENT, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REMOVE DEAL APPOINTMENT', false))
      );
  }

  getAppointments(data: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEAL.GET_APPOINTMENT, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL APPOINTMENT', []))
    );
  }

  addGroupCall(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.ADD_GROUP_CALL, data).pipe(
      map((res) => res),
      catchError(this.handleError('ADD DEAL GROUP CALL', []))
    );
  }

  getGroupCalls(data: any): Observable<any[]> {
    return this.httpClient.post(this.server + DEAL.GET_GROUP_CALL, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET DEAL GROUP CALL', []))
    );
  }

  updateGroupCall(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.UPDAGE_GROUP_CALL, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('EDIT DEAL GROUP CALL', false))
      );
  }

  removeGroupCall(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.REMOVE_GROUP_CALL, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('REMOVE DEAL GROUP CALL', false))
      );
  }

  sendText(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.SEND_TEXT, data).pipe(
      map((res) => res),
      catchError(this.handleError('SEND DEAL TEXT', false, true))
    );
  }

  getStageWithContactImpl(): Observable<any> {
    return this.httpClient.get(this.server + DEALSTAGE.WITHCONTACT).pipe(
      map((res) => {
        return res['data'];
      }),
      catchError(this.handleError('GET STAGE WITH CONTACT', []))
    );
  }

  getMaterialActivity(activity_id): Observable<any> {
    return this.httpClient
      .get(this.server + DEAL.MATERIAL_ACTIVITY + activity_id)
      .pipe(
        map((res) => {
          return res['data'];
        }),
        catchError(this.handleError('GET MATERAIL ACTIVITY', []))
      );
  }

  loadTasks(_id: string): Observable<any[]> {
    return this.httpClient.get(this.server + DEAL.LOAD_TASKS + _id).pipe(
      map((res) => res['data'] || [].map((e) => new Timeline().deserialize(e))),
      catchError(this.handleError('LOAD DEAL TASKS', []))
    );
  }

  getTimeLines(deal_id): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET_TIMELINES + deal_id).pipe(
      map((res) => {
        return res['data'];
      }),
      catchError(this.handleError('GET DEAL TIMELINES', []))
    );
  }

  getAllTimeLines(): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET_All_TIMELINES).pipe(
      map((res) => {
        return res['data'];
      }),
      catchError(this.handleError('GET ALL TIMELINES', []))
    );
  }

  bulkCreate(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.BULK_CREATE, data).pipe(
      map((res) => res),
      catchError(this.handleError('BULK CREATE DEAL', false, true))
    );
  }

  bulkCreateCSV(data: any): Observable<any> {
    return this.httpClient.post(this.server + DEAL.BULK_CREATE_CSV, data).pipe(
      map((res) => res),
      catchError(
        this.handleError('BULK CREATE DEAL FROM CSV FILE', false, true)
      )
    );
  }

  setPrimaryContact(deal_id, contact_id): Observable<boolean> {
    return this.httpClient
      .post(this.server + DEAL.SET_PRIMARY_CONTACT, {
        deal_id,
        contact_id
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('SET PRIMARY CONTACT', false))
      );
  }

  getSiblings(deal_id: string) {
    this.getSiblingsImpl(deal_id).subscribe((res) => {
      this.siblings.next({ ...res, current: deal_id });
    });
  }

  getSiblingsImpl(deal_id: string): Observable<any> {
    return this.httpClient.get(this.server + DEAL.GET_SIBLINGS + deal_id).pipe(
      map((res) => {
        return res;
      }),
      catchError(this.handleError('GET DEAL SIBLINGS', null))
    );
  }
  getStageWithContact(force = false): void {
    this.getStageWithContactImpl().subscribe((stages) => {
      if (stages) {
        const stageContactsMap = {};
        stages.forEach((e) => {
          if (e.contactIds && e.contactIds) {
            e.contactIds.forEach((_c) => {
              if (stageContactsMap[_c]) {
                stageContactsMap[_c].push(e.title);
              } else {
                stageContactsMap[_c] = [e.title];
              }
            });
          }
        });
        this.stageContacts.next(stageContactsMap);
      }
    });
  }

  /**
   * Get count of deals
   */
  getOverivewCount(): any {
    return this.httpClient.get(this.server + DEAL.GET_COUNT).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('GET COUNT', []))
    );
  }

  onCreate(): void {
    this.created.next(Date.now());
  }

  getContactsByStage(dealStageId: string): Observable<any> {
    return this.httpClient
      .post(this.server + DEAL.DEAL_STAGE_CONTACTS, { dealStageId })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD DEALS', null))
      );
  }

  updateDealOnStage(newDeal: any, oldDeal: any): void {
    const pageStages = this.pageStages.getValue();
    if (newDeal.deal_stage !== oldDeal.deal_stage._id) {
      const newPageStages = pageStages.map((stage) => {
        if (stage._id === newDeal.deal_stage) {
          stage.deals.push(newDeal);
          stage.deals_count++;
          stage.price += newDeal.price;
        } else if (stage._id === oldDeal.deal_stage._id) {
          stage.deals = stage.deals?.filter((e) => e._id !== oldDeal._id);
          stage.deals_count--;
          stage.price -= oldDeal.price;
        }
        return stage;
      });
      this.pageStages.next(newPageStages || []);
    } else {
      const newPageStages = pageStages.map((stage) => {
        const idx = stage.deals.findIndex((e) => e._id === oldDeal._id);
        if (idx > -1) {
          stage.deals[idx] = newDeal;
          if (oldDeal.price > 0) stage.price -= oldDeal.price;
          if (newDeal.price > 0) stage.price += newDeal.price;
        }
        return stage;
      });
      this.pageStages.next(newPageStages || []);
    }
  }
}
function subscribe(arg0: (pipeLines: any) => void) {
  throw new Error('Function not implemented.');
}
