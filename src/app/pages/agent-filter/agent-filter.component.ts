import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AgentFilterAddComponent } from '@components/agent-filter-add/agent-filter-add.component';
import { PACKAGE_LEVEL, STATUS } from '@app/constants/variable.constants';
import { AgentFilter } from '@app/models/agent-filter.model';
import { AgentFilterService } from '@app/services/agent-filter.service';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { User } from '@app/models/user.model';
import { UserService } from '@app/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-agent-filter',
  templateUrl: './agent-filter.component.html',
  styleUrls: ['./agent-filter.component.scss']
})
export class AgentFilterComponent implements OnInit {
  STATUS = STATUS;

  agentFilters = [];
  availableNumbers = 0;
  user = new User();

  constructor(
    private dialog: MatDialog,
    public agentFilterService: AgentFilterService,
    private userService: UserService,
    private toastService: ToastrService
  ) {
    this.agentFilterService.load();
    this.userService.profile$.subscribe((res) => {
      if (res) {
        this.user = new User().deserialize(res);
      }
    });
  }

  ngOnInit(): void {
    this.agentFilterService.filters$.subscribe((res) => {
      this.agentFilters = res;
    });
  }

  create(): void {
    this.checkAvailableNumbers();
    if (
      !this.user?.agent_vending_info?.is_enabled ||
      this.availableNumbers < 1
    ) {
      this.toastService.error('agent_limit_error');
      return;
    }
    const numbers = [];
    for (let i = 1; i < this.availableNumbers + 1; i++) {
      numbers.push(i);
    }
    this.dialog
      .open(AgentFilterAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '450px',
        disableClose: true,
        data: {
          type: 'create',
          availableNumbers: numbers
        }
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.agentFilterService.create(data);
        }
      });
  }

  edit(filter: AgentFilter): void {
    this.checkAvailableNumbers();
    const numbers = [];
    for (let i = 1; i < this.availableNumbers + filter.count + 1; i++) {
      numbers.push(i);
    }
    this.dialog
      .open(AgentFilterAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '550px',
        disableClose: true,
        data: {
          type: 'edit',
          filter,
          availableNumbers: numbers
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.agentFilterService.update(res);
        }
      });
  }

  delete(id: string): void {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'delete_agent',
          message: 'delete_agent_description',
          cancelLabel: 'No',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.agentFilterService.delete(id);
        }
      });
  }

  checkAvailableNumbers(): void {
    let usedNumbers = 0;
    this.agentFilters.forEach((e) => {
      usedNumbers += e.count;
    });
    this.availableNumbers =
      this.user.agent_vending_info.max_count - usedNumbers;
  }
}
