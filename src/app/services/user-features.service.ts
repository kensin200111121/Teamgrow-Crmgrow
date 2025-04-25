import { Injectable } from '@angular/core';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UserFeatureService {
  readonly enabledFeatures = [
    USER_FEATURES.AUTOMATION,
    USER_FEATURES.TEXT,
    USER_FEATURES.PIPELINE,
    USER_FEATURES.DEAL,
    USER_FEATURES.MATERIAL,
    USER_FEATURES.ASSISTANT,
    USER_FEATURES.CALENDER,
    USER_FEATURES.EMAIL,
    USER_FEATURES.CONTACT_SHARE,
    USER_FEATURES.ORGANIZATION,
    USER_FEATURES.DIALER,
    USER_FEATURES.EXT_EMAIL,
    USER_FEATURES.MATERIAL_TRACK,
    USER_FEATURES.CAMPAIGN,
    USER_FEATURES.LANDINGPAGE,
    USER_FEATURES.SCHEDULER,
    USER_FEATURES.ASSIGNEE,
    USER_FEATURES.AVM,
    USER_FEATURES.COMMUNITY,
    USER_FEATURES.AFFILIATE,
    USER_FEATURES.CONTACT_SEARCH_BY_COMMUNITY
    // USER_FEATURES.BETA,
  ];

  private changedFeatures: BehaviorSubject<number> = new BehaviorSubject(
    Date.now()
  );
  changedFeatures$ = this.changedFeatures.asObservable();

  enableNewFeature(feature: string) {
    if (this.enabledFeatures.includes(feature)) {
      return;
    }
    this.enabledFeatures.push(feature);
    this.changedFeatures.next(new Date().getTime());
  }

  disableFeature(feature: string) {
    const index = this.enabledFeatures.findIndex((e) => e === feature);
    if (index !== -1) {
      this.enabledFeatures.splice(index, 1);
    }
    this.changedFeatures.next(new Date().getTime());
  }

  isEnableFeature(feature: string) {
    const index = this.enabledFeatures.findIndex((e) => e === feature);
    return index === -1 ? false : true;
  }

  updateFeature(user) {
    if (user.automation_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.AUTOMATION);
    } else {
      this.disableFeature(USER_FEATURES.AUTOMATION);
    }

    if (user.text_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.TEXT);
    } else {
      this.disableFeature(USER_FEATURES.TEXT);
    }

    if (user.pipe_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.PIPELINE);
      this.enableNewFeature(USER_FEATURES.DEAL);
    } else {
      this.disableFeature(USER_FEATURES.PIPELINE);
      this.disableFeature(USER_FEATURES.DEAL);
    }

    if (user.material_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.MATERIAL);
    } else {
      this.disableFeature(USER_FEATURES.MATERIAL);
    }

    if (user.assistant_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.ASSISTANT);
    } else {
      this.disableFeature(USER_FEATURES.ASSISTANT);
    }

    if (user.calendar_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.CALENDER);
    } else {
      this.disableFeature(USER_FEATURES.CALENDER);
    }

    if (user.email_info?.mass_enable) {
      this.enableNewFeature(USER_FEATURES.EMAIL);
    } else {
      this.disableFeature(USER_FEATURES.EMAIL);
    }

    if (user.team_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.COMMUNITY);
      if (user.team_info?.owner_enabled) {
        this.enableNewFeature(USER_FEATURES.COMMUNITY_CREATE);
      } else {
        this.disableFeature(USER_FEATURES.COMMUNITY_CREATE);
      }
    } else {
      this.disableFeature(USER_FEATURES.COMMUNITY);
      this.disableFeature(USER_FEATURES.COMMUNITY_CREATE);
    }

    if (user.source === 'vortex' || user.user_version >= 2.3) {
      if (user.organization_info?.is_enabled && user.organization) {
        this.enableNewFeature(USER_FEATURES.ORGANIZATION);
        this.enableNewFeature(USER_FEATURES.CONTACT_SHARE);
      } else {
        this.disableFeature(USER_FEATURES.ORGANIZATION);
        this.disableFeature(USER_FEATURES.CONTACT_SHARE);
      }
    } else {
      if (user.organization_info?.is_enabled || user.team_info?.is_enabled) {
        this.enableNewFeature(USER_FEATURES.CONTACT_SHARE);
      } else {
        this.disableFeature(USER_FEATURES.CONTACT_SHARE);
      }
      if (user.organization_info?.is_enabled && user.organization) {
        this.enableNewFeature(USER_FEATURES.ORGANIZATION);
      } else {
        this.disableFeature(USER_FEATURES.ORGANIZATION);
      }
    }
    if (user.dialer_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.DIALER);
    } else {
      this.disableFeature(USER_FEATURES.DIALER);
    }

    if (user.ext_email_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.EXT_EMAIL);
    } else {
      this.disableFeature(USER_FEATURES.EXT_EMAIL);
    }

    if (user.material_track_info?.owner_enabled) {
      this.enableNewFeature(USER_FEATURES.MATERIAL_TRACK);
    } else {
      this.disableFeature(USER_FEATURES.MATERIAL_TRACK);
    }

    if (user.campaign_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.CAMPAIGN);
    } else {
      this.disableFeature(USER_FEATURES.CAMPAIGN);
    }

    if (user.scheduler_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.SCHEDULER);
    } else {
      this.disableFeature(USER_FEATURES.SCHEDULER);
    }

    if (user.landing_page_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.LANDINGPAGE);
    } else {
      this.disableFeature(USER_FEATURES.LANDINGPAGE);
    }

    if (user.assignee_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.ASSIGNEE);
    } else {
      this.disableFeature(USER_FEATURES.ASSIGNEE);
    }

    if (user.assignee_info?.is_editable) {
      this.enableNewFeature(USER_FEATURES.ASSIGNEE_EDIT);
    } else {
      this.disableFeature(USER_FEATURES.ASSIGNEE_EDIT);
    }

    if (user.agent_vending_info?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.AVM);
    } else {
      this.disableFeature(USER_FEATURES.AVM);
    }

    if (user.affiliate?.is_enabled) {
      this.enableNewFeature(USER_FEATURES.AFFILIATE);
    } else {
      this.disableFeature(USER_FEATURES.AFFILIATE);
    }

    if (user.user_version < 2.3 && user.source === 'crmgrow') {
      this.enableNewFeature(USER_FEATURES.CONTACT_SEARCH_BY_COMMUNITY);
    } else {
      this.disableFeature(USER_FEATURES.CONTACT_SEARCH_BY_COMMUNITY);
    }
  }
}
