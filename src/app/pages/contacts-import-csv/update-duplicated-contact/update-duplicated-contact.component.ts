// Added by Sylla
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Contact2IGroup } from '@utils/data.types';

@Component({
  selector: 'app-update-duplicated-contact',
  templateUrl: './update-duplicated-contact.component.html',
  styleUrls: ['./update-duplicated-contact.component.scss']
})
export class UpdateDuplicatedContactComponent implements OnInit {
  @Output() onClose = new EventEmitter();
  @Output() onUpdate = new EventEmitter();

  @Input('group') group: Contact2IGroup;

  selectedIndex: number = 0;
  isUpdating: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.selectedIndex =
      this.group.result._id == this.group.contacts[0]._id ? 0 : 1;
  }

  /**
   * callback on select new contact
   */
  onSelectNewContact(): void {
    this.selectedIndex = 0;
  }

  /**
   * callback on select old contact
   */
  onSelectOldContact(): void {
    this.selectedIndex = 1;
  }

  /**
   * callback on cancel the update
   */
  onCancel(): void {
    this.onClose.emit();
  }

  /**
   * callback on update contact
   */
  onUpdateContact(): void {
    this.isUpdating = true;
    const selectedContact = this.group.contacts[this.selectedIndex];
    this.group.result = selectedContact;
    this.group.updated = true;
    this.onUpdate.emit(this.group);
    this.isUpdating = false;
  }
}
// End by Sylla
