import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventType } from '@models/eventType.model';
import { Automation } from '@models/automation.model';
import { AutomationService } from '@services/automation.service';

@Component({
  selector: 'app-event-type-automation',
  templateUrl: './event-type-automation.component.html',
  styleUrls: ['./event-type-automation.component.scss']
})
export class EventTypeAutomationComponent implements OnInit {
  submitted = false;
  saving = false;
  isAutomation = false;
  eventType: EventType = new EventType();
  autoTriggers = [
    { value: '1', name: 'After event is booked' },
    { value: '2', name: 'Before event starts' },
    { value: '3', name: 'After event starts' },
    { value: '4', name: 'After event ends' }
  ];
  selectedAutoTrigger = this.autoTriggers[0];
  autoTriggerTimes = [
    { value: 'days', name: 'Days' },
    { value: 'hours', name: 'Hours' },
    { value: 'minutes', name: 'Minutes' }
  ];
  selectedTriggerTime = 'immediate';

  selectedAutomation: string = '';

  constructor(
    private dialogRef: MatDialogRef<EventTypeAutomationComponent>,
    private automationService: AutomationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.eventType = this.data;
      if (this.eventType.auto_trigger_duration) {
        this.selectedTriggerTime = 'custom';
      } else {
        this.selectedTriggerTime = 'immediate';
      }
      this.autoTriggers.forEach((e, index) => {
        if (e.value == this.eventType.auto_trigger_type) {
          this.selectedAutoTrigger = this.autoTriggers[index];
        }
      });
    }
    if (this.data?.automation) {
      this.isAutomation = true;
      this.selectedAutomation = this.data?.automation;
    }
  }

  ngOnInit(): void {}

  changeAutoTriggerType(event) {
    this.autoTriggers.some((e) => {
      if (e.value == event.value) {
        this.selectedAutoTrigger = e;
        this.selectedTriggerTime = e.value == '2' ? 'custom' : 'immediate';
        this.eventType.auto_trigger_duration = 24;
        this.eventType.auto_trigger_time = 'hours';
        return true;
      }
    });
  }

  changeAutoTriggerTime(event) {}

  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt._id;
    this.eventType.automation = this.selectedAutomation;
  }

  setAutomation(): void {
    this.saving = true;
    if (!this.eventType.auto_trigger_type || !this.selectedAutomation) {
      this.saving = false;
      return;
    }
    if (this.selectedTriggerTime == 'immediate') {
      this.eventType.auto_trigger_duration = 0;
    }
    this.dialogRef.close(this.eventType);
  }

  unassignAutomation(): void {
    this.eventType.auto_trigger_duration = null;
    this.eventType.auto_trigger_time = null;
    this.eventType.auto_trigger_type = null;
    this.eventType.automation = null;
    this.dialogRef.close(this.eventType);
  }
}
