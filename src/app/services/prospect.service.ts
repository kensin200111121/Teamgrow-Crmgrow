import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { Observable, map, of, forkJoin } from 'rxjs';
import { NewLeadsOverview, ProspectOverview } from '@app/types/prospect.type';

@Injectable({
  providedIn: 'root'
})
export class ProspectService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  loadProspectOverview(): Observable<ProspectOverview> {
    const userId = localStorage.getItem('ls.user_id');
    const teamUserId = localStorage.getItem('ls.team_user_id');
    const token = localStorage.getItem('ls.token');

    const requests: Observable<ProspectOverview>[] = [];

    if (userId) {
      const userRequest = this.httpClient.get<ProspectOverview>(
        environment.VORTEX_BASE +
          `api/users/${userId}/stats/leads/counts/total?format=crmDashboard&access_token=${token}`
      );
      requests.push(userRequest);
    }
    if (teamUserId) {
      const teamRequest = this.httpClient.get<ProspectOverview>(
        environment.VORTEX_BASE +
          `api/users/${teamUserId}/stats/leads/counts/total?format=crmDashboard&access_token=${token}`
      );
      requests.push(teamRequest);
    }

    const result = { Total: 0, new: 0 };
  
    if (requests.length === 0) {
      return of(result);
    }
  
    return forkJoin(requests).pipe(
      map((responses) => {
        responses.forEach((res) => {
          result.Total += res?.Total ?? 0;
          result.new += res?.new ?? 0;
        });
        return result;
      })
    );
  }

  loadNewLeadsOverview(range = 7): Observable<NewLeadsOverview> {
    const userId = localStorage.getItem('ls.user_id');
    const teamUserId = localStorage.getItem('ls.team_user_id');
    const token = localStorage.getItem('ls.token');
    
    const requests: Observable<NewLeadsOverview>[] = [];

    if (userId) {
      const userRequest = this.httpClient.get<NewLeadsOverview>(
        environment.VORTEX_BASE +
          `api/users/${userId}/stats/leads/counts/new?format=crmDashboard&range=${range}&access_token=${token}`
      );
      requests.push(userRequest);
    }
    if (teamUserId) {
      const teamRequest = this.httpClient.get<NewLeadsOverview>(
        environment.VORTEX_BASE +
          `api/users/${teamUserId}/stats/leads/counts/new?format=crmDashboard&range=${range}&access_token=${token}`
      );
      requests.push(teamRequest);
    }

    const result = {
      Expired: 0,
      Cancelled: 0,
      Withdrawn: 0,
      OffMarket: 0,
      PreForeclosure: 0,
      Auction: 0,
      REO: 0,
      NoticeOfDefault: 0,
      REOSale: 0,
      FSBO: 0,
      FRBO: 0,
      Geo: 0,
      ThirdParty: 0
    };
  
    if (requests.length === 0) {
      return of(result);
    }
  
    return forkJoin(requests).pipe(
      map((responses) => {
        responses.forEach((res) => {
          result.Expired += res?.Expired ?? 0;
          result.Cancelled += res?.Cancelled ?? 0;
          result.Withdrawn += res?.Withdrawn ?? 0;
          result.OffMarket += res?.OffMarket ?? 0;
          result.PreForeclosure += res?.PreForeclosure ?? 0
          result.Auction += res?.Auction ?? 0;
          result.REO += res?.REO ?? 0;
          result.NoticeOfDefault += res?.NoticeOfDefault ?? 0;
          result.REOSale += res?.REOSale ?? 0;
          result.FSBO += res?.FSBO ?? 0;
          result.FRBO += res?.FRBO ?? 0;
          result.Geo += res?.Geo ?? 0;
          result.ThirdParty += res?.ThirdParty ?? 0;
        });
        return result;
      })
    );
  }

  loadPulseOverview(data): Observable<any> {
    const userId = localStorage.getItem('ls.user_id');
    const token = localStorage.getItem('ls.token');
    return this.httpClient
      .post(
        environment.VORTEX_BASE +
          `api/users/${userId}/reports/call-stats?access_token=${token}`,
        JSON.stringify(data)
      )
      .pipe(map((res) => res));
  }
}
