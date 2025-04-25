import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AGENT_COMPANIES,
  AGENT_FRAMES,
  AGENT_TYPE,
  US_STATE_CODE,
  orderOriginal
} from '@app/constants/variable.constants';
import { AgentFilter } from '@app/models/agent-filter.model';
import { User } from '@app/models/user.model';
import { UserService } from '@app/services/user.service';

@Component({
  selector: 'app-agent-filter-add',
  templateUrl: './agent-filter-add.component.html',
  styleUrls: ['./agent-filter-add.component.scss']
})
export class AgentFilterAddComponent implements OnInit {
  readonly DefaultCountryStates = US_STATE_CODE;
  readonly orderOriginal = orderOriginal;
  readonly frames = AGENT_FRAMES;
  readonly companies = AGENT_COMPANIES;
  readonly agentTypes = AGENT_TYPE;

  type = 'create';
  submitted = false;
  saving = false;
  availableNumbers = [];
  agentFilter = new AgentFilter();
  user = new User();
  selectedTimeFrame = 6;

  constructor(
    private dialogRef: MatDialogRef<AgentFilterAddComponent>,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.type = this.data.type;
      if (this.type == 'edit') {
        this.agentFilter = new AgentFilter().deserialize(this.data.filter);
      } else {
        this.agentFilter.time_frame = 6;
        this.agentFilter.listing_type = 0;
      }
      this.availableNumbers = this.data.availableNumbers;
    }
    this.userService.profile$.subscribe((res) => {
      if (res) {
        this.user = new User().deserialize(res);
      }
    });
  }

  ngOnInit(): void {}

  save(): void {
    if (!this.agentFilter.exclude_brokerage) {
      return;
    }
    this.saving = true;
    this.agentFilter.count = parseInt(this.agentFilter.count.toString());
    this.dialogRef.close(this.agentFilter);
  }

  close(): void {
    this.dialogRef.close();
  }
}
