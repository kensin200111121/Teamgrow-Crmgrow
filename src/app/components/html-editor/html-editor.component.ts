import { SspaService } from '../../services/sspa.service';
import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import * as QuillNamespace from 'quill';
import { promptForFiles, loadBase64, ByteToSize } from '@app/helper';
import { TemplatesService } from '@services/templates.service';
import { Template } from '@models/template.model';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ToastrService } from 'ngx-toastr';
import { ConnectService } from '@services/connect.service';
import { UserService } from '@services/user.service';
import { Subscription, Subject, Observable } from 'rxjs';
import QuillMention from 'quill-mention';
import BlotFormatter from 'quill-blot-formatter';
const Quill: any = QuillNamespace;
Quill.register({ 'modules/mention': QuillMention }, true);
Quill.register({ 'modules/blotFormatter': BlotFormatter }, true);
const Delta = Quill.import('delta');
const Parchment = Quill.import('parchment');
const ImageBlot = Quill.import('formats/image');
import { StripTagsPipe } from 'ngx-pipes';
import { Material } from '@models/material.model';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MaterialService } from '@services/material.service';
import {
  DEFAULT_TEMPLATE_TOKENS,
  RECORDING_POPUP
} from '@constants/variable.constants';
// import ImageResize from 'quill-image-resize-module';
// Quill.register('modules/imageResize', ImageResize);
import { ScheduleService } from '@services/schedule.service';
import { AssetsManagerComponent } from '@components/assets-manager/assets-manager.component';
import { TemplateToken } from '@utils/data.types';
import { environment } from '@environments/environment';
import { LandingPageDetail } from '@app/core/interfaces/resources.interface';
import { USER_FEATURES } from '@app/constants/feature.constants';

