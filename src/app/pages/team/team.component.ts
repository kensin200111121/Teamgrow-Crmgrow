import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { TeamService } from '@services/team.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { TabItem } from '@utils/data.types';
import { TeamEditComponent } from '@components/team-edit/team-edit.component';
import { InviteTeamComponent } from '@components/invite-team/invite-team.component';
import { DialogSettings, MIN_ROW_COUNT } from '@constants/variable.constants';
import { NotifyComponent } from '@components/notify/notify.component';
import { TeamContactShareComponent } from '@components/team-contact-share/team-contact-share.component';
import { TeamShareContactComponent } from '@pages/team-share-contact/team-share-contact.component';
import { TemplateBrowserComponent } from '@components/template-browser/template-browser.component';
import { AutomationBrowserComponent } from '@components/automation-browser/automation-browser.component';
import { TeamMemberProfileComponent } from '@components/team-member-profile/team-member-profile.component';
import { ConfirmLeaveTeamComponent } from '@components/confirm-leave-team/confirm-leave-team.component';
import { searchReg } from '@app/helper';
import { MaterialsTeamList } from '@pages/materials-team/materials-team.component';
import { MaterialListService } from '@services/material-list.service';
import { TemplateListService } from '@services/template-list.service';
import { AutomationListService } from '@services/automation-list.service';
import { AutomationsTeamList } from '@pages/automations-team/automations-team.component';
import { TemplatesTeamList } from '@pages/templates-team/templates-team.component';
import { JSONParser } from '@utils/functions';
import { PipelineBrowserComponent } from '@app/components/pipeline-browser/pipeline-browser.component';
import { PipelineListService } from '@app/services/pipeline-list.service';
import { PipelinesTeamList } from '@pages/pipelines-team/pipelines-team.component';
import { TeamContactMoveComponent } from '@app/components/team-contact-move/team-contact-move.component';
import { MaterialBrowserV2Component } from '@app/components/material-browser-v2/material-browser-v2.component';
import { USER_FEATURES } from '@app/constants/feature.constants';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly USER_FEATURES = USER_FEATURES;

  loading = false;
  team;
  teamInited = false;
  teamId = '';
  userId = '';
  currentUser;
  loadSubscription: Subscription;
  updating = false;
  updateSubscription: Subscription;
  role = 'member'; // owner | editor | member
  siteUrl = environment.website;
  createubscription: Subscription;
  creating = false;
  accepting = false;
  acceptJoinRequest = false;
  declineJoinRequest = false;
  acceptUserId = '';
  declineUserId = '';
  acceptSubscription: Subscription;
  selectedMembers = new SelectionModel(true, []);
  selectedJoinRequest = new SelectionModel(true, []);
  shareUrl = 'https://www.crmgrow.com/';
  tabs: TabItem[] = [
    { icon: '', label: 'Members', id: 'members' },
    { icon: '', label: 'Materials', id: 'materials' },
    { icon: '', label: 'Contacts', id: 'contacts' },
    { icon: '', label: 'Automations', id: 'automations' },
    { icon: '', label: 'Templates', id: 'templates' },
    { icon: '', label: 'Pipelines', id: 'pipelines' }
  ];
  selectedTab: TabItem = this.tabs[0];

  myContacts = [];
  otherContacts = [];
  materials: any[] = [];
  viewers = [];
  editors = [];
  memberRole = [];

  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;
  leaveTeamSubscription: Subscription;
  removeTeamMemberSubscription: Subscription;
  changeMemberRoleSubscription: Subscription;
  isPackageAutomation = true;

  inviteSubscription: Subscription;
  resending = false;
  resendEmail = '';

  filteredMembers = [];
  MEMEBR_COLUMNS = ['member', 'role', 'action'];
  searchStr = '';
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  page = 1;
  pageSize = this.PAGE_COUNTS[0];
  isInternal = false;
  isNewUser = true;

  @ViewChild(MaterialsTeamList)
  shareMaterialComponent: MaterialsTeamList;
  @ViewChild(TeamShareContactComponent)
  shareContactComponent: TeamShareContactComponent;
  @ViewChild(AutomationsTeamList)
  shareAutomationComponent: AutomationsTeamList;
  @ViewChild(TemplatesTeamList)
  shareTemplateComponent: TemplatesTeamList;
  @ViewChild(PipelinesTeamList)
  sharePipelineComponent: PipelinesTeamList;

  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private materialListService: MaterialListService,
    private templateListService: TemplateListService,
    private automationListService: AutomationListService,
    private pipelineListService: PipelineListService
  ) {
    // Tab Routing Handler
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (this.teamInited) {
        this.initTab(params);
      }
    });

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res._id) {
        this.currentUser = res;
        if (environment.isSspa) {
          this.isNewUser = true;
        } else if (this.currentUser?.user_version < 2.3) {
          this.isNewUser = false;
        }

        this.userId = res._id;
        this.isPackageAutomation = res.automation_info?.is_enabled;
        if (!this.isPackageAutomation) {
          this.tabs.some((item, index) => {
            if (item.id === 'automations') {
              this.tabs.splice(index, 1);
              return true;
            }
          });
        } else {
          const includesAutomationTab = this.tabs.findIndex(
            (e) => e.id === 'automations'
          );
          if (includesAutomationTab === -1) {
            this.tabs.push({
              icon: '',
              label: 'Automations',
              id: 'automations'
            });
          }
        }
        // this.arrangeTeamData();
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {}

  initTab(params: Record<string, string>, isFirst = false): void {
    let selectedTab = params['tab'] || 'members';
    if (this.role !== 'owner' && !this.team?.team_setting?.viewMembers) {
      if (params['tab'] !== 'members') {
        selectedTab = params['tab'] || 'materials';
      } else {
        selectedTab = 'materials';
      }
    }
    if (isFirst && selectedTab !== this.route.snapshot?.params?.['tab']) {
      this.router.navigateByUrl(
        `/community/${this.teamId}/${selectedTab}/root`
      );
      return;
    }
    const index = this.tabs.findIndex((item) => item.id === selectedTab);
    if (index >= 0) {
      this.selectedTab = this.tabs[index];
    }
  }

  load(): void {
    const pageSize = localStorage.getCrmItem('teamMemerbListPageSize');
    if (pageSize) this.pageSize = JSONParser(pageSize);
    else
      localStorage.setCrmItem(
        'teamMemerbListPageSize',
        JSON.stringify(this.pageSize)
      );

    this.teamId = this.route.snapshot.params['id'];
    if (this.teamId) {
      this.loadTeam();
    }
    if (!this.teamId) {
      const teamId = this.route.snapshot.queryParams['team'];
      const userId = this.route.snapshot.queryParams['user'];
      if (teamId && userId) {
        this.teamId = teamId;
        this.acceptOutRequest(teamId, userId);
      } else {
        this.router.navigate(['/community']);
      }
    }
  }

  goToBack(): void {
    this.router.navigate(['/community']);
  }

  acceptInvitation(): void {
    this.accepting = true;
    this.acceptSubscription && this.acceptSubscription.unsubscribe();
    this.acceptSubscription = this.teamService
      .acceptInvitation(this.teamId)
      .subscribe(
        () => {
          this.accepting = false;
          this.location.replaceState(
            '/community/' + this.teamId + '/members/root'
          );
          this.loadTeam();
        },
        (err) => {
          this.accepting = false;
          if (err.status === 400) {
            // TODO: Invalid Permission Dialog Display
          } else {
            this.router.navigate(['/community']);
          }
        }
      );
  }

  loadTeam(): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.teamService.read(this.teamId).subscribe(
      (res) => {
        this.loading = false;
        this.team = {
          ...res,
          owner: res['owner'],
          highlights: res['highlights'] || [],
          brands: res['brands'] || []
        };

        if (this.team.members) {
          for (const member of this.team.members) {
            if (this.team.editors.indexOf(member._id) >= 0) {
              this.editors.push(member);
              this.memberRole[member._id] = 'Editor';
            } else {
              this.viewers.push(member);
              this.memberRole[member._id] = 'Viewer';
            }
          }
        }
        this.arrangeTeamData();
        this.filter();
      },
      () => {
        this.loading = false;
      }
    );
  }

  arrangeTeamData(): void {
    //Redirect to community for invited user
    if (
      this.team &&
      this.team.owner &&
      this.team.members &&
      _.findIndex(this.team.owner, { _id: this.userId }) === -1 &&
      _.findIndex(this.team.members, { _id: this.userId }) === -1
    ) {
      this.router.navigate(['/community']);
    } else {
      if (this.team && this.team.owner) {
        const ownerIndex = _.findIndex(this.team.owner, { _id: this.userId });
        if (ownerIndex !== -1) {
          this.role = 'owner';
        } else if (
          this.team.editors &&
          this.team.editors.indexOf(this.userId) !== -1
        ) {
          this.role = 'editor';
          if (this.team && !this.team.team_setting.viewMembers) {
            const index = this.tabs.findIndex((item) => item.id === 'members');
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
        } else {
          this.role = 'viewer';
          if (this.team && !this.team.team_setting.viewMembers) {
            const index = this.tabs.findIndex((item) => item.id === 'members');
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
        }
      } else {
        if (
          this.team &&
          this.team.editors &&
          this.team.editors.indexOf(this.userId) !== -1
        ) {
          this.role = 'editor';
          if (this.team && !this.team.team_setting.viewMembers) {
            const index = this.tabs.findIndex((item) => item.id === 'members');
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
        } else {
          this.role = 'viewer';
          if (this.team && !this.team.team_setting.viewMembers) {
            const index = this.tabs.findIndex((item) => item.id === 'members');
            if (index >= 0) {
              this.tabs.splice(index, 1);
            }
          }
        }
      }
    }
    this.teamInited = true;
    this.initTab({}, true);
  }

  filter(): void {
    const filteredMembers = [];

    //Onwers
    if (this.team && this.team.owner) {
      this.team.owner.forEach((element) => {
        element.role = 'owner';
        filteredMembers.push(element);
      });
    }

    //Editors
    if (this.editors) {
      this.editors.forEach((element) => {
        element.role = 'editor';
        filteredMembers.push(element);
      });
    }

    //Viewers
    if (this.viewers) {
      this.viewers.forEach((element) => {
        element.role = 'viewer';
        filteredMembers.push(element);
      });
    }

    //Invites
    if (this.team && this.team.invites) {
      this.team.invites.forEach((element) => {
        element.role = 'invite';
        filteredMembers.push(element);
      });
    }

    //Referrals
    if (this.team && this.team.referrals) {
      this.team.referrals.forEach((element) => {
        const referral = {
          role: 'referral',
          email: element,
          user_name: element
        };
        filteredMembers.push(referral);
      });
    }

    this.filteredMembers = filteredMembers.filter((member) => {
      if (this.searchStr && !searchReg(member.user_name, this.searchStr)) {
        return false;
      }
      return true;
    });
    this.page = 1;
  }

  changeSearchStr(): void {
    if (this.searchStr) {
      this.filteredMembers = this.filteredMembers.filter((member) => {
        if (this.searchStr && !searchReg(member.user_name, this.searchStr)) {
          return false;
        }
        return true;
      });
    } else {
      this.filter();
    }
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }

  shareMaterial(): void {
    const hideMaterials = [
      ...this.team.videos,
      ...this.team.images,
      ...this.team.pdfs,
      ...this.team.folders
    ];
    this.dialog
      .open(MaterialBrowserV2Component, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          title: 'Share Material',
          buttonLabel: 'Share',
          multiple: true,
          onlyMine: true,
          hideMaterials,
          resultMatType: 'with-folder'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res?.materials.length) {
          const ids = res.materials.map((e) => {
            return { _id: e._id, type: e.item_type };
          });
          this.shareImpl('material', ids);
        }
      });
  }

  shareAutomation(): void {
    const hideAutomations = [...this.team.automations, ...this.team.folders];
    this.dialog
      .open(AutomationBrowserComponent, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          hideAutomations
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res?.automations.length) {
          const ids = res.automations.map((e) => {
            return { _id: e._id, type: e.item_type };
          });
          this.automationListService
            .checkShare({ automations: ids })
            .subscribe((_res) => {
              if (_res?.status) {
                const count =
                  (_res.data?.videos || []).length +
                  (_res.data?.pdfs || []).length +
                  (_res.data?.images || []).length +
                  (_res.data?.titles || []).length;
                if (count == 0) {
                  this.shareImpl('automation', ids);
                } else {
                  const dialog = this.dialog.open(ConfirmComponent, {
                    maxWidth: '400px',
                    width: '96vw',
                    position: { top: '100px' },
                    data: {
                      title: 'Share Automations',
                      message: 'Are you sure to share these ones?',
                      titles: _res['data'].titles || [],
                      videos: _res['data'].videos || [],
                      images: _res['data'].images || [],
                      pdfs: _res['data'].pdfs || [],
                      confirmLabel: 'Yes',
                      cancelLabel: 'No'
                    }
                  });
                  dialog.afterClosed().subscribe((status) => {
                    if (status) {
                      this.shareImpl('automation', ids);
                    }
                  });
                }
              }
            });
        }
      });
  }

  sharePipeline(): void {
    const hidePipelines = [...this.team.pipelines];
    this.dialog
      .open(PipelineBrowserComponent, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          hidePipelines
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res?.pipelines.length) {
          const ids = res.pipelines.map((e) => {
            return { _id: e._id, type: e.item_type };
          });
          this.shareImpl('pipeline', ids);
        }
      });
  }

  shareContact(): void {
    this.dialog
      .open(TeamContactShareComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          team: this.team
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (this.shareContactComponent) {
            this.shareContactComponent.load();
            this.shareContactComponent.loadContact(1);
          }
        }
      });
  }

  routingContact(): void {
    this.dialog
      .open(TeamContactMoveComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          team: this.team,
          step: 1,
          optionId: 1
        }
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  shareEmailTemplate(): void {
    const hideTemplates = [...this.team.email_templates, ...this.team.folders];
    this.dialog
      .open(TemplateBrowserComponent, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          hideTemplates
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res?.templates.length) {
          const ids = res.templates.map((e) => {
            return { _id: e._id, type: e.item_type };
          });
          this.templateListService
            .checkShare({ templates: ids })
            .subscribe((_res) => {
              if (_res) {
                if (
                  _res['status'] &&
                  !_res['data']?.videos.length &&
                  !_res['data']?.pdfs.length &&
                  !_res['data']?.images.length
                ) {
                  this.shareImpl('template', ids);
                } else {
                  const dialog = this.dialog.open(ConfirmComponent, {
                    maxWidth: '400px',
                    width: '96vw',
                    position: { top: '100px' },
                    data: {
                      title: 'Share Templates',
                      message: 'Are you sure to share these ones?',
                      videos: _res['data'].videos || [],
                      images: _res['data'].images || [],
                      pdfs: _res['data'].pdfs || [],
                      confirmLabel: 'Yes',
                      cancelLabel: 'No'
                    }
                  });
                  dialog.afterClosed().subscribe((status) => {
                    if (status) {
                      this.shareImpl('template', ids);
                    }
                  });
                }
              }
            });
        }
      });
  }

  shareImpl(type: string, data: any): void {
    if (type === 'material') {
      this.materialListService
        .share({
          team_ids: [this.teamId],
          materials: data
        })
        .subscribe(() => {
          this.shareMaterialComponent.load();
        });
    } else if (type === 'automation') {
      this.automationListService
        .share({
          team_ids: [this.teamId],
          automations: data
        })
        .subscribe(() => {
          this.shareAutomationComponent.load();
        });
    } else if (type === 'template') {
      this.templateListService
        .share({
          team_ids: [this.teamId],
          templates: data
        })
        .subscribe(() => {
          this.shareTemplateComponent.load();
        });
    } else if (type === 'pipeline') {
      this.pipelineListService
        .share({
          team_ids: [this.teamId],
          pipelines: data
        })
        .subscribe(() => {
          this.sharePipelineComponent.load();
        });
    }
  }

  cancelInvite(member): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          title: 'Cancel Invitation',
          message: 'Are you sure to cancel this invitation?',
          cancelLabel: 'No',
          confirmLabel: 'Ok'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.updating = true;
          const emails = [member.email];
          this.teamService.cancelInvite(this.teamId, emails).subscribe(
            (response) => {
              this.updating = false;
              if (member._id) {
                this.team.invites.some((e, index) => {
                  if (e.email === member.email) {
                    this.team.invites.splice(index, 1);
                    return true;
                  }
                });
              } else {
                this.team.referrals.some((e, index) => {
                  if (e === member.email) {
                    this.team.referrals.splice(index, 1);
                    return true;
                  }
                });
              }
              this.filter();
              // this.toast.success('You cancelled the invitation successfully.');
            },
            (err) => {
              this.updating = false;
            }
          );
        }
      });
  }

  toggleMember(member: { _id: any }): void {
    if (this.team.editors.indexOf(member._id) !== -1) {
      this.changeMemberRoleSubscription &&
        this.changeMemberRoleSubscription.unsubscribe();
      this.changeMemberRoleSubscription = this.teamService
        .ableLeaveTeam(this.teamId, member._id)
        .subscribe((res) => {
          if (res.failed?.length > 0) {
            this.dialog
              .open(ConfirmLeaveTeamComponent, {
                position: { top: '100px' },
                width: '657px',
                maxWidth: '657px',
                disableClose: true,
                data: {
                  title: 'leave_community',
                  additional: res.failed,
                  option: true,
                  subject:
                    'Do you want to remove all activities below and Change the Role?',
                  message:
                    'This member has following activities in the team. You can click expand to see detail.'
                }
              })
              .afterClosed()
              .subscribe((res) => {
                if (res == 1) {
                  this.teamService
                    .removeTeamMemberItems(this.teamId, member._id)
                    .subscribe(() => {
                      this.doChangeRole(member);
                    });
                }
              });
          } else {
            this.doChangeRole(member);
          }
        });
    } else {
      this.doChangeRole(member);
    }
  }
  removeMember(member: { _id: any }): void {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Remove Member',
          message: 'Are you sure you want to remove this member?',
          cancelLabel: 'No',
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.removeTeamMemberSubscription &&
            this.removeTeamMemberSubscription.unsubscribe();
          this.removeTeamMemberSubscription = this.teamService
            .ableLeaveTeam(this.teamId, member._id)
            .subscribe((res) => {
              if (res.failed?.length > 0) {
                this.dialog
                  .open(ConfirmLeaveTeamComponent, {
                    position: { top: '100px' },
                    width: '657px',
                    maxWidth: '657px',
                    disableClose: true,
                    data: {
                      title: 'leave_community',
                      additional: res.failed,
                      option: true,
                      subject:
                        'Do you want to remove all activities below as well?',
                      message:
                        'This member has following activities in the team. You can click expand to see detail.'
                    }
                  })
                  .afterClosed()
                  .subscribe((res) => {
                    if (res == 1) {
                      this.teamService
                        .removeTeamMemberItems(this.teamId, member._id)
                        .subscribe((res) => {
                          this.doLeaveTeam(member);
                        });
                    }
                  });
              } else {
                this.teamService
                  .removeTeamMemberItems(this.teamId, member._id)
                  .subscribe((res) => {
                    this.doLeaveTeam(member);
                  });
              }
              this.filter();
            });
        }
      });
  }

  acceptRequest(user): void {
    this.acceptJoinRequest = true;
    this.acceptUserId = user._id;
    this.teamService.acceptRequest(this.teamId, user._id).subscribe(
      (res) => {
        this.acceptJoinRequest = false;
        this.acceptUserId = '';
        this.team.members.push(user);
        this.viewers.push(user);
        this.team.requests.some((e, index) => {
          if (e._id === user._id) {
            this.team.requests.splice(index, 1);
            return true;
          }
        });
        this.filter();
      },
      (err) => {
        this.acceptJoinRequest = false;
      }
    );
  }

  declineRequest(user): void {
    this.declineJoinRequest = true;
    this.declineUserId = user._id;
    this.teamService.declineRequest(this.teamId, user._id).subscribe(
      (res) => {
        this.declineJoinRequest = false;
        this.declineUserId = '';
        this.team.requests.some((e, index) => {
          if (e._id === user._id) {
            this.team.requests.splice(index, 1);
            return true;
          }
        });
      },
      (err) => {
        this.declineJoinRequest = false;
      }
    );
  }

  acceptOutRequest(teamId, memberId): void {
    this.accepting = true;
    this.teamService.acceptRequest(teamId, memberId).subscribe(
      (res) => {
        this.accepting = false;
        this.router.navigate(['/community/' + this.teamId + '/members/root']);
        this.loadTeam();
      },
      (err) => {
        this.accepting = false;
        if (err.status === 400) {
          this.dialog
            .open(NotifyComponent, {
              width: '96vw',
              maxWidth: '400px',
              data: {
                message: 'Invalid permission for this team.'
              },
              disableClose: true
            })
            .afterClosed()
            .subscribe((res) => {
              this.router.navigate(['/community']);
            });
        } else {
          this.router.navigate(['/community']);
        }
      }
    );
  }

  status(): any {
    if (this.role) {
      return this.role[0].toUpperCase() + this.role.slice(1);
    }
    return this.role;
  }

  changeTab(tab: TabItem, folder = 'root'): void {
    this.router.navigateByUrl(
      `/community/${this.team._id}/${tab.id}/${folder}`
    );
  }

  avatarName(user_name): string {
    if (user_name) {
      const names = user_name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      } else {
        return names[0][0];
      }
    }
    return 'UN';
  }
  memberStatus(member): any {
    if (this.team.editors.indexOf(member._id) === -1) {
      return 'Viewer';
    } else {
      return 'Editor';
    }
  }

  editTeam(): void {
    this.dialog
      .open(TeamEditComponent, {
        width: '96vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          team: this.team
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.team = {
            ...this.team,
            name: res.name,
            picture: res.picture
          };
          this.filter();
        }
      });
  }

  /**
   * Open Invite member modal and do action
   */
  inviteMember(): void {
    this.dialog
      .open(InviteTeamComponent, {
        ...DialogSettings.INVITE_TEAM,
        data: { ...this.team }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.invitations) {
            for (const invitation of res.invitations) {
              this.team.invites.push(invitation);
            }
          }
          if (res.referrals) {
            for (const referral of res.referrals) {
              this.team.referrals.push(referral);
            }
          }
          this.filter();
        }
      });
  }

  showProfile(member): void {
    this.dialog.open(TeamMemberProfileComponent, {
      data: {
        title: 'Team member',
        member
      }
    });
  }

  getMemberCount(): any {
    let count = 0;
    if (this.team.owner && this.team.owner.length > 0) {
      count += this.team.owner.length;
    }
    if (this.team.members && this.team.members.length > 0) {
      count += this.team.members.length;
    }
    return count;
  }

  /**
   * resend the invitation to the User or Referrals
   * @param event: User
   */
  resendInvitation(member): void {
    if (member) {
      const emails = [member.email];
      this.resendEmail = member.email;
      this.resending = true;
      this.inviteSubscription = this.teamService
        .inviteUsers(this.teamId, emails)
        .subscribe(
          (res) => {
            this.resending = false;
            // this.dialogRef.close();
          },
          () => {
            this.resending = false;
          }
        );
    }
  }
  resendReferralInvitation(referral_email): void {
    if (referral_email) {
      const emails = [referral_email];
      this.resendEmail = referral_email;
      this.resending = true;
      this.inviteSubscription = this.teamService
        .inviteUsers(this.teamId, emails)
        .subscribe(
          (res) => {
            this.resending = false;
            // this.dialogRef.close();
          },
          () => {
            this.resending = false;
          }
        );
    }
  }

  leaveTeam(member: { _id: any }): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          title: 'leave_community',
          message: 'Are you sure you want to leave this team?',
          cancelLabel: 'No',
          confirmLabel: 'Leave'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (member._id == this.userId) {
            const message =
              "You can't leave following team because you have been shared such a items in this team. Click expand to see detail reason.";
            this.leaveTeamSubscription &&
              this.leaveTeamSubscription.unsubscribe();
            this.leaveTeamSubscription = this.teamService
              .ableLeaveTeam(this.teamId, member._id)
              .subscribe((res) => {
                if (res.failed?.length > 0) {
                  this.dialog.open(ConfirmLeaveTeamComponent, {
                    position: { top: '100px' },
                    width: '657px',
                    maxWidth: '657px',
                    disableClose: true,
                    data: {
                      title: 'leave_community',
                      additional: res.failed,
                      option: false,
                      message: message
                    }
                  });
                } else {
                  this.doLeaveTeam(member);
                }
              });
          } else {
            this.doLeaveTeam(member);
          }
          this.filter();
        }
      });
  }

  doLeaveTeam(member: { _id: any }): void {
    const editors = [...this.team.editors];
    const pos = editors.indexOf(member._id);
    if (pos !== -1) {
      editors.splice(pos, 1);
      this.team.editors.splice(pos, 1);
    }
    const newMembers = [];
    this.team.members.forEach((e) => {
      if (e._id !== member._id) {
        newMembers.push(e._id);
      }
    });
    const editorIndex = this.editors.findIndex(
      (item) => item._id === member._id
    );
    if (editorIndex >= 0) {
      this.editors.splice(editorIndex, 1);
    }
    const viewerIndex = this.viewers.findIndex(
      (item) => item._id === member._id
    );
    if (viewerIndex >= 0) {
      this.viewers.splice(viewerIndex, 1);
    }
    this.teamService
      .updateTeam(this.teamId, { members: newMembers, editors })
      .subscribe(
        (response) => {
          this.team.members.some((e, index) => {
            if (e._id === member._id) {
              this.team.members.splice(index, 1);
            }
          });
          // go back
          this.goToBack();
          // this.toast.success('You leaved this team successfully.');
          this.filter();
        },
        (err) => {}
      );
  }

  doChangeRole(member: { _id: any }): void {
    const editors = [...this.team.editors];
    const pos = editors.indexOf(member._id);
    if (pos !== -1) {
      editors.splice(pos, 1);
    } else {
      editors.push(member._id);
    }
    this.updating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.teamService
      .update(this.teamId, { editors })
      .subscribe(
        (res) => {
          this.updating = false;
          this.team.editors = editors;
          this.filter();
        },
        (err) => {
          this.updating = false;
          this.team.editors = editors;
        }
      );
  }

  changePage(page: number): void {
    this.page = page;
  }

  changePageSize(type: any): void {
    if (this.pageSize.id === type.id) return;
    this.pageSize = type;
    localStorage.setCrmItem(
      'teamMemerbListPageSize',
      JSON.stringify(this.pageSize)
    );
  }
}
