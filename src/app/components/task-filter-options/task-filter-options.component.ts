import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subscription } from 'rxjs';
import { TaskSearchOption } from '@models/searchOption.model';
import { LabelService } from '@services/label.service';
import * as _ from 'lodash';
import { MatMenuTrigger } from '@angular/material/menu';
import { TaskService } from '@services/task.service';
import moment from 'moment-timezone';
import { ContactService } from '@services/contact.service';
import { TYPES } from '../task-type-filter/task-type-filter.component';

interface OptGroup {
  name: string;
  items: string[];
}

@Component({
  selector: 'app-task-filter-options',
  templateUrl: './task-filter-options.component.html',
  styleUrls: ['./task-filter-options.component.scss']
})
export class TaskFilterOptionsComponent implements OnInit, OnDestroy {
  @Output() changeFilter = new EventEmitter();
  labelCondition = [];
  labelDic = {};
  optionSettingSubscription: Subscription;
  _option: TaskSearchOption = null;
  _optGroups: OptGroup[] = [];
  statusOptions: string[] = ['TO DO', 'COMPLETED', 'ALL'];
  datetimeString = '';
  constructor(
    private taskService: TaskService,
    private labelService: LabelService,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.optionSettingSubscription = this.taskService.searchOption$.subscribe(
      (option) => {
        this._option = option;
        this.initOptGroups();
      }
    );
    this.initData();
  }

  ngOnDestroy(): void {
    this.optionSettingSubscription &&
      this.optionSettingSubscription.unsubscribe();
  }

  initData(): void {
    this.labelService.allLabels$.subscribe((labels) => {
      let allLabels = [];
      const adminLabels = [];
      const otherLabels = [];
      labels.forEach((e) => {
        if (e.role == 'admin') {
          adminLabels.push(e);
        } else {
          otherLabels.push(e);
        }
      });
      otherLabels.sort((a, b) => {
        if (a.mine) {
          return -1;
        }
        if (b.mine) {
          return 1;
        }
      });
      let groupizedLabels = {};
      if (otherLabels.length) {
        groupizedLabels = _.groupBy(otherLabels, (e) => e.name);
      }
      allLabels = [...adminLabels];
      for (const title in groupizedLabels) {
        const label = groupizedLabels[title][0];
        if (groupizedLabels[title].length > 1) {
          label['multiple'] = groupizedLabels[title].length;
        }
        if (!label.mine) {
          label['role'] = 'team';
        }
        allLabels.push(label);
      }
      this.labelDic = {};
      allLabels.forEach((e) => {
        this.labelDic[e._id] = e.name;
      });
    });
  }

