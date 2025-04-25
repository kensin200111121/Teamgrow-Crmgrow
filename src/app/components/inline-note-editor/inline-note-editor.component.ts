import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import moment from 'moment-timezone';
import { Note } from '@models/note.model';
import { HandlerService } from '@services/handler.service';
import { NoteService } from '@services/note.service';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { isEmptyHtml } from '@utils/functions';
import { AudioNoteComponent } from '@components/audio-note/audio-note.component';

@Component({
  selector: 'app-inline-note-editor',
  templateUrl: './inline-note-editor.component.html',
  styleUrls: ['./inline-note-editor.component.scss']
})
export class InlineNoteEditorComponent implements OnInit {
  @Input() isFocused = false;

  @Input()
  public set value(val: Note) {
    if (val) {
      this.note = val;
      this.content = this.note.content;
    }
  }

  private _content = '';
  public set content(val: string) {
    this._content = val;
  }
  public get content(): string {
    return this._content;
  }

  @Input()
  public set contact(val: string) {
    this.contactId = val;
  }
  @Input() storeAudio = false;
  @Input() disableHideContent? = false;
  @Output() onCreated = new EventEmitter();
  @Output() onUpdated = new EventEmitter();
  @Output() onCancel? = new EventEmitter();
  @Output() onFocus? = new EventEmitter();

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('recorder') audioRecorder: AudioNoteComponent;

  quillEditorRef;
  public noteId = '';
  public contactId = '';
  public note: Note = new Note();
  public audio;

  public saving = false;
  public recording = false;
  private saveSubscription: Subscription;
  constructor(
    private noteService: NoteService,
    private handlerService: HandlerService
  ) {}

  ngOnInit(): void {}

  getEditorInstance($event): void {}

  /**
   * Insert the audio note to the content
   * @param $event: {file, url, content}
   */
  insertAudioNote($event: any): void {
    this.recording = false;
    if ($event.file) {
      // this.htmlEditor.insertNote({
      //   content: '',
      //   created_at: moment().format('YYYY-MM-DD HH:mm a')
      // });
      this.audio = $event.file;
    }
    if (this.saving) {
      setTimeout(() => {
        this.save();
      }, 1000);
    }
  }

  startAudioNote($event: any): void {
    this.recording = true;
  }

  /**
   * Remove the audio note from content
   */
  removeAudioNote(): void {
    this.recording = false;
    this.note.audio = '';
    const contents = this.htmlEditor.emailEditor.quillEditor.getContents();
    const ops = contents.ops || [];
    contents.ops.some((e, index) => {
      if (e.insert?.audioNote) {
        ops.splice(index, 1);
        this.htmlEditor.emailEditor.quillEditor.setContents({ ops });
        return true;
      }
    });
  }

  close(): void {
    this.saving = false;
    this.audioRecorder.stopRecording(false);
    if (this.onCancel) {
      this.onCancel.emit();
    }
  }

  save(): void {
    if (this.audioRecorder.recordStarted) {
      this.audioRecorder.stopRecording();
      this.saving = true;
      return;
    }
    this.saving = false;
    if (
      (!this.note.content || isEmptyHtml(this.note.content)) &&
      this.note.audio
    ) {
      const contents = this.htmlEditor.emailEditor.quillEditor.getContents();
      contents.ops.some((e) => {
        if (e.insert?.audioNote) {
          this.note.content =
            '<div class="audio-note" contenteditable="false"><strong>Audio Note</strong><em class="audio-note-date"> ' +
            e.insert.audioNote.created_at +
            '</em></div><div><br></div>';
        }
      });
    }
    if ((!this.note.content || isEmptyHtml(this.note.content)) && !this.audio) {
      return;
    }
    if (this.note._id) {
      this.update();
    } else {
      this.create();
    }
  }

  create(): void {
    if (this.saving) return;
    const formData = new FormData();
    if (this.audio) {
      const file = new File([this.audio], 'audio.wav');
      formData.append('audio', file);
    }
    formData.append('contact', this.contactId);
    formData.append('content', this.note.content || '');
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saving = true;
    this.saveSubscription = this.noteService
      .create(formData)
      .subscribe((res) => {
        if (res) {
          this.handlerService.activityAdd$([this.contactId], 'note');
          this.note.content = '';
          this.note.audio = null;
          this.audio = null;
          this.onCreated.emit();
        }
        this.saving = false;
      });
  }

  update(): void {
    const formData = new FormData();
    if (this.audio) {
      const file = new File([this.audio], 'audio.wav');
      formData.append('audio', file);
    }
    formData.append('content', this.note.content);
    if (this.note.content) {
      if (this.note.content.indexOf('<strong>Audio Note</strong>') < 0) {
        formData.append('remove_audio', 'true');
      }
    }
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saving = true;
    this.noteService.update(this.note._id, formData).subscribe((res) => {
      if (res) {
        this.audio = null;
        this.onUpdated.emit(res);
      }
      this.saving = false;
    });
  }

  focus(): void {
    this.onFocus?.emit();
  }
}
