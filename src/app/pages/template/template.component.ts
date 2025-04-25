import { SspaService } from '../../services/sspa.service';
import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplatesService } from '@services/templates.service';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { Template } from '@models/template.model';
import { PageCanDeactivate } from '@variables/abstractors';
import { ToastrService } from 'ngx-toastr';
import { DEFAULT_TEMPLATE_TOKENS } from '@constants/variable.constants';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { ConnectService } from '@services/connect.service';
import { HelperService } from '@services/helper.service';
import {
  convertIdToUrlOnSMS,
  isEmptyHtml,
  parseURLToIdsAndPairedUrl
} from '@utils/functions';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { User } from '@models/user.model';
import { environment } from '@environments/environment';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { TemplateToken } from '@utils/data.types';
import { CreateTokenComponent } from '@components/create-token/create-token.component';
import { getTokenIds } from '@app/helper';
import { MaterialBrowserV2Component } from '@app/components/material-browser-v2/material-browser-v2.component';
import { SegmentedMessage } from 'sms-segments-calculator';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy
{
  saved = true;
  segments = 0;
  id = ''; // template id for loading
  mode = 'new'; // template edit mode: 'new' | 'edit' | 'inline-edit'
  template: Template = new Template();
  template_title = ''; // template title
  template_type = 'email';
  ownerId = ''; // template owner

  isLoading = false;
  isSaving = false;
  downloading = false;

  cursorStart = 0;
  cursorEnd = 0;
  focusedField = '';

  isCalendly = false;

  garbage: Garbage = new Garbage();
  user: User = new User();

  loadSubscription: Subscription;
  saveSubscription: Subscription;
  garbageSubscription: Subscription;
  profileSubscription: Subscription;
  routeSubscription: Subscription;

  videos = [];
  pdfs = [];
  images = [];

  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };
  templateTokens: TemplateToken[] = [];
  tokens: string[] = [];

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('subjectField') subjectEl: ElementRef;
  @ViewChild('smsContentField') textAreaEl: ElementRef;

  @Input('inline') inline = false;
  @Input()
  public set initMode(val: string) {
    this.mode = val || 'new';
  }
  @Input()
  public set initId(val: string) {
    if (val) {
      this.id = val;
    }
  }
  @Input()
  public set initTemplate(val: any) {
    if (val) {
      this.template = new Template().deserialize(val);
      if (this.template.type === 'text') {
        this.correctMaterialIds();
      }
    }
  }
  @Input('wrapperClass') wrapperClass = '';
  @Output() onClosePage = new EventEmitter();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private toastr: ToastrService,
    public templatesService: TemplatesService,
    public connectService: ConnectService,
    private userService: UserService,
    private helperService: HelperService,
    public sspaService: SspaService
  ) {
    super();

    this.templatesService.loadAll(false);

    // Load the garbage for the calendly checking
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (
        this.garbage?.calendly &&
        Object.keys(this.garbage?.calendly).length &&
        !environment.isSspa
      ) {
        this.isCalendly = true;
        this.connectService.loadCalendlyAll(false);
      } else {
        this.isCalendly = false;
      }
      this.templateTokens = DEFAULT_TEMPLATE_TOKENS;
      const user = this.userService.profile.getValue();
      if (!user?.assignee_info?.is_enabled) {
        this.templateTokens = this.templateTokens.filter((token) => {
          return token.id < 10; // subtract assignee tokens
        });
      }
      this.templateTokens = [
        ...this.templateTokens,
        ...this.garbage.template_tokens
      ];
      this.tokens = this.templateTokens.map((e) => e.name);
    });

    // Profile Loading Subscription
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
        }
      }
    );
  }

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      if (!this.inline) {
        this.id = params['id'];
        if (this.route.snapshot.routeConfig.path.includes('templates/edit')) {
          this.mode = 'edit';
        } else {
          this.mode = 'new';
        }
      }
      if (this.id) {
        this.loadData(this.id);
      }
      window['confirmReload'] = true;
    });
  }

  ngOnDestroy(): void {
    window['confirmReload'] = false;
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  /**
   * Change the template type
   * @param type: Change the template type
   */
  changeType(type: string): void {
    if (this.template.content) {
      this.dialog
        .open(ConfirmComponent, {
          width: '450px',
          disableClose: true,
          data: {
            title: 'Confirm Template Type',
            message:
              'You may lose the contents you have just written. Do you still want to change type?',
            confirmLabel: 'Yes'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.template.content = '';
            if (type === 'text') {
              const segmentedMessage = new SegmentedMessage(
                this.template.content || '',
                'auto',
                true
              );
              this.segments = segmentedMessage.segmentsCount || 0;
            }
            this.template.type = type;
            this.saved = false;
          } else {
            this.template_type = this.template.type;
            this.saved = false;
          }
        });
    } else {
      if (type === 'text') {
        const segmentedMessage = new SegmentedMessage(
          this.template.content || '',
          'auto',
          true
        );
        this.segments = segmentedMessage.segmentsCount || 0;
      }
      this.template.type = type;
      this.saved = false;
    }
  }
  onRedirectArticlePage(): void {
    window.open(
      'https://kb1.crmgrow.com/kb/guide/en/sms-texting-character-limits-8DWOLjE5ZS/Steps/4023017',
      '_blank'
    );
  }
  saveTemplate(): void {
    if (isEmptyHtml(this.template.content)) {
      return;
    }
    let tokens = [];

    let textBufferContent = this.template.content;
    if (this.template.type === 'text') {
      const { videoIds, imageIds, pdfIds, content } = parseURLToIdsAndPairedUrl(
        this.template.content
      );
      this.template.video_ids = videoIds;
      this.template.pdf_ids = pdfIds;
      this.template.image_ids = imageIds;
      textBufferContent = content;

      tokens = getTokenIds(this.garbage.template_tokens, this.template.content);
    } else if (this.template.type === 'email') {
      const { videoIds, imageIds, pdfIds } = this.getMaterialsFromEmail();
      this.template.video_ids = videoIds;
      this.template.pdf_ids = pdfIds;
      this.template.image_ids = imageIds;
      tokens = getTokenIds(this.garbage.template_tokens, this.template.content);
      const _titleTokens = getTokenIds(
        this.garbage.template_tokens,
        this.template.title
      );
      if (_titleTokens.length) {
        _titleTokens.forEach((token) => {
          if (!tokens.includes(token)) {
            tokens.push(token);
          }
        });
      }
    }
    this.template.token_ids = tokens;
    const content = this.helperService.removeTags(this.template.content);
    this.template.meta.excerpt = content.substring(0, 80);

    if (this.mode === 'inline-edit') {
      this.onClosePage.emit(this.template);
      return;
    }

    if (this.mode === 'edit') {
      this.template.title = this.template_title;
      const template = {
        ...this.template,
        _id: undefined,
        content: textBufferContent
      };
      this.isSaving = true;
      this.saveSubscription && this.saveSubscription.unsubscribe();
      this.saveSubscription = this.templatesService
        .update(this.id, template)
        .subscribe(
          () => {
            if (this.inline) {
              this.onClosePage.emit(this.template);
            } else {
              this.router.navigate(['/templates/own/root']);
              this.isSaving = false;
              this.saved = true;
            }
          },
          () => {
            this.isSaving = false;
          }
        );
    } else {
      // Create
      this.route.queryParams.subscribe((params) => {
        const folderId = params['folder'];
        this.template.title = this.template_title;
        this.template.content = textBufferContent;
        if (folderId && folderId !== 'root') {
          this.template.folder = folderId;
        }
        this.isSaving = true;
        this.saveSubscription && this.saveSubscription.unsubscribe();
        this.saveSubscription = this.templatesService
          .create(this.template)
          .subscribe(
            () => {
              if (this.inline) {
                this.onClosePage.emit(this.template);
              } else {
                this.router.navigate([
                  '/templates/own/' + (folderId || 'root')
                ]);
                this.isSaving = false;
                this.saved = true;
              }
            },
            () => {
              this.isSaving = false;
            }
          );
      });
    }
  }

  loadData(id: string): void {
    this.isLoading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.templatesService.read(id).subscribe(
      (res) => {
        this.isLoading = false;
        this.template.deserialize(res);
        this.ownerId = this.template.user;

        this.videos = res.video_ids;
        this.pdfs = res.pdf_ids;
        this.images = res.image_ids;
        // Correction of the some content
        const videoIds = [];
        const pdfIds = [];
        const imageIds = [];
        const materials = {};
        (res.video_ids || []).forEach((e) => {
          if (!e) {
            return;
          }
          if (e['_id']) {
            videoIds.push(e?.['_id']);
            materials[e['_id']] = e;
            materials[e['_id']]['material_type'] = 'video';
          }
        });
        (res.pdf_ids || []).forEach((e) => {
          if (!e) {
            return;
          }
          if (e['_id']) {
            pdfIds.push(e?.['_id']);
            materials[e['_id']] = e;
            materials[e['_id']]['material_type'] = 'pdf';
          }
        });
        (res.image_ids || []).forEach((e) => {
          if (!e) {
            return;
          }
          if (e['_id']) {
            imageIds.push(e?.['_id']);
            materials[e['_id']] = e;
            materials[e['_id']]['material_type'] = 'image';
          }
        });

        this.template.video_ids = videoIds;
        this.template.image_ids = imageIds;
        this.template.pdf_ids = pdfIds;

        this.template_title = this.template.title;
        if (this.template.type === 'email') {
          this.htmlEditor.setValue(this.template.content, materials);
        } else {
          this.correctMaterialIds();
        }
        if (this.mode == 'new' && !!this.id) {
          this.template_title = '';
        }
      },
      () => (this.isLoading = false)
    );
  }

  /**=======================================================
   *
   * Subject Field
   *
   ========================================================*/
  setCursorPos(field, field_name: string): void {
    this.focusedField = field_name;
    if (field.selectionStart || field.selectionStart === '0') {
      this.cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.cursorEnd = field.selectionEnd;
    }
  }

  insertSubjectValue(value: string, token = false): void {
    let iValue = value;
    if (token) iValue = `{${value}}`;
    this.subjectEl.nativeElement.focus();
    const cursorPosition = this.subjectEl.nativeElement.selectionStart;
    this.subjectEl.nativeElement.setSelectionRange(
      cursorPosition,
      cursorPosition
    );
    document.execCommand('insertText', false, iValue);
    this.cursorStart = cursorPosition + iValue.length;
    this.cursorEnd = this.cursorStart;
    this.subjectEl.nativeElement.setSelectionRange(
      this.cursorStart,
      this.cursorEnd
    );
  }

  insertEmojiContentvalue(value: string): void {
    this.htmlEditor.insertEmailContentValue(value, true);
  }

  insertValue(value: string, token = false): void {
    let iValue = value;
    if (token) iValue = `{${value}}`;
    const field = this.textAreaEl.nativeElement;
    field.focus();
    let cursorStart = this.template.content.length;
    let cursorEnd = this.template.content.length;
    if (field.selectionStart || field.selectionStart === '0') {
      cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      cursorEnd = field.selectionEnd;
    }
    field.setSelectionRange(cursorStart, cursorEnd);
    document.execCommand('insertText', false, iValue);
    cursorStart += iValue.length;
    cursorEnd = cursorStart;
    field.setSelectionRange(cursorStart, cursorEnd);
    this.saved = false;
  }

  insertEmailValue(value: string, token = false): void {
    if (token) {
      this.htmlEditor.insertEmailContentToken(value);
    } else {
      this.htmlEditor.insertEmailContentValue(value);
    }
  }

  focusEditor(): void {
    this.focusedField = 'editor';
  }

  stateChanged(): void {
    this.saved = false;

    const segmentedMessage = new SegmentedMessage(
      this.template.content || '',
      'auto',
      true
    );
    this.segments = segmentedMessage.segmentsCount || 0;
  }

  /**
   * Add the attachments to the template data
   * @param attachments : attachments
   */
  onAttachmentChange(attachments: any[]): void {
    this.saved = false;
    this.template.attachments = attachments;
  }

  /**
   * Open the material browser and handling close event
   * @param type: email | text
   */
  openMaterialsDlg(type: string): void {
    if (type == 'email') {
      const content = this.template.content;
      const materials = this.helperService.getMaterials(content);
      this.dialog
        .open(MaterialBrowserV2Component, {
          width: '98vw',
          maxWidth: '940px',
          data: {
            hideMaterials: materials,
            title: 'Insert material',
            multiple: true,
            onlyMine: true
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res.materials) {
            this.saved = false;
            this.htmlEditor.insertBeforeMaterials();
            for (let i = 0; i < res.materials.length; i++) {
              const material = res.materials[i];
              this.htmlEditor.insertMaterials(material);
            }
          }
        });
    } else {
      const { videoIds, imageIds, pdfIds } = this.helperService.getSMSMaterials(
        this.template.content
      );
      const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map(
        (e) => {
          return { _id: e };
        }
      );
      this.dialog
        .open(MaterialBrowserV2Component, {
          width: '98vw',
          maxWidth: '940px',
          data: {
            title: 'Insert material',
            multiple: true,
            hideMaterials: selectedMaterials,
            onlyMine: true
          }
        })
        .afterClosed()
        .subscribe((res) => {
          this.saved = false;
          if (res && res.materials && res.materials.length) {
            const convertedMsg = res.materials.reduce(function (
              result,
              material
            ) {
              let url;
              switch (material.material_type) {
                case 'video':
                  url = `${environment.website}/video/${material._id}`;
                  break;
                case 'pdf':
                  url = `${environment.website}/pdf/${material._id}`;
                  break;
                case 'image':
                  url = `${environment.website}/image/${material._id}`;
                  break;
              }
              return result + '\n' + url;
            },
            '');

            this.textAreaEl.nativeElement.focus();
            const field = this.textAreaEl.nativeElement;

            if (!this.template.content.replace(/(\r\n|\n|\r|\s)/gm, '')) {
              field.select();
              document.execCommand('insertText', false, convertedMsg);
              return;
            }
            if (field.selectionEnd || field.selectionEnd === 0) {
              if (this.template.content[field.selectionEnd - 1] === '\n') {
                document.execCommand('insertText', false, convertedMsg);
              } else {
                document.execCommand('insertText', false, '\n' + convertedMsg);
              }
            } else {
              if (this.template.content.slice(-1) === '\n') {
                document.execCommand('insertText', false, convertedMsg);
              } else {
                document.execCommand('insertText', false, '\n' + convertedMsg);
              }
            }
            this.stateChanged();
          }
        });
    }
  }

  /**
   * Change the material id token with the real link (used for the old template)
   */
  correctMaterialIds(): any {
    this.template.content = convertIdToUrlOnSMS(this.template.content);
  }

  /**
   * Returns the material ids that is used in the email template content
   * @returns: {videoIds, pdfIds, imageIds}
   */
  getMaterialsFromEmail(): any {
    if (this.htmlEditor?.emailEditor?.quillEditor?.editor?.delta?.ops) {
      const videoIds = [];
      const pdfIds = [];
      const imageIds = [];
      this.htmlEditor?.emailEditor?.quillEditor?.editor?.delta?.ops.forEach(
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

  /**
   * insert the calendly event link for the text template content
   * @param url: calendly event link address
   * @returns: void
   */
  selectCalendly(url: string): void {
    this.saved = false;
    this.textAreaEl.nativeElement.focus();
    const field = this.textAreaEl.nativeElement;
    if (!this.template.content.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, url);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.template.content[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, url);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    } else {
      if (this.template.content.slice(-1) === '\n') {
        document.execCommand('insertText', false, url);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    }
  }

  downloadTemplate(element: Template): void {
    const templates = this.templatesService.templates.getValue();
    const existing = templates.some(
      (e) => e.original_id && e.original_id == element._id
    );
    if (existing) {
      this.dialog
        .open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Template',
            message: 'Are you sure to download this template again?',
            confirmLabel: 'Yes',
            cancelLabel: 'No'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this._downloadTemplate(element);
          }
        });
    } else {
      this._downloadTemplate(element);
    }
  }

  _downloadTemplate(element: Template): void {
    let curElement = JSON.parse(
      JSON.stringify({ ...element, original_id: element._id })
    );
    curElement = _.omit(curElement, ['_id', 'role', 'company']);
    const imageNames = _.uniqBy(this.images, 'title');
    const videoNames = _.uniqBy(this.videos, 'title');
    const pdfNames = _.uniqBy(this.pdfs, 'title');
    if (
      videoNames.length == 0 &&
      imageNames.length == 0 &&
      pdfNames.length == 0
    ) {
      this.templatesService.createTemplate(curElement).subscribe((res) => {
        if (res) {
          this.templatesService.loadOwn(true);
          if (!this.user.onboard.template_download) {
            this.user.onboard.template_download = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
          }
        }
      });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          maxWidth: '400px',
          width: '96vw',
          position: { top: '100px' },
          data: {
            title: 'Download Template',
            message: 'Are you sure to download these ones?',
            videos: videoNames,
            images: imageNames,
            pdfs: pdfNames,
            confirmLabel: 'Yes',
            cancelLabel: 'No'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.downloading = true;
            this.templatesService
              .createTemplate(curElement)
              .subscribe((res) => {
                if (res) {
                  this.templatesService.loadOwn(true);
                  if (!this.user.onboard.template_download) {
                    this.user.onboard.template_download = true;
                    this.userService
                      .updateProfile({ onboard: this.user.onboard })
                      .subscribe(() => {
                        this.userService.updateProfileImpl({
                          onboard: this.user.onboard
                        });
                      });
                  }
                  this.downloading = false;
                }
              });
          }
        });
    }
  }

  onClose(): void {
    if (this.inline) {
      this.onClosePage.emit();
    }
  }

  onSubjectTokenSelected(token): void {
    setTimeout(() => {
      this.template.subject = this.template.subject.replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
  }

  onTextTokenSelected(token): void {
    setTimeout(() => {
      this.template.content = this.template.content.replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
  }

  onCreateToken(): void {
    this.dialog
      .open(CreateTokenComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          tokens: this.templateTokens
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.toastr.success('New token created successfully');
        }
      });
  }
}