  initOptGroups(): void {
    if (!this._option) {
      return;
    }

    let option = null;
    let index = -1;
    this._optGroups = [];

    //Global Search
    if (this._option['str']?.length > 0) {
      option = {
        name: 'Global search',
        items: [this._option.str]
      };
      index = _.findIndex(this._optGroups, { name: 'Global search' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Task Type
    if (this._option['types']?.length > 0) {
      option = {
        name: 'Task type',
        items: this._option.types
      };
      index = _.findIndex(this._optGroups, { name: 'Task type' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Status of task
    if (this._option['status'] !== 0) {
      option = {
        name: 'Status of task',
        items: [this._option.status]
      };
      index = _.findIndex(this._optGroups, { name: 'Status of task' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Label condition
    if (this._option['labels']?.length > 0) {
      option = {
        name: 'Label',
        items: this._option.labels
      };

      index = _.findIndex(this._optGroups, { name: 'Label' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Task description contacts
    if (this._option['contact']?.length > 0) {
      this.contactService.read(this._option.contact);
      this.contactService
        .getContactsByIds([this._option.contact])
        .subscribe((res) => {
          if (res && res.length) {
            const contact_name = res[0].first_name + ' ' + res[0].last_name;
            option = {
              name: 'Contact',
              items: [contact_name]
            };
            index = _.findIndex(this._optGroups, { name: 'Contact' });
            if (index === -1) {
              this._optGroups.push(option);
            } else {
              this._optGroups.splice(index, 1, option);
            }
          }
        });
    }

    //Datetime
    this.datetimeString = '';
    if (this._option['date_mode'] !== 0) {
      option = {
        name: 'Datetime',
        items: []
      };

      index = _.findIndex(this._optGroups, { name: 'Datetime' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }

      if (this._option.start_date) {
        const datetime = new Date(this._option.start_date);
        const startDatetime = moment(datetime).format('DD/MM/YYYY, hh:mm A');
        this.datetimeString = 'between ' + startDatetime;
      }

      if (this._option.end_date) {
        const datetime = new Date(this._option.end_date);
        const endDatetime = moment(datetime).format('DD/MM/YYYY, hh:mm A');
        if (this.datetimeString) {
          this.datetimeString = this.datetimeString + ' - ' + endDatetime;
        } else {
          this.datetimeString = 'between ' + endDatetime;
        }
      }
    }

    //Country
    if (this._option['countries']?.length > 0) {
      option = {
        name: 'Country',
        items: this._option.countries
      };
      index = _.findIndex(this._optGroups, { name: 'Country' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //State
    if (this._option['states']?.length > 0) {
      option = {
        name: 'State',
        items: this._option.states
      };
      index = _.findIndex(this._optGroups, { name: 'State' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Zipcode
    if (this._option['zipcode']?.length > 0) {
      option = {
        name: 'Zipcode',
        items: [this._option.zipcode]
      };
      index = _.findIndex(this._optGroups, { name: 'Zipcode' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Source
    if (this._option['sources']?.length > 0) {
      option = {
        name: 'Source',
        items: this._option.sources
      };

      index = _.findIndex(this._optGroups, { name: 'Source' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Company
    if (this._option['companies']?.length > 0) {
      option = {
        name: 'Company',
        items: this._option.companies
      };
      index = _.findIndex(this._optGroups, { name: 'Company' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Tag
    if (this._option['tags']?.length > 0) {
      option = {
        name: 'Tag',
        items: this._option.tags
      };
      index = _.findIndex(this._optGroups, { name: 'Tag' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }

    //Assignee
    if (this._option['assigneeCondition']?.length > 0) {
      option = {
        name: 'Assignee',
        items: this._option.assigneeCondition
      };
      index = _.findIndex(this._optGroups, { name: 'Assginee' });
      if (index === -1) {
        this._optGroups.push(option);
      } else {
        this._optGroups.splice(index, 1, option);
      }
    }
  }

  removeCondition(field: string, condition: any): void {
    if (field == 'filterCondition') {
      const filterName = condition.name;
      const index = _.findIndex(this._optGroups, { name: filterName });
      this._optGroups.splice(index, 1);
      switch (filterName) {
        case 'Global search':
          this._option.str = '';
          break;
        case 'Task type':
          this._option.types = [];
          break;
        case 'Status of task':
          this._option.status = 0;
          break;
        case 'Label':
          this._option.labels = [];
          break;
        case 'Contact':
          this._option.contact = '';
          break;
        case 'Datetime':
          this._option.date_mode = 0;
          this._option.start_date = '';
          this._option.end_date = '';
          break;
        case 'Country':
          this._option.countries = [];
          break;
        case 'State':
          this._option.states = [];
          break;
        case 'Zipcode':
          this._option.zipcode = '';
          break;
        case 'Source':
          this._option.sources = [];
          break;
        case 'Company':
          this._option.companies = [];
          break;
        case 'Tag':
          this._option.tags = [];
          break;
        case 'Assignee':
          this._option.assigneeCondition = [];
          break;
      }
      this.taskService.searchOption.next(
        new TaskSearchOption().deserialize({ ...this._option })
      );
    } else {
      this._option[field].some((e, index) => {
        if (e.id === condition.id) {
          this._option[field].splice(index, 1);
        }
      });
    }

    this.changeFilter.emit(this._option);
  }

  /**
   * Apply the filter
   * @param option: option name
   * @param $event: option value
   * @param trigger: menu trigger component
   */
  applyFilter($event, trigger: MatMenuTrigger): void {
    const currentOption = this.taskService.searchOption.getValue();
    this.taskService.searchOption.next(
      new TaskSearchOption().deserialize({
        ...currentOption,
        ...$event
      })
    );
    trigger.closeMenu();
  }

  getTaskLabel(taskid: string): string {
    const task = TYPES.find((o) => o.id === taskid);
    return task.label;
  }
}
