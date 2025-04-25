import { Component, Input, OnInit } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { StoreService } from '@app/services/store.service';
import { UserService } from '@app/services/user.service';
import { Note } from '@models/note.model';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { NoteService } from '@services/note.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ContactService } from '@services/contact.service';
import { SspaService } from '../../../services/sspa.service';

@Component({
  selector: 'app-contact-note-action-item',
  templateUrl: './contact-note-action-item.component.html',
  styleUrls: ['./contact-note-action-item.component.scss']
})
export class ContactNoteActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'note';
  @Input() protected contactId: string;
  @Input() activity: ContactActivityActionV2;
  @Input() isPending: boolean;
  isLongContent = false;

  noteToEdit = null;

  tab = { icon: '', label: 'Notes', id: 'note' };

  constructor(
    private dialog: MatDialog,
    protected contactDetailInfoService: ContactDetailInfoService,
    public userService: UserService,
    private noteService: NoteService,
    public contactService: ContactService,
    public domSanitizer: DomSanitizer,
    public sspaService: SspaService
  ) {
    super();
  }
  ngOnInit(): void {
    super.ngOnInit();
    this.tab.id = 'note';
    this.checkContentLength();
    console.log(this.activity);
  }

  checkContentLength(): void {
    const txtDom = document.createElement('textarea');
    txtDom.innerHTML = this.activity.action?.content || '';
    if (txtDom?.textContent?.length > 150) {
      this.isLongContent = true;
      this.more = false;
    } else {
      this.isLongContent = false;
      this.more = true;
    }
  }

  openEditNoteForm(detail): void {
    if (!detail) {
      return;
    }
    this.tab.id = 'note_update';
    this.noteToEdit = new Note().deserialize(detail);
  }

  closeEditNoteForm(): void {
    this.tab.id = 'note';
  }

  onUpdateNote(note): void {
    // this.updateNotesArray(this.noteToEdit._id, note.content, note.audio);
    this.noteToEdit = new Note();
    this.tab.id = 'note';
    this.contactDetailInfoService.callbackForEditContactAction(
      this.contactId,
      'note'
    );
  }

  deleteNoteDetail(detail: any): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Note',
          message: 'Are you sure to delete the note?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          const data = {
            contact: this.contactId
          };
          this.noteService.delete(detail._id, data).subscribe((res) => {
            if (res) {
              // this.deleteNoteFromNotesArray(detail._id);
              this.contactService.deleteContactActivityByDetail(
                detail._id,
                'notes'
              );
              this.contactDetailInfoService.callbackForRemoveContactAction(
                detail._id,
                this.type
              );
            }
          });
        }
      });
  }
}
