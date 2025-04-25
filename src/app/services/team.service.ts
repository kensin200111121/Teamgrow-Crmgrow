import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TEAM } from '@constants/api.constant';
import { Team } from '@models/team.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { TeamCall } from '@models/team-call.model';
import { User } from '@models/user.model';
import { environment } from '@environments/environment';
import { STATUS } from '@constants/variable.constants';
import * as _ from 'lodash';
import { Material } from '@models/material.model';
import { Automation } from '@models/automation.model';
import { Template } from '@models/template.model';
import { Contact, ContactActivity } from '@models/contact.model';
import { StoreService } from '@services/store.service';
@Injectable({
  providedIn: 'root'
})
export class TeamService extends HttpService {
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
  }

  teams: BehaviorSubject<Team[]> = new BehaviorSubject([]);
  teams$ = this.teams.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loadStatus.asObservable();

  requests: BehaviorSubject<Team[]> = new BehaviorSubject([]);
  requests$ = this.requests.asObservable();
  requestsLoadStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  requestsLoading$ = this.requestsLoadStatus.asObservable();

  invites: BehaviorSubject<Team[]> = new BehaviorSubject([]);
  invites$ = this.invites.asObservable();
  invitesLoadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  invitesLoading$ = this.invitesLoadStatus.asObservable();

  sharedMaterials: BehaviorSubject<Material[]> = new BehaviorSubject([]);
  sharedMaterials$ = this.sharedMaterials.asObservable();
  sharedMaterialsLoadStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  sharedMaterialsLoading$ = this.sharedMaterialsLoadStatus.asObservable();
  loadSharedMaterialsSubscription: Subscription;

  sharedAutomations: BehaviorSubject<Automation[]> = new BehaviorSubject([]);
  sharedAutomations$ = this.sharedAutomations.asObservable();
  sharedAutomationsLoadStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  sharedAutomationsLoading$ = this.sharedAutomationsLoadStatus.asObservable();
  loadSharedAutomationsSubscription: Subscription;

  sharedTemplates: BehaviorSubject<Template[]> = new BehaviorSubject([]);
  sharedTemplates$ = this.sharedTemplates.asObservable();
  sharedTemplatesLoadStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  sharedTemplatesLoading$ = this.sharedTemplatesLoadStatus.asObservable();
  loadSharedTemplatesSubscription: Subscription;

  sharedContacts: BehaviorSubject<ContactActivity[]> = new BehaviorSubject([]);
  sharedContacts$ = this.sharedContacts.asObservable();
  sharedContactsLoadStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  sharedContactsLoading$ = this.sharedContactsLoadStatus.asObservable();
  loadSharedContactsSubscription: Subscription;
  sharedContactsTotal: BehaviorSubject<number> = new BehaviorSubject(0);
  sharedContactsTotal$ = this.sharedContactsTotal.asObservable();

  materialPageOption: BehaviorSubject<any> = new BehaviorSubject({
    page: 1,
    pageSize: { id: 8, label: '8' },
    searchCondition: {
      title: false,
      owner: false,
      material_type: false,
      created_at: false,
      views: false
    },
    selectedSort: 'title'
  });
  materialPageOption$ = this.materialPageOption.asObservable();

  /**
   * LOAD ALL TEMPLATES
   * @param force Flag to load force
   */
  loadAll(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.loadAllImpl().subscribe((teams) => {
      teams
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.teams.next(teams || []);
    });
  }

  /**
   * CALL LOAD API
   */
  loadAllImpl(): Observable<Team[]> {
    return this.httpClient.get(this.server + TEAM.LOAD).pipe(
      map((res) => (res['data'] || []).map((e) => new Team().deserialize(e))),
      catchError(this.handleError('LOAD TEAM', null))
    );
  }

  /**
   * Load the Team Leaders
   */
  loadLeaders(): Observable<User[]> {
    return this.httpClient.get(this.server + TEAM.LOAD_LEADERS).pipe(
      map((res) =>
        (res['data'] || []).map((data) => new User().deserialize(data))
      ),
      catchError(this.handleError('LOAD LEADERS', []))
    );
  }
  /**
   * Search team or user by keyword
   * Response Data: {status, team_array, user_array}
   * @param keyword : keyword to search
   */
  searchTeam(keyword: string, skip = 0): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.SEARCH_TEAM, {
        search: keyword,
        skip: skip
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SEARCH TEAM AND USERS', {}))
      );
  }
  /**
   * search the teams by id of the user that is included.
   * Response Data: Team array observable
   * @param id : id of the user that included team
   */
  searchTeamByUser(id: string): Observable<Team[]> {
    return this.httpClient
      .get(this.server + TEAM.SEARCH_TEAM_BY_USER + id)
      .pipe(
        map((res) => (res['data'] || []).map((e) => new Team().deserialize(e))),
        catchError(this.handleError('SEARCH TEAMS BY USER', []))
      );
  }
  /**
   * Search user -> This is part of the team and user search
   * @param keyword: string to search users
   */
  searchUser(keyword: string, skip = 0): Observable<User[]> {
    return this.httpClient
      .post(this.server + TEAM.SEARCH_TEAM, { search: keyword, skip })
      .pipe(
        map((res) =>
          (res['user_array'] || []).map((e) => new User().deserialize(e))
        ),
        catchError(this.handleError('SEARCH USERS', {}))
      );
  }

  /**
   * Load the invites and Put them to Subject
   */
  loadRequests(force = false): void {
    if (!force) {
      const loadStatus = this.requestsLoadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.requestsLoadStatus.next(STATUS.REQUEST);
    this.loadRequestsImpl().subscribe((requests) => {
      requests
        ? this.requestsLoadStatus.next(STATUS.SUCCESS)
        : this.requestsLoadStatus.next(STATUS.FAILURE);
      this.requests.next(requests || []);
    });
  }

  /**
   * Call API to Load Invites
   */
  loadRequestsImpl(): Observable<Team[]> {
    return this.httpClient.get(this.server + TEAM.LOAD_REQUESTED).pipe(
      map((res) => (res['data'] || []).map((e) => new Team().deserialize(e))),
      catchError(this.handleError('LOAD REQUEST TEAM', []))
    );
  }

  /**
   * Load the invites and Put them to Subject
   */
  loadInvites(force = false): void {
    if (!force) {
      const loadStatus = this.invitesLoadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.invitesLoadStatus.next(STATUS.REQUEST);
    this.loadInvitesImpl().subscribe((teams) => {
      teams
        ? this.invitesLoadStatus.next(STATUS.SUCCESS)
        : this.invitesLoadStatus.next(STATUS.FAILURE);
      this.invites.next(teams || []);
    });
  }

  /**
   * Call API to Load Invites
   */
  loadInvitesImpl(): Observable<Team[]> {
    return this.httpClient.get(this.server + TEAM.LOAD_INVITED).pipe(
      map((res) => (res['data'] || []).map((e) => new Team().deserialize(e))),
      catchError(this.handleError('LOAD INVITED TEAM', []))
    );
  }

  loadSharedMaterials(teamId: string): void {
    this.sharedMaterialsLoadStatus.next(STATUS.REQUEST);
    this.loadSharedMaterialsSubscription &&
      this.loadSharedMaterialsSubscription.unsubscribe();
    this.loadSharedMaterialsSubscription = this.loadSharedMaterialsImpl(
      teamId
    ).subscribe((res) => {
      res
        ? this.sharedMaterialsLoadStatus.next(STATUS.SUCCESS)
        : this.sharedMaterialsLoadStatus.next(STATUS.FAILURE);
      if (res) {
        this.storeService.sharedMaterials.next([
          ...res['video_data'],
          ...res['pdf_data'],
          ...res['image_data'],
          ...res['folder_data']
        ]);
      }
    });
  }

  loadSharedMaterialsImpl(teamId: string): Observable<any[]> {
    return this.httpClient
      .get(this.server + TEAM.LOAD_SHARE_MATERIALS + teamId)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('TEAM LOAD SHARED MATERIALS', []))
      );
  }

  loadSharedAutomations(teamId: string): void {
    this.sharedAutomationsLoadStatus.next(STATUS.REQUEST);
    this.loadSharedAutomationsSubscription &&
      this.loadSharedAutomationsSubscription.unsubscribe();
    this.loadSharedAutomationsSubscription = this.loadSharedAutomationsImpl(
      teamId
    ).subscribe((res) => {
      res
        ? this.sharedAutomationsLoadStatus.next(STATUS.SUCCESS)
        : this.sharedAutomationsLoadStatus.next(STATUS.FAILURE);
      if (res) {
        this.storeService.sharedAutomations.next(res);
      }
    });
  }

  loadSharedAutomationsImpl(teamId: string): Observable<any[]> {
    return this.httpClient
      .get(this.server + TEAM.LOAD_SHARE_AUTOMATIONS + teamId)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('TEAM LOAD SHARED AUTOMATIONS', []))
      );
  }

  loadSharedTemplates(teamId: string): void {
    this.sharedTemplatesLoadStatus.next(STATUS.REQUEST);
    this.loadSharedTemplatesSubscription &&
      this.loadSharedTemplatesSubscription.unsubscribe();
    this.loadSharedTemplatesSubscription = this.loadSharedTemplatesImpl(
      teamId
    ).subscribe((res) => {
      res
        ? this.sharedTemplatesLoadStatus.next(STATUS.SUCCESS)
        : this.sharedTemplatesLoadStatus.next(STATUS.FAILURE);
      if (res) {
        this.storeService.sharedTemplates.next(res);
      }
    });
  }

  loadSharedTemplatesImpl(teamId: string): Observable<any[]> {
    return this.httpClient
      .get(this.server + TEAM.LOAD_SHARE_TEMPLATES + teamId)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('TEAM LOAD SHARED TEMPLATES', []))
      );
  }

  loadSharedContacts(data): void {
    this.sharedContactsLoadStatus.next(STATUS.REQUEST);
    this.loadSharedContactsSubscription &&
      this.loadSharedContactsSubscription.unsubscribe();
    this.loadSharedContactsSubscription = this.loadSharedContactsImpl(
      data
    ).subscribe((res) => {
      res
        ? this.sharedContactsLoadStatus.next(STATUS.SUCCESS)
        : this.sharedContactsLoadStatus.next(STATUS.FAILURE);
      if (res && res.contacts) {
        const pageContacts = [];
        for (const contact of res.contacts) {
          pageContacts.push(new ContactActivity().deserialize(contact));
        }
        this.sharedContactsTotal.next(res['count']);
        this.storeService.sharedContacts.next(pageContacts);
      }
    });
  }

  loadSharedContactsImpl(data): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.LOAD_SHARE_CONTACTS, data)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('TEAM LOAD SHARED CONTACTS', []))
      );
  }

  /**
   * Send the request to join
   * @param request: request object to join (searchedUser: user_id array || undefined, team_id: id of team)
   */
  requestJoin(request: any): Observable<any> {
    return this.httpClient
      .post(environment.api + TEAM.JOIN_REQUEST, request)
      .pipe(
        map((res) => res),
        catchError(this.handleError('TEAM JOIN REQUEST', null))
      );
  }

  cancelRequest(id: string): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.CANCEL_REQUEST + id, {})
      .pipe(
        map((res) => res),
        catchError(this.handleError('CANCEL REQUEST', {}))
      );
  }

  inviteUsers(id: string, emails: string[]): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.INVITE_USERS + id, {
        emails
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('SEND INVITATION', {}))
      );
  }

  cancelInvite(id: string, emails: string[]): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.CANCEL_INVITE + id, {
        emails
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('CANCEL INVITATION', {}))
      );
  }

  /**
   * Update Team from Subject
   * @param _id : Team Id to update
   * @param team : Data to update
   */
  updateTeam$(_id: string, team: Team): void {
    const teams = this.teams.getValue();
    teams.some((e) => {
      if (e._id === _id) {
        e = new Team().deserialize(team);
        return true;
      }
    });
    this.teams.next(teams);
  }
  /**
   * Delete Team from Subject
   * @param _id : Team Id to delete
   */
  deleteTeam$(_id: string): void {
    const teams = this.teams.getValue();
    _.remove(teams, (e) => {
      return e._id === _id;
    });
    this.teams.next(teams);
  }
  /**
   * Insert new team to Subject
   * @param team : New Team Data
   */
  createTeam$(team: Team): void {
    const teams = this.teams.getValue();
    teams.push(team);
    this.teams.next(teams);
  }
  update(id, data): Observable<Team[]> {
    return this.httpClient.put(this.server + TEAM.UPDATE + id, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('UPDATE TEAM NAME', []))
    );
  }
  delete(id): Observable<Team[]> {
    return this.httpClient.delete(this.server + TEAM.DELETE + id).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('DELETE TEAM', []))
    );
  }
  read(id): Observable<Team[]> {
    return this.httpClient.get(this.server + TEAM.READ + id).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('READ TEAM', []))
    );
  }
  acceptInvitation(teamId): Observable<any> {
    return this.httpClient.post(
      this.server + TEAM.ACCEPT_INVITATION + teamId,
      {}
    );
  }
  declineInvitation(teamId): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.DECLINE_INVITATION + teamId, {})
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('DECLINE TEAM INVITATION', []))
      );
  }
  shareTeamMaterials(teamIds, materialIds, type): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.SHARE_TEAM_MATERIALS, {
        team_ids: teamIds,
        material_ids: materialIds,
        type: type
      })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Material().deserialize(e))
        ),
        catchError(this.handleError('TEAM SHARE MATERIALS', []))
      );
  }
  shareMaterials(teamId, data): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.SHARE_MATERIALS, {
        team_id: teamId,
        data: data
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('SHARE MATERIALS', []))
      );
  }
  shareFolder(teamIds, data, type): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.SHARE_FOLDERS, {
        team_ids: teamIds,
        folder_ids: data,
        type
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('SHARE FOLDERS', []))
      );
  }

  removeVideo(id: string): Observable<any> {
    return this.httpClient.post(this.server + TEAM.REMOVE_VIDEO + id, {}).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('TEAM REMOVE VIDEO', []))
    );
  }
  removePdf(id: string): Observable<any> {
    return this.httpClient.post(this.server + TEAM.REMOVE_PDF + id, {}).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('TEAM REMOVE PDF', []))
    );
  }
  removeImage(id: string): Observable<any> {
    return this.httpClient.post(this.server + TEAM.REMOVE_IMAGE + id, {}).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('TEAM REMOVE IMAGE', []))
    );
  }
  removeFolder(team_id: string, folder_id: string): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.REMOVE_FOLDER + team_id, { folder_id })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('TEAM REMOVE FOLDER', []))
      );
  }
  removeTemplate(id): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.REMOVE_TEMPLATE + id, {})
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('TEAM REMOVE TEMPLATE', []))
      );
  }
  removeAutomation(id): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.REMOVE_AUTOMATION + id, {})
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('TEAM REMOVE AUTOMATION', []))
      );
  }
  updateTeam(teamId, data): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.UPDATE_TEAM, {
        team_id: teamId,
        data
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('UPDATE TEAM', []))
      );
  }
  acceptRequest(teamId, memberId): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.ACCEPT_REQUEST, {
        team_id: teamId,
        request_id: memberId
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('ACCEPT TEAM REQUEST', []))
      );
  }

  declineRequest(teamId, memberId): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.DECLINE_REQUEST, {
        team_id: teamId,
        request_id: memberId
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('DECLINE TEAM REQUEST', []))
      );
  }

  shareTemplates(teamIds, templateIds): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.SHARE_TEMPLATES, {
        team_ids: teamIds,
        template_ids: templateIds
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('SHARE TEMPLATES', []))
      );
  }

  shareAutomations(teamIds, automationIds): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.SHARE_AUTOMATIONS, {
        team_ids: teamIds,
        automation_ids: automationIds
      })
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('SHARE AUTOMATION', []))
      );
  }

  create(data): Observable<any> {
    return this.httpClient.post(this.server + TEAM.CREATE, data).pipe(
      map((res) => res['data'] || null),
      catchError(this.handleError('CREATE TEAM', null))
    );
  }

  getCallById(id): Observable<any> {
    return this.httpClient.get(this.server + TEAM.CALL + id).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD CALL BY ID', []))
    );
  }
  loadTeamCalls(type: string, skip: number, count: number): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.TEAM_CALL_LOAD, {
        type,
        skip,
        count
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD GROUP CALLS', null))
      );
  }
  getPageInquiries(page): Observable<any> {
    return this.httpClient.get(this.server + TEAM.INQUIRY + page).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD PAGE INQUIRIES CALL', []))
    );
  }
  getPagePlanned(page): Observable<any> {
    return this.httpClient.get(this.server + TEAM.PLANNED + page).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD PAGE PLANNED CALL', []))
    );
  }
  getPageFinished(page): Observable<any> {
    return this.httpClient.get(this.server + TEAM.FINISHED + page).pipe(
      map((res) => res),
      catchError(this.handleError('LOAD PAGE FINISHED CALL', []))
    );
  }
  updateCall(id, data): Observable<TeamCall[]> {
    return this.httpClient.put(this.server + TEAM.UPDATE_CALL + id, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UPDATE TEAM CALL'))
    );
  }
  deleteCall(id): Observable<TeamCall[]> {
    return this.httpClient.delete(this.server + TEAM.DELETE_CALL + id).pipe(
      map((res) => res['status']),
      catchError(this.handleError('DELETE TEAM CALL', false))
    );
  }
  requestCall(data): Observable<any> {
    return this.httpClient.post(this.server + TEAM.REQUEST_CALL, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('REQUEST CALL', []))
    );
  }
  acceptCall(data): Observable<any> {
    return this.httpClient.post(this.server + TEAM.ACCEPT_CALL, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('ACCEPT CALL', []))
    );
  }
  rejectCall(data): Observable<any> {
    return this.httpClient.post(this.server + TEAM.REJECT_CALL, data).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('REJECT CALL', []))
    );
  }

  searchContact(searchStr): Observable<Contact[]> {
    return this.httpClient
      .post(this.server + TEAM.SEARCH_CONTACT, searchStr)
      .pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('SEARCH TEAM CONTACT', []))
      );
  }

  selectAllSharedContacts(id): Observable<any> {
    return this.httpClient
      .post(this.server + TEAM.ALL_SHARED_CONTACT, { team: id })
      .pipe(
        map((res) =>
          (res['data'] || []).map((e) => new Contact().deserialize(e))
        ),
        catchError(this.handleError('GET ALL SHARED CONTACT', []))
      );
  }

  unshareFolders(data): Observable<boolean> {
    return this.httpClient.post(this.server + TEAM.UNSHARE_FOLDERS, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('UNSHARE FOLDER', false))
    );
  }

  unshareMaterials(data): Observable<boolean> {
    return this.httpClient
      .post(this.server + TEAM.UNSHARE_MATERIALS, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UNSHARE MATERIALS', false))
      );
  }

  unshareTemplates(data): Observable<boolean> {
    return this.httpClient
      .post(this.server + TEAM.UNSHARE_TEMPLATES, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UNSHARE TEMPLATES', false))
      );
  }

  unshareAutomations(data): Observable<boolean> {
    return this.httpClient
      .post(this.server + TEAM.UNSHARE_AUTOMATIONS, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UNSHARE AUTOMATIONS', false))
      );
  }

  stopShare(data) {
    return this.httpClient.post(this.server + TEAM.STOP_SHARE, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('STOP SHARE', false))
    );
  }

  stopShares(data) {
    return this.httpClient.post(this.server + TEAM.STOP_SHARES, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('STOP SHARES', false))
    );
  }

  clear$(): void {
    this.teams.next([]);
    this.invites.next([]);
    this.loadStatus.next(STATUS.NONE);
    this.invitesLoadStatus.next(STATUS.NONE);
  }

  ableLeaveTeam(teamId: string, memberId: string): any {
    return this.httpClient
      .post(this.server + TEAM.LEAVE, {
        teamId: teamId,
        memberId: memberId
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LEAVE COMMUNITY', null))
      );
  }
  removeTeamMemberItems(teamId: string, memberId: string): any {
    return this.httpClient
      .post(this.server + TEAM.removeMemberItems, {
        teamId: teamId,
        memberId: memberId
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('Remove Community Member Items', null))
      );
  }
}
