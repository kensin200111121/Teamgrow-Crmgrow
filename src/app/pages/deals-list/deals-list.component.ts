import {
  Component,
  OnInit,
  Input,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import {
  CdkDragDrop,
  CdkDragStart,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { DealsService } from '@services/deals.service';
import { StoreService } from '@services/store.service';
import { Deal, TeamUser } from '@models/deal.model';
import { STATUS } from '@constants/variable.constants';
@Component({
  selector: 'app-deals-list',
  templateUrl: './deals-list.component.html',
  styleUrls: ['./deals-list.component.scss']
})
export class DealsListComponent implements OnInit {
  private _keyword = '';
  private teamUsers: TeamUser[];
  private _inited = false;
  private _scrolled = false;
  private positionInfo: any;
  private initialIndex: number = -1;
  private initialContainer: any = null;

  selectedFilterTeamUser: TeamUser[] = [
    { user_name: 'Everyone', picture_profile: null, _id: null }
  ];
  selectedDealId = '';

  @ViewChild('wrapper') wrapper: ElementRef;
  @Input() dealStage = null;
  @Input() pageCount = 50;
  @Input()
  set searchStr(val: string) {
    if (this._keyword !== val && this._inited) {
      this._keyword = val || '';
      this.onLoadMore(true);
    }
  }
  @Input()
  set filterTeamUser(val: TeamUser[]) {
    if (Array.isArray(val)) {
      if (this.teamUsers !== val) {
        this.teamUsers = val;
        this.onLoadMore(true);
      }
    } else {
      this.teamUsers = [];
    }
  }
  @Input() isPossibleToClick = false;
  @Input() hasAutomationSetting = true;
  @Input() noAutomationSetting = true;

  STATUS = STATUS;

  constructor(
    public dealsService: DealsService,
    private storeService: StoreService,
    protected router: Router
  ) {}
  ngOnInit(): void {
    this._inited = true;
    this._scrolled = false;
    this.onLoadMore(true);
  }

  onLoadMore(isRefresh = false) {
    const data = {
      pipe_line: this.dealStage.pipe_line,
      stage: this.dealStage._id,
      skip: isRefresh ? 0 : this.dealStage.deals.length,
      count: this.pageCount,
      searchStr: this._keyword,
      filterTeamUsers: this.teamUsers
    };
    this.dealsService.easyLoadMore(data, isRefresh);
    this.dealsService.pageStages.subscribe((res) => {
      const posItem = this.storeService.pipelineLoadMoreStatus.getValue();
      if (posItem) {
        const myItem = posItem.find(
          (_pos) => _pos.dealStage == this.dealStage._id
        );
        if (myItem) {
          this.positionInfo = myItem;
        }
      }
      const interval = setInterval(() => {
        if (this.wrapper) {
          clearInterval(interval);
          if (this.positionInfo)
            this.wrapper.nativeElement.scrollTop = parseInt(
              this.positionInfo.pos
            );
        }
      }, 200);
      this._scrolled = true;
    });
  }

  oncdkDropListScroll(event: any): void {
    if (
      event.target.offsetHeight + event.target.scrollTop >=
      event.target.scrollHeight
    ) {
      if (this.dealStage.deals_count > this.dealStage.deals.length) {
        this.onLoadMore();
      }
    }
  }

  getAvatarName(contact: any): string {
    if (contact) {
      if (contact.first_name && contact.last_name) {
        return contact.first_name[0] + contact.last_name[0];
      } else if (contact.first_name) {
        return contact.first_name.substring(0, 2);
      } else if (contact.last_name) {
        return contact.last_name.substring(0, 2);
      } else {
        return 'UN';
      }
    }
  }

  getBackgroundStatusColor(deal: Deal, duration: number): any {
    if (duration === undefined || duration === 0 || !deal.put_at) {
      return '#BFF2DF';
    }
    const put_at = new Date(deal.put_at);
    const now = new Date();
    const diff = Math.abs(now.getTime() - put_at.getTime());
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    const rate = diffDays / duration;
    if (rate >= 1) {
      return '#F4CFC7';
    }
    return '#BFF2DF';
  }

  getForgroundStatusColor(deal: Deal, duration: number): any {
    if (duration === undefined || duration === 0 || !deal.put_at) {
      return '#000';
    }
    const put_at = new Date(deal.put_at);
    const now = new Date();
    const diff = Math.abs(now.getTime() - put_at.getTime());
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    const rate = diffDays / duration;
    if (rate >= 1) {
      return '#DE5038';
    }
    return '#116947';
  }

  getDurationDate(deal: Deal, duration: number): any {
    const put_at = new Date(deal.put_at);
    const last_date = new Date(put_at.getTime() + duration * 3600 * 24 * 1000);
    const start_date =
      (put_at.getMonth() + 1).toString() +
      '/' +
      put_at.getDate().toString() +
      '/' +
      put_at.getFullYear().toString();
    const end_date =
      (last_date.getMonth() + 1).toString() +
      '/' +
      last_date.getDate().toString() +
      '/' +
      last_date.getFullYear().toString();
    const data = start_date + '~' + end_date;
    return data;
  }

  getLeftDays(deal: Deal, duration: number): any {
    const put_at = new Date(deal.put_at);
    put_at.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.abs(today.getTime() - put_at.getTime());
    const diffDays = Math.round(diff / (1000 * 3600 * 24));
    const diffDuration = duration - diffDays;
    if (diffDuration > 1) return diffDuration + 'days left';
    if (diffDuration >= 0) return 1 + 'day left';
    if (diffDuration < 0) return 'expired';
  }

  onDragStarted(event: CdkDragStart): void {
    this.initialIndex = event.source.dropContainer.getSortedItems().indexOf(event.source);
    this.initialContainer = event.source.dropContainer;
  }

  drop(event: CdkDragDrop<string[]>, id: string): void {
    // If the drop happened outside of any container, restore deal to original position
    if (!event.isPointerOverContainer) {
      if (this.initialContainer && this.initialContainer._dropListRef) {
          this.initialContainer._dropListRef.enter(
              event.item._dragRef,
              this.initialIndex,
              0,
              0
          );
      }

      this.initialIndex = -1;
      this.initialContainer = null;
      return;
    }

    const data = {
      deal_id: event.previousContainer.data[event.previousIndex]['_id'] + '',
      position: event.currentIndex,
      deal_stage_id: id + ''
    };
    const deal = event.previousContainer.data[event.previousIndex];
    const stages = this.dealsService.pageStages.getValue();

    const sourceIndex = stages.findIndex(
      (item) => item._id == deal['deal_stage']
    );
    const targetIndex = stages.findIndex((item) => item._id == id);
    if (sourceIndex >= 0 && targetIndex >= 0) {
      const sourceStage = stages[sourceIndex];
      const targetStage = stages[targetIndex];
      const sourceDealIndex = sourceStage.deals.findIndex(
        (item) => item._id == data.deal_id
      );
      if (sourceDealIndex >= 0) {
        const sourceDeal = sourceStage.deals[sourceDealIndex];
        if (sourceDeal && sourceDeal.put_at) {
          sourceDeal.put_at = new Date();
        }
        let running_automation = false;
        if (targetStage.automation) {
          running_automation = !this.hasAutomationSetting
            ? sourceDeal['running_automation']
              ? true
              : false
            : true;
        } else {
          running_automation = !this.noAutomationSetting
            ? sourceDeal['running_automation']
              ? true
              : false
            : false;
        }
        const tempDeal = {
          ...sourceDeal,
          running_automation
        };
        sourceStage.deals.splice(
          sourceDealIndex,
          1,
          new Deal().deserialize(tempDeal)
        );
        if (event.previousContainer === event.container) {
          moveItemInArray(
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
        } else {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
        }
        if (deal['deal_stage'] !== id) {
          if (sourceStage) {
            sourceStage.deals_count--;
            if (deal['price']) {
              sourceStage.price -= Number(deal['price']);
            }
          }
          if (targetStage) {
            targetStage.deals_count++;
            if (deal['price']) {
              targetStage.price += Number(deal['price']);
            }
          }
          sourceDeal['deal_stage'] = id;
          tempDeal['deal_stage'] = id;
          const targetDealIndex = targetStage.deals.findIndex(
            (item) => item._id === sourceDeal._id
          );
          if (targetDealIndex >= 0) {
            targetStage.deals.splice(
              targetDealIndex,
              1,
              new Deal().deserialize(tempDeal)
            );
          }
        }
        this.dealsService.pageStages.next(stages);
        this.dealsService.moveDeal(data).subscribe(() => {});
      }
    }
  }

  dealDetail(id: string): void {
    this.router.navigate([`/pipeline`], { queryParams: { deals: id } });
  }
}
