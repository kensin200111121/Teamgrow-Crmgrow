import { DOCUMENT } from '@angular/common';
import {
  Component,
  Inject,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subscription, map } from 'rxjs';
import { Template } from '@models/template.model';
import { FileService } from '@services/file.service';
import { TemplatesService } from '@services/templates.service';
import * as QuillNamespace from 'quill';
import _ from 'lodash';
import { UserService } from '@services/user.service';
import { TemplateToken } from '@utils/data.types';
import { DEFAULT_TEMPLATE_TOKENS } from '@constants/variable.constants';
import { HelperService } from '@services/helper.service';
import { MatDialog } from '@angular/material/dialog';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { environment } from '@environments/environment';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import {
  convertIdToUrlOnSMS,
  parseURLToIdsAndPairedUrl
} from '@app/utils/functions';
import { USER_FEATURES } from '@app/constants/feature.constants';
const Quill: any = QuillNamespace;
const Delta = Quill.import('delta');
const Parchment = Quill.import('parchment');
const ImageBlot = Quill.import('formats/image');
@Component({
  selector: 'app-template-create',
  templateUrl: './template-create.component.html',
  styleUrls: ['./template-create.component.scss']
})
export class TemplateCreateComponent implements OnInit, AfterViewInit {
  readonly USER_FEATURES = USER_FEATURES;
  template: Template = new Template();
  isSaving = false;
  saveSubscription: Subscription;

  placeholder = '';
  style: any = { height: '200px' };
  class = '';
  hasToken = false;
  required = false;

  cursor = 0;
  submitted = false;

  _value = '';

  get value(): string {
    return this._value;
  }

  @Input() type = 'email';
  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  @Input()
  set value(val: string) {
    setTimeout(() => {
      if (this.type === 'text' && val) {
        this._value = convertIdToUrlOnSMS(val);
      }
    }, 100);
  }
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  @Output() onClose: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('messageText') textAreaEl: ElementRef;
  cursorStart = 0;
  cursorEnd = 0;

