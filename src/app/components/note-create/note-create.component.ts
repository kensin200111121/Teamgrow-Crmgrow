import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Contact } from '@models/contact.model';
import { Note } from '@models/note.model';
import { HandlerService } from '@services/handler.service';
import { NoteService } from '@services/note.service';
import { DealsService } from '@services/deals.service';
import { ToastrService } from 'ngx-toastr';
import { isEmptyHtml } from '@utils/functions';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import moment from 'moment-timezone';
import { AudioNoteComponent } from '@components/audio-note/audio-note.component';

@Component({
  selector: 'app-note-create',
  templateUrl: './note-create.component.html',
  styleUrls: ['./note-create.component.scss']
})
export class NoteCreateComponent implements OnInit {
  isSelected = false;
  contacts: Contact[] = [];
  note: Note = new Note();
  saving = false;
  saveSubscription: Subscription;
  type = '';
  dealId;

  toFocus = false;
  audioFile;

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('recorder') audioRecorder: AudioNoteComponent;
  constructor(
    private noteService: NoteService,
    private handlerService: HandlerService,
    private dealService: DealsService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<NoteCreateComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    if (this.data && this.data.deal) {
      this.type = 'deal';
      this.dealId = this.data.deal;
    }
    if (this.data && this.data.contacts) {
      this.isSelected = true;
      for (const contact of this.data.contacts) {
        this.contacts.push(contact);
      }
    }
  }

  ngOnInit(): void {}

  selectContact(event: Contact): void {
    if (event) {
      this.contacts.push(event);
    }
  }

  removeContact(contact: Contact): void {
    const index = this.contacts.findIndex((item) => item._id === contact._id);
    if (index >= 0) {
      this.contacts.splice(index, 1);
    }
  }

  submit(): void {
    if (this.audioRecorder.recordStarted) {
      this.audioRecorder.stopRecording();
      this.saving = true;
      return;
    }
    if (!this.contacts.length) {
      return;
    }
    if (
      (!this.note.content || isEmptyHtml(this.note.content)) &&
      !this.audioFile
    ) {
      return;
    }
    const ids = [];
    this.contacts.forEach((e) => {
      ids.push(e._id);
    });
    const formData = new FormData();
    if (this.audioFile) {
      const file = new File([this.audioFile], 'audio.wav');
      formData.append('audio', file);
    }
    if (this.type === 'deal') {
      const data = {
        contacts: ids,
        content: this.note.content || '',
        deal: this.dealId
      };
      formData.append('data', JSON.stringify(data));
      this.saving = true;
      this.saveSubscription && this.saveSubscription.unsubscribe();
      this.saveSubscription = this.dealService
        .addNote(formData)
        .subscribe((res) => {
          this.saving = false;
          this.dialogRef.close(res);
        });
    } else {
      if (ids.length > 1) {
        const data = {
          contacts: ids,
          content: this.note.content
        };
        formData.append('data', JSON.stringify(data));
        this.saving = true;
        this.saveSubscription && this.saveSubscription.unsubscribe();
        this.saveSubscription = this.noteService
          .bulkCreate(formData)
          .subscribe(() => {
            this.saving = false;
            // this.toastr.success('Notes successfully added.');
            this.handlerService.activityAdd$(ids, 'note');
            this.dialogRef.close();
          });
      } else {
        const data = {
          contact: ids[0],
          content: this.note.content || ''
        };
        for (const key in data) {
          formData.append(key, data[key]);
        }
        this.saving = true;
        this.saveSubscription && this.saveSubscription.unsubscribe();
        this.saveSubscription = this.noteService
          .create(formData)
          .subscribe((res) => {
            this.saving = false;
            if (res) {
              // this.toastr.success('Notes successfully added.');
              this.handlerService.activityAdd$(ids, 'note');
              this.dialogRef.close();
            }
          });
      }
    }
  }

  close(): void {
    if (this.audioRecorder.recording) {
      this.audioRecorder.stopRecording();
    }
    this.dialogRef.close();
  }

  setFocus(): void {
    this.toFocus = true;
  }

  isFocus(): any {
    return this.toFocus;
  }

  blueAll(): void {
    this.toFocus = false;
  }

  /**
   * Insert the audio note to the content
   * @param $event: {file, url, content}
   */
  insertAudioNote($event: any): void {
    if ($event.file) {
      // this.htmlEditor.insertNote({
      //   content: '',
      //   created_at: moment().format('YYYY-MM-DD HH:mm a')
      // });
      this.audioFile = $event.file;
    }
    if (this.saving) {
      setTimeout(() => {
        this.submit();
      }, 1000);
    }
  }

  /**
   * Remove the audio note from content
   */
  removeAudioNote(): void {
    this.note.audio = '';
    const contents = this.htmlEditor.emailEditor.quillEditor.getContents();
    const ops = contents.ops || [];
    contents.ops.some((e, index) => {
      if (e.insert?.audioNote) {
        ops.splice(index, 1);
        this.htmlEditor.emailEditor.quillEditor.setContents({ ops });
        this.htmlEditor.removeAudio();
        return true;
      }
    });
  }
}
