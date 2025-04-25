import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskSearchOption } from '@models/searchOption.model';
import { TaskService } from '@services/task.service';
import { Contact } from '@models/contact.model';

@Component({
  selector: 'app-task-description-contact-filter',
  templateUrl: './task-description-contact-filter.component.html',
  styleUrls: ['./task-description-contact-filter.component.scss']
})
export class TaskDescriptionContactFilterComponent implements OnInit {
  searchOption: TaskSearchOption = new TaskSearchOption();
  contact: string;
  selectedContact;
  @Output() filter = new EventEmitter();
  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.searchOption = new TaskSearchOption().deserialize(
      JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
    );
    this.selectedContact = this.searchOption?.contact;
  }

  selectContact(event: Contact): void {
    if (event && event._id) {
      this.contact = event._id;
    } else {
      this.contact = null;
    }
  }

  save(): void {
    this.filter.emit({
      contact: this.contact
    });
  }
}