  editorForm: UntypedFormControl = new UntypedFormControl();
  @ViewChild('emailEditor') emailEditor: HtmlEditorComponent;
  quillEditorRef;
  config = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'bullet' }],
        ['link', 'image']
      ]
    },
    blotFormatter: {}
  };

  isShowTokens = false;

  templateTokens: TemplateToken[] = [];
  tokens: string[] = [];
  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };
  materials: any[] = [];

  garbageSubscription: Subscription;

  constructor(
    private fileService: FileService,
    public templateService: TemplatesService,
    private userService: UserService,
    private helperService: HelperService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        this.templateTokens = DEFAULT_TEMPLATE_TOKENS;
        const user = this.userService.profile.getValue();
        if (!user?.assignee_info?.is_enabled) {
          this.templateTokens = this.templateTokens.filter((token) => {
            return token.id < 10; // subtract assignee tokens
          });
        }
        if (garbage.template_tokens && garbage.template_tokens.length) {
          this.templateTokens = [
            ...this.templateTokens,
            ...garbage.template_tokens
          ];
        }
        this.tokens = this.templateTokens.map((e) => e.name);
      }
    );
  }
  ngAfterViewInit(): void {
    const element = <HTMLElement>this.document.querySelector('[name="title"]');
    element.focus();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  setValue(value: string): void {
    if (value && this.quillEditorRef && this.quillEditorRef.clipboard) {
      const delta = this.quillEditorRef.clipboard.convert(value);
      this.emailEditor.emailEditor.quillEditor.setContents(delta, 'user');
    }
  }
  getEditorInstance(editorInstance: any): void {
    this.quillEditorRef = editorInstance;
    const toolbar = this.quillEditorRef.getModule('toolbar');
    toolbar.addHandler('image', this.initImageHandler);
    if (this._value) {
      this.setValue(this._value);
    }

    this.emailEditor.emailEditor.quillEditor.container.addEventListener(
      'click',
      (ev) => {
        const img = Parchment.Registry.find(ev.target);
        if (img instanceof ImageBlot) {
          this.emailEditor.emailEditor.quillEditor.setSelection(
            img.offset(this.emailEditor.emailEditor.quillEditor.scroll),
            1,
            'user'
          );
        }
      }
    );
  }

  initImageHandler = (): void => {
    const imageInput: HTMLInputElement = this.document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';

    imageInput.addEventListener('change', () => {
      if (imageInput.files != null && imageInput.files[0] != null) {
        const file = imageInput.files[0];
        this.fileService.attachImage(file).then((res) => {
          this.insertImageToEditor(res['url']);
        });
      }
    });
    imageInput.click();
  };

  insertImageToEditor(url: string): void {
    const range = this.quillEditorRef.getSelection();
    this.emailEditor.emailEditor.quillEditor.insertEmbed(
      range.index,
      `image`,
      url,
      'user'
    );
    this.emailEditor.emailEditor.quillEditor.setSelection(
      range.index + 1,
      0,
      'user'
    );
  }

  close(): void {
    this.onClose.emit(false);
  }

  onChangeValue(value: string): void {
    this._value = value.toString();
  }

  saveTemplate(): void {
    this.template.content = this._value;

    if (this.type === 'text') {
      const { videoIds, imageIds, pdfIds, content } = parseURLToIdsAndPairedUrl(
        this.template.content
      );
      this.template.video_ids = videoIds;
      this.template.pdf_ids = pdfIds;
      this.template.image_ids = imageIds;
      this.template.content = content;
    } else if (this.type === 'email') {
      const { videoIds, imageIds, pdfIds } = this.getMaterialsFromEmail();
      this.template.video_ids = videoIds;
      this.template.pdf_ids = pdfIds;
      this.template.image_ids = imageIds;
    }

    this.template.type = this.type;
    this.isSaving = true;
    this.cdr.detectChanges();
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.templateService
      .create(this.template)
      .subscribe((template) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        if (template) {
          this.templateService.create$(template);
          this.onClose.emit(true);
        }
      });
  }

  insertEmailContentValue(value: string): void {
    const tokenValue = `{${value}}`;
    if (this.type === 'email') {
      if (tokenValue && this.quillEditorRef && this.quillEditorRef.clipboard) {
        this.emailEditor.emailEditor.quillEditor.focus();
        const range = this.emailEditor.emailEditor.quillEditor.getSelection();
        let index = 0;
        if (range) {
          index = range.index;
        }
        const delta = this.quillEditorRef.clipboard.convert(tokenValue);
        this.emailEditor.emailEditor.quillEditor.updateContents(
          new Delta().retain(index).concat(delta),
          'user'
        );
        const length = this.emailEditor.emailEditor.quillEditor.getLength();
        this.emailEditor.emailEditor.quillEditor.setSelection(
          length,
          0,
          'user'
        );
      }
    } else {
      this.textAreaEl.nativeElement.focus();
      this.textAreaEl.nativeElement.setSelectionRange(
        this.cursorStart,
        this.cursorEnd
      );
      document.execCommand('insertText', false, tokenValue);
      this.cursorStart += tokenValue.length;
      this.cursorEnd = this.cursorStart;
      this.textAreaEl.nativeElement.setSelectionRange(
        this.cursorStart,
        this.cursorEnd
      );
    }
  }

  keepCursor(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.cursor = field.selectionStart;
    }
  }

  insertEmailSubjectValue(value: string): void {
    let text = this.template.subject;
    text =
      text.substring(0, this.cursor) +
      `{${value}}` +
      text.substring(this.cursor, text.length - this.cursor);
    this.template.subject = text;
  }

  setCursorPos(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.cursorEnd = field.selectionEnd;
    }
  }

  /**
   * callback when click the token from email subject mention
   * @param token selected template token
   */
  onSubjectTokenSelected(token): void {
    setTimeout(() => {
      this.template.subject = this.template.subject.replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
  }

  /**
   * callback when click the token from text template content mention
   * @param token selected template token
   */
  onTextTokenSelected(token): void {
    setTimeout(() => {
      this._value = this._value.replace(`#${token.name}`, `{${token.name}}`);
    }, 50);
  }

  openMaterialsDlg(): void {
    const content = this._value;
    const materials = this.helperService.getMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        title: 'Insert material',
        multiple: true,
        onlyMine: false
      }
    });
    materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials) {
        this.materials = _.intersectionBy(this.materials, materials, '_id');
        this.materials = [...this.materials, ...res.materials];
        if (this.emailEditor) {
          this.emailEditor.insertBeforeMaterials();
          for (let i = 0; i < res.materials.length; i++) {
            const material = res.materials[i];
            this.emailEditor.insertMaterials(material);
          }
        } else {
          const materialItems = res.materials
            .map((it) => {
              let url;
              switch (it.material_type) {
                case 'video':
                  url = `${environment.website}/video/${it._id}`;
                  break;
                case 'pdf':
                  url = `${environment.website}/pdf/${it._id}`;
                  break;
                case 'image':
                  url = `${environment.website}/image/${it._id}`;
                  break;
              }
              return url;
            })
            .join('\n');

          // this._value = materialItems;

          this.textAreaEl.nativeElement.focus();
          const field = this.textAreaEl.nativeElement;

          if (!this._value.replace(/(\r\n|\n|\r|\s)/gm, '')) {
            field.select();
            document.execCommand('insertText', false, materialItems);
            return;
          }
          if (field.selectionEnd || field.selectionEnd === 0) {
            if (this._value[field.selectionEnd - 1] === '\n') {
              document.execCommand('insertText', false, materialItems);
            } else {
              document.execCommand('insertText', false, '\n' + materialItems);
            }
          } else {
            if (this._value.slice(-1) === '\n') {
              document.execCommand('insertText', false, materialItems);
            } else {
              document.execCommand('insertText', false, '\n' + materialItems);
            }
          }
        }
      }
    });
  }

  /**
   * Returns the material ids that is used in the email template content
   * @returns: {videoIds, pdfIds, imageIds}
   */
  getMaterialsFromEmail(): any {
    if (this.emailEditor?.emailEditor?.quillEditor?.editor?.delta?.ops) {
      const videoIds = [];
      const pdfIds = [];
      const imageIds = [];
      this.emailEditor?.emailEditor?.quillEditor?.editor?.delta?.ops.forEach(
        (e) => {
          if (e.insert?.materialLink) {
            const material_type =
              e.insert?.materialLink?.material_type || 'video';
            switch (material_type) {
              case 'video':
                videoIds.push(e.insert?.materialLink?._id);
                break;
              case 'pdf':
                pdfIds.push(e.insert?.materialLink?._id);
                break;
              case 'image':
                imageIds.push(e.insert?.materialLink?._id);
                break;
            }
          }
        }
      );
      return {
        videoIds,
        pdfIds,
        imageIds
      };
    } else {
      return {
        videoIds: [],
        imageIds: [],
        pdfIds: []
      };
    }
  }
}