@Component({
  selector: 'app-html-editor',
  templateUrl: './html-editor.component.html',
  styleUrls: ['./html-editor.component.scss'],
  providers: [StripTagsPipe]
})
export class HtmlEditorComponent implements OnInit {
  readonly USER_FEATURES = USER_FEATURES;
  @Input() submitted = false;
  @Input() placeholder = '';
  @Input() style: any = { height: '180px' };
  @Input() class = '';
  @Input() mention: any[] = []; // quill-mentions item list
  @Input() mentionEnabled = false;
  @Input() hasToken = false;
  @Input() required = false;
  @Input() subject = '';
  @Input() storeAudio = false;
  @Input() sendMode: string;
  @Input() hasChatgpt = false;
  @Input() enableChatgpt = false;
  isCalendly = false;
  audioContext;
  config = {
    toolbar: {
      container: [
        [{ size: ['0.75em', false, '1.5em', '2em'] }],
        [
          {
            font: [
              'arial',
              'times new roman',
              'monospace',
              'arial black',
              'arial narrow',
              'comic sans ms',
              'garamond',
              'georgia',
              'tahoma',
              'trebuchet ms',
              'verdana'
            ]
          }
        ],
        ['bold', 'italic', 'underline'],
        [{ list: 'bullet' }],
        ['link', 'image'],
        [{ align: [] }],
        ['emoji'],
        //['scheduler']
      ],
      handlers: {
        attachment: () => {
          promptForFiles().then((files) => {
            [].forEach.call(files, (file) => {
              loadBase64(file).then((base64) => {
                const i = Math.floor(Math.log(file.size) / Math.log(1024));
                const size = file.size / Math.pow(1024, i);
                if ((size > 25 && i == 2) || i > 2) {
                  this.zone.run(() => {
                    this.toast.error(
                      'You can send up to 25 MB in attachments.',
                      '',
                      { timeOut: 3000 }
                    );
                    this.emailEditor.quillEditor.focus();
                    this.cdr.detectChanges();
                  });
                } else {
                  const attachment = {
                    filename: file.name,
                    type: file.type,
                    content: base64.substr(base64.indexOf(',') + 1),
                    size: ByteToSize(file.size),
                    byte: file.size
                  };
                  if (this.limit) {
                    let attachmentSize = 0;
                    for (const attach of this.attachments) {
                      attachmentSize += attach.byte;
                    }
                    attachmentSize += file.size;
                    if (attachmentSize / 1024 / 1024 > this.limit) {
                      this.zone.run(() => {
                        this.toast.error(
                          `You can send up to ${this.limit} MB in attachments in automation.`,
                          '',
                          { timeOut: 3000 }
                        );
                        this.emailEditor.quillEditor.focus();
                        this.cdr.detectChanges();
                      });
                    } else {
                      this.attachments.unshift(attachment);
                      this.attachmentChange.emit(this.attachments);
                      this.cdr.detectChanges();
                    }
                  } else {
                    this.attachments.unshift(attachment);
                    this.attachmentChange.emit(this.attachments);
                    this.cdr.detectChanges();
                  }
                }
              });
            });
          });
        },
        link: () => {
          if (this.emailEditor.quillEditor.getSelection().length !== 0) {
            const range = this.emailEditor.quillEditor.getSelection();
            const delta = this.emailEditor.quillEditor.getContents(
              range.index,
              range.length
            );
            this.displayText = delta.ops[0]?.insert;
            this.displayAttr = delta.ops[0]?.attributes;
            this.isSelected = true;
            this.selectedIndex = range.index;
            this.selectedLength = range.length;
          } else {
            this.displayText = '';
          }
          this.displayLink = '';
          this.showLink = !this.showLink;
          this.cdr.detectChanges();
        },
        template: () => {
          this.showTemplates = !this.showTemplates;
          this.cdr.detectChanges();
        },
        emoji: () => {
          this.showEmoji = !this.showEmoji;
          this.cdr.detectChanges();
        },
        calendly: () => {
          this.showCalendly = !this.showCalendly;
          this.cdr.detectChanges();
        },
        record: () => {
          const w = 750;
          const h = 450;
          const dualScreenLeft =
            window.screenLeft !== undefined
              ? window.screenLeft
              : window.screenX;
          const dualScreenTop =
            window.screenTop !== undefined ? window.screenTop : window.screenY;

          const width = window.innerWidth
            ? window.innerWidth
            : document.documentElement.clientWidth
            ? document.documentElement.clientWidth
            : screen.width;
          const height = window.innerHeight
            ? window.innerHeight
            : document.documentElement.clientHeight
            ? document.documentElement.clientHeight
            : screen.height;

          const systemZoom = width / window.screen.availWidth;
          const left = (width - w) / 2 / systemZoom + dualScreenLeft;
          const top = (height - h) / 2 / systemZoom + dualScreenTop;
          const option = `width=${w}, height=${h}, top=${top}, left=${left}`;
          const ref = window.location.href;
          if (!this.popup || this.popup.closed) {
            this.popup = window.open(
              this.recordUrl +
                '/index.html?token=' +
                this.authToken +
                '&method=website&userId=' +
                this.userId +
                '&prev=' +
                encodeURIComponent(ref),
              'record',
              option
            );
            if (!this.attachedRecordCallback) {
              this.attachedRecordCallback = true;
              window.addEventListener('message', this.recordCallback);
            }
          } else {
            this.popup.focus();
          }
          this.cdr.detectChanges();
        },
        scheduler: () => {
          this.showScheduler = !this.showScheduler;
          this.cdr.detectChanges();
        },
      }
    },
    blotFormatter: {}
  };
  mentionConfig = {
    allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
    mentionDenotationChars: ['#'],
    showDenotationChar: false,
    source: (searchTerm, renderList, mentionChar) => {
      let id = 0;
      const list = this.mention
        .filter((e) => e.includes(searchTerm))
        .map((e) => {
          id += 1;
          return { id: id, value: e };
        });
      renderList(list);
    },
    onSelect: (item, insertItem) => {
      this.insertEmailContentToken(item.value, true);
    },
    onOpen: () => {
      this.mentionOpened = true;
      const keyBoardModule = this.emailEditor.quillEditor.getModule('keyboard');
      this.keyboardModules = keyBoardModule.bindings['Enter'];
      delete keyBoardModule.bindings['Enter'];
    },
    onClose: () => {
      this.mentionOpened = false;
      const keyBoardModule = this.emailEditor.quillEditor.getModule('keyboard');
      keyBoardModule.bindings['Enter'] = this.keyboardModules;
    }
  };
  @Input()
  public set hasAttachment(val: boolean) {
    if (val) {
      this.config.toolbar.container.unshift(['attachment']);
    }
  }
  @Input()
  public set hasTemplates(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['template']);
    }
  }
  @Input()
  public set hasEmoji(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['emoji']);
    }
  }
  @Input()
  public set hasCalendly(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['calendly']);
      this.connectService.loadCalendlyAll(false);
      this.isCalendly = val;
    }
  }

  @Input()
  public set hasScheduler(val) {
    if (val) {
      this.config.toolbar.container.push(['scheduler']);
    }
  }

  // @Input()
  // public set hasScheduler(val) {
  //   console.log('val', val);
  //   if (val) {
  //     this.scheduleService.getEventTypes(false);
  //   } else {
  //     this.config.toolbar.container.unshift(['scheduler']);
  //   }
  // }
  @Input()
  public set hasRecord(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['record']);
    }
  }
  @Input()
  public set noImage(val: boolean) {
    if (val) {
      this.config.toolbar.container.forEach((e) => {
        e.some((item, index) => {
          if (item === 'image' || item.list === 'image') {
            e.splice(index, 1);
            return true;
          }
        });
      });
    }
  }
  @Input()
  public set noFont(val: boolean) {
    if (val) {
      this.config.toolbar.container.forEach((e) => {
        e.some((item, index) => {
          if (item.hasOwnProperty('font')) {
            delete item['font'];
          }
          if (Object.keys(item).length === 0) {
            e.splice(index, 1);
          }
        });
      });
    }
  }
  @Input()
  public set noSize(val: boolean) {
    if (val) {
      this.config.toolbar.container.forEach((e) => {
        e.some((item, index) => {
          if (item.hasOwnProperty('size')) {
            delete item['size'];
          }
          if (Object.keys(item).length === 0) {
            e.splice(index, 1);
          }
        });
      });
    }
  }
  @Input() templateSelectMethod = 'insert';
  @Input() public set attach(val: any) {
    if (val) {
      this.attachments = val;
    }
  }

  private _value = '';
  @Input()
  public set value(val: string) {
    this._value = val;
  }
  public get value(): string {
    return this._value;
  }
  @Input() limit = 0;
  @Input() public set modules(val: any) {
    if (val) {
      this.config = { ...this.config, ...val };
    }
  }
  @Output() onEditorCreated: EventEmitter<any> = new EventEmitter();
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  @Output() onFocus: EventEmitter<boolean> = new EventEmitter();
  @Output() attachmentChange: EventEmitter<any> = new EventEmitter();
  @Output() onInit: EventEmitter<boolean> = new EventEmitter();
  @Output() onChangeTemplate: EventEmitter<Template> = new EventEmitter();
  @Output() onCreateEvent: EventEmitter<string> = new EventEmitter();
  @Output() onRecordCompleted: EventEmitter<Material> = new EventEmitter();
  @Output() onContentTokenSelected: EventEmitter<any> = new EventEmitter();
  @Output() onSetAiMode = new EventEmitter<boolean>();

  editorForm: UntypedFormControl = new UntypedFormControl();
  @ViewChild('emailEditor') emailEditor: QuillEditorComponent;
  inited: Subject<boolean> = new Subject();
  inited$: Observable<boolean> = this.inited.asObservable();
  templateTokens: TemplateToken[] = [];
  showTemplates = false;
  showCalendly = false;
  showScheduler = false;
  showEmoji = false;
  showLink = false;
  displayText = null;
  displayAttr = null;
  displayLink = '';
  isSelected = false;
  selectedIndex;
  selectedLength;
  set = 'twitter';
  userId = '';
  authToken = '';
  recordUrl = RECORDING_POPUP;
  quillEditorRef;
  popup;
  attachments = [];
  keyboardModules;
  mentionOpened = false;

  public get isTextLink(): boolean {
    return !this.displayText || typeof this.displayText === 'string';
  }

  @ViewChild('createNewContent') createNewContent: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;

  profileSubscription: Subscription;
  garbageSubscription: Subscription;

  // Dialog for Image
  imageDlg;

  attachedRecordCallback = false;
  recordCallback = (e) => {
    if (e?.data?._id) {
      try {
        const recordedVideo = new Material().deserialize(e.data);
        recordedVideo.material_type = 'video';
        if (!this.hasSameMaterial(recordedVideo)) {
          this.insertMaterials(e.data, true);
          this.materialService.create$(recordedVideo);
          this.onRecordCompleted.emit(recordedVideo);
        }
      } catch (err) {
        console.log('Insert Material is failed', err);
      }
    }
    return;
  };

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    public templateService: TemplatesService,
    private materialService: MaterialService,
    public connectService: ConnectService,
    private cdr: ChangeDetectorRef,
    private overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private toast: ToastrService,
    private appRef: ApplicationRef,
    private stripTags: StripTagsPipe,
    private router: Router,
    private zone: NgZone,
    public scheduleService: ScheduleService,
    public sspaService: SspaService
  ) {
    this.templateService.loadAll(false);
    this.authToken = this.userService.getToken();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      this.userId = user._id;
    });

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
      }
    );

    if (this.hasScheduler !== false) {
      this.scheduleService.getEventTypes(false);
    }
  }

  ngOnInit(): void {
    if (this.mentionEnabled) {
      this.config['mention'] = this.mentionConfig;
    }

    setTimeout(() => {
      const quill = this.emailEditor.quillEditor;

      if (this.hasScheduler === false) {
        const toolbar = quill.getModule('toolbar');
        const scheduler_button =
          toolbar.container.querySelector('.ql-scheduler');

        scheduler_button.remove();
      }
      if (this.hasRecord === false) {
        const toolbar = quill.getModule('toolbar');
        const record_button = toolbar.container.querySelector('.ql-record');
        record_button.remove();
      }

      // When user insert the "landing page link without material",
      // User could edit the "link" by default action. So it prevent this feature by hiding the link editor tooltip
      quill.on('selection-change', (range) => {
        if (range) {
          const [leaf] = quill.getLeaf(range.index);
          const linkDom = leaf?.parent?.domNode;
          if (
            linkDom &&
            linkDom.tagName === 'A' &&
            linkDom.getAttribute('data-no-edit') === 'true'
          ) {
            // Hide the link editor tooltip
            try {
              quill.container
                .querySelector('.ql-tooltip')
                .classList.add('ql-hidden');
            } catch (err) {}
          }
        }
      });
    }, 150);

    // Always move emoji button to the end of the toolbar
    const container = this.config.toolbar.container as (string[])[];
    const emojiIndex = container.findIndex(btn => btn.includes('emoji'));
    if (emojiIndex !== -1) {
      const [emojiButton] = container.splice(emojiIndex, 1);
      container.push(emojiButton);
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    window.removeEventListener('message', this.recordCallback);
  }

  ngAfterViewInit() {
    const Inline = Quill.import('blots/inline');

    class CustomColor extends Inline {
      // CustomColor implementation
    }

    CustomColor.blotName = 'customColor';
    CustomColor.tagName = 'FONT';

    Quill.register(CustomColor, true);
  }

  insertValue(value: string): void {
    if (value && this.quillEditorRef && this.quillEditorRef.clipboard) {
      this.emailEditor.quillEditor.focus();
      const range = this.emailEditor.quillEditor.getSelection();
      let index = 0;
      if (range) {
        index = range.index;
      }
      const delta = this.quillEditorRef.clipboard.convert(value);
      this.emailEditor.quillEditor.updateContents(
        new Delta().retain(index).concat(delta),
        'user'
      );
      //const length = this.emailEditor.quillEditor.getLength();
      //this.emailEditor.quillEditor.setSelection(length, 0, 'user');
      //this.emailEditor.quillEditor.setContents(delta, 'user');
    }
  }

  insertLink(): void {
    let url;
    if (
      !this.displayLink.includes('http:') &&
      !this.displayLink.includes('https:')
    ) {
      this.displayLink = 'http://' + this.displayLink;
    }
    if (this.displayText != '') {
      if (this.displayText?.image) {
        const imgInfo = this.displayText.image;
        const _height = this.displayAttr?.height;
        const _width = this.displayAttr?.width;
        url =
          `<a href="${this.displayLink}" target="_blank"><img src="${imgInfo}" height="${_height}" width="${_width}"></a>` +
          '\n';
      } else {
        url =
          `<a href="${this.displayLink}" target="_blank">${this.displayText}</a>` +
          '\n';
      }
    } else {
      url =
        `<a href="${this.displayLink}" target="_blank">${this.displayLink}</a>` +
        '\n';
    }
    if (this.isSelected) {
      this.emailEditor.quillEditor.deleteText(
        this.selectedIndex,
        this.selectedLength,
        'user'
      );
      this.isSelected = false;
    }
    this.insertValue(url);
    this.showLink = false;
    this.cdr.detectChanges();
  }

  setValue(value: string, materials: any = null): void {
    if (value && this.quillEditorRef && this.quillEditorRef.clipboard) {
      const delta = this.quillEditorRef.clipboard.convert(value);
      if (materials && Object.keys(materials).length) {
        delta.forEach((e) => {
          if (e.insert?.materialLink?._id) {
            const materialId = e.insert?.materialLink?._id;
            if (materials[materialId]?.material_type) {
              e.insert.materialLink.material_type =
                materials[materialId]?.material_type;
            }
          }
        });
      }
      this.emailEditor.quillEditor.setContents(delta, 'user');
    }
  }

  getEditorInstance(editorInstance: any): void {
    this.quillEditorRef = editorInstance;
    if (this.onEditorCreated.observers.length > 0) {
      this.onEditorCreated.emit(editorInstance);
    } else {
      const toolbar = this.quillEditorRef.getModule('toolbar');
      toolbar.addHandler('image', this.initImageHandler);

      this.emailEditor.quillEditor.container.addEventListener('click', (ev) => {
        const img = Parchment.Registry?.find(ev.target);
        if (img && img instanceof ImageBlot) {
          this.emailEditor.quillEditor.setSelection(
            img.offset(this.emailEditor.quillEditor.scroll),
            1,
            'user'
          );
        }
      });

      this.emailEditor.quillEditor.root.addEventListener('scroll', (ev) => {
        const selection = this.emailEditor.quillEditor.getSelection();
        if (!selection) {
          const blotElement =
            this.emailEditor.quillEditor.root.parentElement.getElementsByClassName(
              'blot-formatter__overlay'
            );
          if (blotElement && blotElement.length > 0) {
            for (let i = 0; i < blotElement.length; i++) {
              blotElement[i].remove();
            }
          }
        }
      });

      const fonts = Quill.import('attributors/style/font');
      fonts.whitelist = [
        'arial',
        'times new roman',
        'monospace',
        'arial black',
        'arial narrow',
        'comic sans ms',
        'garamond',
        'georgia',
        'tahoma',
        'trebuchet ms',
        'verdana'
      ];
      Quill.register(fonts, true);

      const tooltip = this.emailEditor.quillEditor.theme.tooltip;
      const input = tooltip.root.querySelector('input[data-link]');
      const link_button = toolbar.container.querySelector('.ql-link');
      const image_button = toolbar.container.querySelector('.ql-image');
      const template_button = toolbar.container.querySelector('.ql-template');
      const emoji_button = toolbar.container.querySelector('.ql-emoji');
      const calendly_button = toolbar.container.querySelector('.ql-calendly');
      const scheduler_button = toolbar.container.querySelector('.ql-scheduler');
      const record_button = toolbar.container.querySelector('.ql-record');
      const attachment_button =
        toolbar.container.querySelector('.ql-attachment');
      const bold_button = toolbar.container.querySelector('.ql-bold');
      const italic_button = toolbar.container.querySelector('.ql-italic');
      const underline_button = toolbar.container.querySelector('.ql-underline');
      const list_button = toolbar.container.querySelector('.ql-list');

      if (image_button) {
        image_button.setAttribute('data-tip', 'Image');
        image_button.classList.add('qtip');
        image_button.classList.add('tip-bottom');
      }
      if (template_button) {
        template_button.insertAdjacentHTML(
          'beforeend',
          `<i class="i-icon i-template bgc-dark d-block"></i>`
        );
        template_button.setAttribute('data-tip', 'Template');
        template_button.classList.add('qtip');
        template_button.classList.add('tip-bottom');
      }
      if (emoji_button) {
        emoji_button.setAttribute('data-tip', 'Emoji');
        emoji_button.classList.add('qtip');
        emoji_button.classList.add('tip-bottom');
      }
      if (calendly_button) {
        calendly_button.insertAdjacentHTML(
          'beforeend',
          `<i class="i-icon i-calendly bgc-dark d-block"></i>`
        );
        calendly_button.setAttribute('data-tip', 'Calendly');
        calendly_button.classList.add('qtip');
        calendly_button.classList.add('tip-bottom');
      }
      if (record_button) {
        record_button.insertAdjacentHTML(
          'beforeend',
          `<i class="i-icon i-record-toolbar d-block"></i>`
        );
        record_button.setAttribute('data-tip', 'Record');
        record_button.classList.add('qtip');
        record_button.classList.add('tip-bottom');
      }
      if (attachment_button) {
        attachment_button.setAttribute('data-tip', 'Attachment');
        attachment_button.classList.add('qtip');
        attachment_button.classList.add('tip-bottom');
      }
      if (bold_button) {
        bold_button.setAttribute('data-tip', 'Bold');
        bold_button.classList.add('qtip');
        bold_button.classList.add('tip-bottom');
      }
      if (italic_button) {
        italic_button.setAttribute('data-tip', 'Italic');
        italic_button.classList.add('qtip');
        italic_button.classList.add('tip-bottom');
      }
      if (underline_button) {
        underline_button.setAttribute('data-tip', 'Underline');
        underline_button.classList.add('qtip');
        underline_button.classList.add('tip-bottom');
      }
      if (list_button) {
        list_button.setAttribute('data-tip', 'List');
        list_button.classList.add('qtip');
        list_button.classList.add('tip-bottom');
      }
      input.dataset.link = 'www.crmgrow.com';

      if (scheduler_button) {
        scheduler_button.insertAdjacentHTML(
          'beforeend',
          `<i class="i-icon i-event-note bgc-dark d-block"></i>`
        );
        scheduler_button.setAttribute('data-tip', 'Scheduler');
        scheduler_button.classList.add('qtip');
        scheduler_button.classList.add('tip-bottom');
        this.scheduleService.eventTypes$.subscribe((res) => {
          if (res.length > 0) {
            scheduler_button.classList.remove('disable');
          } else {
            scheduler_button.classList.add('disable');
          }
        });
      }
      if (emoji_button) {
        emoji_button.insertAdjacentHTML(
          'beforeend',
          `<i class="d-block i-icon i-emoji bgc-dark"></i>`
        );
        emoji_button.setAttribute('data-tip', 'Emoji');
        emoji_button.classList.add('qtip');
        emoji_button.classList.add('tip-bottom');
      }
    }
  }
  setAiMode(mode: boolean): void {
    this.onSetAiMode.emit(mode);
  }
  initImageHandler = (): void => {
    this.emailEditor.quillEditor.focus();
    const range = this.quillEditorRef.getSelection(true);
    this.zone.run(() => {
      const assetDlg = this.dialog.open(AssetsManagerComponent, {
        width: '100vw',
        maxWidth: '720px',
        height: 'calc(100vh - 80px)'
      });
      assetDlg['_ref']['overlayRef']['_host'].classList.add('assets-manager');
      assetDlg.afterClosed().subscribe((res) => {
        res?.data?.forEach((e) => {
          this.insertImageToEditor(e.url, range);
        });
      });
    });
  };

  onContentChanged(value): void {
    this.onChangeValue(value?.html || '');
  }

  insertImageToEditor(url: string, range): void {
    if (range?.index) {
      this.emailEditor.quillEditor.focus();
      this.quillEditorRef.setSelection(range, 'user');
    } else {
      this.emailEditor.quillEditor.focus();
    }
    const _r = this.quillEditorRef.getSelection(true);
    this.emailEditor.quillEditor.insertEmbed(_r.index, `image`, url, 'user');
    this.emailEditor.quillEditor.formatText(_r.index, 1, 'width', '300px');
    this.emailEditor.quillEditor.setSelection(_r.index + 1, 0, 'user');
    const length = this.emailEditor.quillEditor.getLength();
    this.emailEditor.quillEditor.insertText(length, '\n', {}, 'user');
    this.emailEditor.quillEditor.setSelection(length + 1, 0, 'user');
  }

  insertEmailContentValue(value: string, isEmoji = false): void {
    this.emailEditor.quillEditor.focus();
    const range = this.emailEditor.quillEditor.getSelection();
    if (!isEmoji)
      this.emailEditor.quillEditor.insertText(range.index, '\n\n', 'user');
    const newPos = range.index ? range.index : 0;
    this.emailEditor.quillEditor.insertEmbed(newPos, 'image', 'custom', 'user');
    const html =
      this.emailEditor.quillEditor.editor?.scroll?.domNode?.innerHTML;
    this.setValue(html.replace(`<img src="custom">`, value));
    this.emailEditor.quillEditor.setSelection(newPos + value.length, 0);
  }

  insertEmailContentText(value: string): void {
    this.emailEditor.quillEditor.focus();
    const range = this.emailEditor.quillEditor.getSelection();
    const newPos = range.index || 0;
    this.emailEditor.quillEditor.deleteText(newPos, 1, 'user');
    this.emailEditor.quillEditor.insertText(newPos, value, 'user');
    this.emailEditor.quillEditor.setSelection(newPos + value.length, 0, 'user');
  }

  insertEmailContentToken(value: string, fromMention = false): void {
    const tokenValue = `{${value}}`;
    this.emailEditor.quillEditor.focus();
    const range = this.emailEditor.quillEditor.getSelection();
    const index = fromMention ? range.index - 1 : range.index;
    this.emailEditor.quillEditor.deleteText(index, 1, 'user');
    this.emailEditor.quillEditor.insertText(index, tokenValue, 'user');
    this.emailEditor.quillEditor.setSelection(
      index + tokenValue.length,
      0,
      'user'
    );
  }

  onChangeValue(value: string): void {
    if (!this.emailEditor?.quillEditor) {
      return;
    }
    const contents = this.quillEditorRef.clipboard.convert(value);
    const ops = contents.ops || [];
    const base64Images = [];
    let imageIndex = 1;
    ops.forEach((op) => {
      if (op.insert.image) {
        const dataImage = op.insert.image.split(',');
        if (dataImage[1]) {
          op.insert.image = this.sspaService.toAsset('img/spinner.gif');
          const key = 'uuid_' + imageIndex;
          op.insert.key = key;
          const image64string = dataImage.join(',');
          base64Images.push({
            key,
            data: image64string
          });
          imageIndex++;
        }
      }
    });
    if (base64Images.length) {
      this.emailEditor.quillEditor.setContents(ops);
      if (this.imageDlg) {
        return;
      }
      this.imageDlg = this.dialog.open(AssetsManagerComponent, {
        width: '100vw',
        maxWidth: '720px',
        height: 'calc(100vh - 80px)',
        data: {
          images: base64Images
        }
      });
      this.imageDlg.afterClosed().subscribe((res) => {
        if (res?.data?.length) {
          const images = {};
          res.data.forEach((e) => {
            images['uuid_' + e.index] = e.url;
          });
          ops.forEach((op) => {
            if (op.insert.image && op.insert.key) {
              const indexKey = op.insert.key;
              if (images[indexKey]) {
                op.insert.image = images[indexKey];
                op.attributes = { width: '300px' };
              }
            }
          });
          this.emailEditor.quillEditor.setContents(ops);
          const length = this.emailEditor.quillEditor.getLength();
          this.emailEditor.quillEditor.insertText(length, '\n', {}, 'user');
        } else {
          //callback when click close button on add library
          const filteredOps = ops.filter((op) => {
            return !op.insert?.image?.includes('img/spinner.gif');
          });
          this.emailEditor.quillEditor.setContents(filteredOps);
          const length = this.emailEditor.quillEditor.getLength();
          this.emailEditor.quillEditor.insertText(length, '\n', {}, 'user');
        }
        this.imageDlg = null;
      });
    } else {
      this.valueChange.emit(value);
    }

    // if (this.storeAudio) {
    //   const index = ops.findIndex((item) => item.insert?.audioNote);
    //   if (index >= 0) {
    //     this.audioContext = ops[index];
    //   }
    //   if (index < 0 && this.audioContext) {
    //     ops.unshift(this.audioContext);
    //     this.emailEditor.quillEditor.setContents(ops);
    //   }
    // }
  }

  removeAudio(): void {
    this.audioContext = null;
  }

  insertBeforeMaterials(): void {
    this.emailEditor.quillEditor.focus();
    const range = this.quillEditorRef.getSelection();
    const length = this.emailEditor.quillEditor.getLength();

    let next;
    let prev;
    let selection = 0;
    if (range && range.index) {
      const prevDelta = this.emailEditor.quillEditor.getContents(
        range.index - 1,
        1
      );
      const nextDelta = this.emailEditor.quillEditor.getContents(
        range.index,
        1
      );
      next = nextDelta.ops[0].insert;
      prev = prevDelta.ops[0].insert;
      selection = range.index;
    } else {
      const nextDelta = this.emailEditor.quillEditor.getContents(length - 1, 1);
      const prevDelta = this.emailEditor.quillEditor.getContents(length - 2, 1);
      next = (nextDelta.ops[0] && nextDelta.ops[0].insert) || '\n';
      prev = (prevDelta.ops[0] && prevDelta.ops[0].insert) || '\n';
      selection = length;
    }

    if (next === '\n' && prev === '\n') {
      return;
    } else if (next === '\n') {
      this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 1, 0, 'user');
      return;
    } else if (prev === '\n') {
      return;
    } else {
      this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 1, 0, 'user');
    }
  }

  insertAfterMaterials(): void {
    this.emailEditor.quillEditor.focus();
    const range = this.quillEditorRef.getSelection();
    const length = this.emailEditor.quillEditor.getLength();
    let selection = 0;
    if (range && range.index) {
      selection = range.index;
    } else {
      selection = length;
    }
    this.emailEditor.quillEditor.insertText(selection, '\n\n', {}, 'user');
    this.emailEditor.quillEditor.setSelection(selection + 2, 0, 'user');
  }

  insertMaterials(material: any, noTitle = false): void {
    this.emailEditor.quillEditor.focus();

    const range = this.quillEditorRef.getSelection();
    const length = this.emailEditor.quillEditor.getLength();

    let selection;
    if (!(this.stripTags.transform(this.value || '') || '').trim()) {
      selection = range.index;
      if (!noTitle) {
        this.emailEditor.quillEditor.insertText(
          selection,
          material.title + '\n',
          'bold',
          'user'
        );
        selection += material.title.length + 1;
      }
      this.emailEditor.quillEditor.insertEmbed(
        selection,
        `materialLink`,
        {
          _id: material._id,
          preview: material.preview || material.thumbnail,
          type: material.material_type
        },
        'user'
      );
      selection += 1;
      this.emailEditor.quillEditor.setSelection(selection, 0, 'user');

      this.emailEditor.quillEditor.insertText(selection, '\n\n\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 3, 0, 'user');
    } else {
      if (range && range.index) {
        selection = range.index;
        this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
        selection += 1;
        if (!noTitle) {
          this.emailEditor.quillEditor.insertText(
            selection,
            material.title + '\n',
            'bold',
            'user'
          );
          selection += material.title.length + 1;
        }
        this.emailEditor.quillEditor.insertEmbed(
          selection,
          `materialLink`,
          {
            _id: material._id,
            preview: material.preview || material.thumbnail,
            type: material.material_type
          },
          'user'
        );
        selection += 1;
        this.emailEditor.quillEditor.setSelection(selection, 0, 'user');
      } else {
        selection = length;
        this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
        selection += 1;
        if (!noTitle) {
          this.emailEditor.quillEditor.insertText(
            length,
            material.title,
            'bold',
            'user'
          );
          selection += material.title.length + 1;
        }
        this.emailEditor.quillEditor.insertEmbed(
          selection,
          `materialLink`,
          {
            _id: material._id,
            preview: material.preview || material.thumbnail,
            type: material.material_type
          },
          'user'
        );
        selection += 1;
        this.emailEditor.quillEditor.setSelection(selection, 0, 'user');
      }

      this.emailEditor.quillEditor.insertText(selection, '\n\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 2, 0, 'user');
    }
  }

  insertLandingPage(landingPage: LandingPageDetail, noTitle = false): void {
    this.emailEditor.quillEditor.focus();

    const range = this.quillEditorRef.getSelection();
    const length = this.emailEditor.quillEditor.getLength();
    const emptyMaterialStr =
      landingPage.name || 'Click here to visit the landing page';
    let selection;
    if (!(this.stripTags.transform(this.value || '') || '').trim()) {
      selection = range.index;
    } else {
      if (range && range.index) {
        selection = range.index;
        this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
        selection += 1;
      } else {
        selection = length;
        this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
        selection += 1;
      }
    }

    if (landingPage?.material) {
      this.emailEditor.quillEditor.insertEmbed(
        selection,
        `landingPageLink`,
        {
          _id: landingPage._id,
          preview:
            landingPage?.material?.preview || landingPage?.material?.thumbnail,
          type: landingPage?.material_type
        },
        'user'
      );
      selection += 1;
    } else {
      this.emailEditor.quillEditor.insertText(
        selection,
        emptyMaterialStr,
        'link',
        `{{${landingPage?._id}}}`,
        'user'
      );
      // After the link is inserted, add the class to the DOM element
      // With this class, backend system recognize the landing page link and replace it with trackable link
      setTimeout(() => {
        const editorElement = document.querySelector('.ql-editor');
        const insertedLink = editorElement?.querySelector(
          `a[href="{{${landingPage?._id}}}"]`
        );
        if (insertedLink) {
          insertedLink.classList.add('landing-page-object'); // Add custom class to the link
          insertedLink.setAttribute('data-no-edit', 'true'); // This indicates that this is the no material landing page
          insertedLink.setAttribute(
            'title',
            `This is a link to the landing page (${landingPage.name})`
          );
        }
      }, 0);
      selection += emptyMaterialStr.length;
    }

    this.emailEditor.quillEditor.setSelection(selection, 0, 'user');
    this.emailEditor.quillEditor.insertText(selection, '\n\n', {}, 'user');
    this.emailEditor.quillEditor.setSelection(selection + 2, 0, 'user');
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
    this.cdr.detectChanges();
    this.attachmentChange.emit(this.attachments);
  }
  hasSameMaterial(material: Material): boolean {
    if (this.value && this.value.indexOf(`${material._id}`) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  clearAttachments(): void {
    this.attachments = [];
    this.cdr.detectChanges();
    this.attachmentChange.emit(this.attachments);
  }

  onFocusEvt(): void {
    this.onFocus.emit();
  }

  closeTemplates(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-template')) {
      return;
    }
    this.showTemplates = false;
  }

  closeCalendly(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-calendly')) {
      return;
    }
    this.showCalendly = false;
  }
  closeScheduler(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-scheduler')) {
      return;
    }
    this.showScheduler = false;
  }

  closeEmoji(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-emoji')) {
      return;
    }
    this.showEmoji = false;
  }

  closeLink(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-link')) {
      return;
    }
    this.showLink = false;
    this.isSelected = false;
  }

  selectTemplate(template: Template, emit = false): void {
    if (emit) {
      this.onChangeTemplate.emit(template);
    }
    // this.attachments = template.attachments;
    if (this.templateSelectMethod === 'insert') {
      this.insertEmailContentValue(template.content + '<br>');
    } else {
      this.setValue(template.content + '<br>');
    }
    this.showTemplates = false;
  }

  selectCalendly(url: string): void {
    this.showCalendly = false;
    this.showScheduler = false;
    const fullUrl = this.getRealEventTypeLink(url);
    const data = `<a href="${fullUrl}">${fullUrl}</a>`;
    this.insertValue(data + '<br>' + '<br>');
  }

  createNew(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewContent,
      this._viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        return;
      } else {
        this.overlayRef.attach(this.templatePortal);
        return;
      }
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'template-backdrop',
        panelClass: 'template-panel',
        width: '96vw',
        maxWidth: '480px'
      });
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  closeOverlay(flag: boolean): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.detachBackdrop();
    }
    if (flag) {
      // this.toast.success('', 'New template is created successfully.', {
      //   closeButton: true
      // });
      setTimeout(() => {
        this.appRef.tick();
      }, 1);
    }
    this.cdr.detectChanges();
  }

  isEmpty(): boolean {
    const hasEmpty = !(this.stripTags.transform(this.value || '') || '').trim();
    if (hasEmpty) {
      if (this.value && this.value.indexOf('<img') !== -1) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  insertNote(data): void {
    this.emailEditor.quillEditor.insertEmbed(0, 'audioNote', data, 'user');
  }

  onTokenSelected(token): void {
    this.onContentTokenSelected.emit(token);
  }

  handleKeyDown(evt: KeyboardEvent): void {
    if (this.mentionEnabled) {
      if (evt.key === '#') {
        setTimeout(() => {
          if (!this.mentionOpened) {
            const mentionModule =
              this.emailEditor.quillEditor.getModule('mention');
            mentionModule.openMenu('');
          }
        }, 50);
      }
      if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
        const parentEle = document.getElementById('quill-mention-list');
        if (parentEle) {
          if (evt.key === 'ArrowDown') {
            this.activateNextItem(parentEle);
          } else {
            this.activatePrevItem(parentEle);
          }
        }
      }
    }
    if (evt.key === '@') {
      evt.stopPropagation();
      evt.stopImmediatePropagation();
    }
  }

  activateNextItem(listEl: HTMLElement): void {
    // adjust scrollable-menu offset if the next item is out of view
    const activeEl = listEl
      .getElementsByClassName('ql-mention-list-item selected')
      .item(0);
    if (activeEl) {
      const activeLiEl: HTMLElement = document.getElementById(activeEl.id);
      const prevLiEl: HTMLElement = <HTMLElement>activeEl.previousSibling;
      if (prevLiEl && prevLiEl.nodeName === 'LI') {
        const activeLiRect: ClientRect = activeLiEl.getBoundingClientRect();
        if (activeLiRect.bottom > listEl.getBoundingClientRect().bottom) {
          listEl.scrollTop =
            activeLiEl.offsetTop + activeLiRect.height - listEl.clientHeight;
        }
      } else {
        listEl.scrollTop = 0;
      }
    }
  }

  activatePrevItem(listEl: HTMLElement): void {
    const activeEl = listEl
      .getElementsByClassName('ql-mention-list-item selected')
      .item(0);
    if (activeEl) {
      const activeLiEl: HTMLElement = document.getElementById(activeEl.id);
      const prevLiEl: HTMLElement = <HTMLElement>activeEl.nextSibling;
      if (prevLiEl && prevLiEl.nodeName === 'LI') {
        const activeLiRect: ClientRect = activeLiEl.getBoundingClientRect();
        if (activeLiRect.top < listEl.getBoundingClientRect().top) {
          listEl.scrollTop = activeLiEl.offsetTop;
        }
      } else {
        listEl.scrollTop = listEl.clientHeight;
      }
    }
  }

  clear(): void {
    this.emailEditor.quillEditor.focus();
    this.emailEditor.quillEditor.setContents('');
  }
  getRealEventTypeLink(url: string): string {
    const prefix = environment.isSspa
      ? environment.Vortex_Scheduler
      : environment.domain.scheduler;
    return url.includes('https://') ? url : `https://${prefix + url}`;
  }
}
// [{ font: [] }],
// [{ size: ['small', false, 'large', 'huge'] }],
// ['bold', 'italic', 'underline', 'strike'],
// [{ header: 1 }, { header: 2 }],
// [{ color: [] }, { background: [] }],
// [{ list: 'ordered' }, { list: 'bullet' }],
// [{ align: [] }],
// ['link', 'image']
