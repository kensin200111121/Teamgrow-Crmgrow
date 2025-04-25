import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailEditorComponent } from 'angular-email-editor';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import { ImportTemplatesComponent } from '@components/import-templates/import-templates.component';
import {
  DEFAULT_TEMPLATE_TOKENS,
  UnlayerThemeId
} from '@constants/variable.constants';
import { MaterialService } from '@services/material.service';
import { StoreService } from '@services/store.service';
import { ThemeService } from '@services/theme.service';
import { PageCanDeactivate } from '@variables/abstractors';
import * as _ from 'lodash';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { TemplateToken } from '@utils/data.types';
import { CreateTokenComponent } from '@components/create-token/create-token.component';
@Component({
  selector: 'app-newsletter-editor',
  templateUrl: './newsletter-editor.component.html',
  styleUrls: ['./newsletter-editor.component.scss']
})
export class NewsletterEditorComponent
  extends PageCanDeactivate
  implements OnInit
{
  saved = true;

  options = {
    projectId: UnlayerThemeId,
    templateId: undefined,
    customJS: ['https://api.crmgrow.com/customTool/crmgrow-material.js'],
    displayMode: 'web',
    tools: {
      'custom#my_tool': {
        properties: {
          materialField: {
            editor: {
              data: {
                options: []
              }
            }
          }
        }
      },
      'custom#material_area': {
        usageLimit: 1
      }
    },
    mergeTagsConfig: {
      autocompleteTriggerChar: '{'
    },
    mergeTags: {
      contact_first_name: {
        name: 'Contact First Name',
        value: '{contact_first_name}'
      },
      contact_last_name: {
        name: 'Contact Last Name',
        value: '{contact_last_name}'
      },
      contact_email: {
        name: 'Contact Email',
        value: '{contact_email}'
      },
      contact_phone: {
        name: 'Contact Phone',
        value: '{contact_phone}'
      },
      my_name: {
        name: 'My Full Name',
        value: '{my_name}'
      },
      my_first_name: {
        name: 'My First Name',
        value: '{my_first_name}'
      },
      my_email: {
        name: 'My Email',
        value: '{my_email}'
      },
      my_phone: {
        name: 'My Phone',
        value: '{my_phone}'
      },
      my_company: {
        name: 'My Company',
        value: '{my_company}'
      },
      assignee_first_name: {
        name: 'Assignee First Name',
        value: '{assignee_first_name}'
      },
      assignee_last_name: {
        name: 'Assignee Last Name',
        value: '{assignee_last_name}'
      },
      assignee_email: {
        name: 'Assignee Email',
        value: '{assignee_email}'
      },
      assignee_phone: {
        name: 'Assignee Phone',
        value: '{assignee_phone}'
      }
    }
  };
  materialLinks = [];
  materials = [];
  theme = {
    _id: '',
    thumbnail: '',
    title: '',
    subject: '',
    type: 'newsletter',
    user: '',
    role: '',
    project_id: UnlayerThemeId,
    template_id: ''
  };
  isLoading = false;
  isSaving = false;
  json_content = {};
  html_content = '';
  cursorStart = 0;
  cursorEnd = 0;
  themeId = '';
  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };
  @ViewChild('subjectField') subjectEl: ElementRef;
  @ViewChild('editor') emailEditor: EmailEditorComponent;

  @Input('inline') inline = false;
  @Input('hasMode') mode = 'create';
  @Input()
  public set hasId(val: string) {
    if (val) {
      this.themeId = val;
    }
  }
  @Output() onClosePage = new EventEmitter();

  loadStatus: BehaviorSubject<any> = new BehaviorSubject(null);
  loadStatus$ = this.loadStatus.asObservable();

  templateTokens: TemplateToken[] = [];
  tokens: any[] = [];
  garbageSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private themeService: ThemeService,
    private materialService: MaterialService,
    private storeService: StoreService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    super();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.templateTokens = DEFAULT_TEMPLATE_TOKENS;
      const user = this.userService.profile.getValue();
      if (!user?.assignee_info?.is_enabled) {
        this.templateTokens = this.templateTokens.filter((token) => {
          return token.id < 10; // subtract assignee tokens
        });
      }
      if (res.template_tokens && res.template_tokens.length) {
        this.templateTokens = [...this.templateTokens, ...res.template_tokens];
      }
      this.tokens = this.templateTokens.map((e) => e.name);
    });
  }

  ngOnInit(): void {
    if (!this.inline) {
      this.mode = this.route.snapshot.params['mode'] || 'create';
      const id = this.route.snapshot.params['id'];

      if (id) {
        this.themeId = id;
      }
    }
    this.isLoading = true;
    if (this.themeId) {
      const materialsLen = this.storeService.materials.getValue()?.length;
      const loaders = [this.themeService.getTheme(this.themeId)];
      if (!materialsLen) {
        loaders.push(this.materialService.loadOwnImp());
      }
      combineLatest(loaders)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe((results) => {
          const themeRes = results[0];
          const materialsRes = results[1];
          if (themeRes && themeRes['data']) {
            this.handleThemeResponse(themeRes['data']);
          }
          if (materialsRes) {
            this.handleMaterialsResponse(materialsRes);
          } else {
            const materials = this.storeService.materials.getValue();
            this.handleMaterialsResponse(materials);
          }
        });
    } else {
      const materialsLen = this.storeService.materials.getValue()?.length;
      if (!materialsLen) {
        this.materialService
          .loadOwnImp()
          .pipe(finalize(() => (this.isLoading = false)))
          .subscribe((result) => {
            this.handleMaterialsResponse(result);
          });
      } else {
        const materials = this.storeService.materials.getValue();
        this.handleMaterialsResponse(materials);
        this.isLoading = false;
      }
    }
  }

  private handleThemeResponse(data) {
    if (!data) {
      return;
    }
    this.theme = data;
    this.options.templateId = data.template_id;
    this.json_content = data.json_content;
    this.html_content = data.html_content;
    if (this.mode === 'clone') {
      this.theme.title = '';
      this.theme.subject = '';
    }
    this.changeDetectorRef.detectChanges();
  }

  private handleMaterialsResponse(_materials) {
    if (!_materials) {
      return;
    }
    let materials = [];
    _materials.forEach((e) => {
      if (e.material_type !== 'folder') {
        materials.push(e);
      }
    });
    materials = _.uniqBy(materials, '_id');
    materials.sort((a, b) => {
      const aPrior = a.priority || 10000;
      const bPrior = b.priority || 10000;
      if (aPrior < bPrior) {
        return -1;
      }
      return 0;
    });
    this.options.tools[
      'custom#my_tool'
    ].properties.materialField.editor.data.options = materials;
    this.options.tools['custom#my_tool']['data'] = materials[0];
    const materialJson = {};
    materials.forEach((e) => {
      materialJson[e._id] = e;
    });
    const command = 'var materialJson = ' + JSON.stringify(materialJson) + ';';
    this.options.customJS.unshift(command);

    this.materials = materials;
    const videosLinks = [];
    const imagesLinks = [];
    const pdfsLinks = [];
    materials.forEach((e) => {
      if (e.material_type === 'video') {
        videosLinks.push({
          name: e.title,
          href: `{{material-object:${e._id}}}`,
          target: '_blank'
        });
      } else if (e.material_type === 'pdf') {
        pdfsLinks.push({
          name: e.title,
          href: `{{material-object:${e._id}}}`,
          target: '_blank'
        });
      } else if (e.material_type === 'image') {
        imagesLinks.push({
          name: e.title,
          href: `{{material-object:${e._id}}}`,
          target: '_blank'
        });
      }
    });
    this.materialLinks = [
      {
        name: 'crmgrow Videos',
        specialLinks: videosLinks
      },
      {
        name: 'crmgrow PDFs',
        specialLinks: pdfsLinks
      },
      {
        name: 'crmgrow Images',
        specialLinks: imagesLinks
      }
    ];
    this.options['specialLinks'] = this.materialLinks;
  }

  loadTemplate(id: string): void {
    this.isLoading = true;
    this.themeService.getTemplate(id).subscribe((res) => {
      this.isLoading = false;
      if (res && res['data']) {
        this.json_content = res['data'].design;
        // this.html_content = res['data'].html;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  editorLoaded(event: any): void {
    console.log('this.json content', this.json_content, this.materialLinks);
    if (this.theme.role !== 'admin') {
      setTimeout(() => {
        // if (this.options.templateId === undefined && this.html_content === '')
        //   return;

        this.emailEditor &&
          this.emailEditor.editor.loadDesign(this.json_content);
      }, 3000);
    }
  }

  saveDesign() {
    this.isSaving = true;
    this.emailEditor.editor.exportHtml(
      (async (data) => {
        this.json_content = data.design;
        const stringWidth = this.json_content['body'].values.contentWidth;
        const contentWidth = Number(
          stringWidth.substr(0, stringWidth.length - 2)
        );
        const contentHeight = (contentWidth * 24) / 16;
        this.html_content = data.html;
        const el = document.querySelector('#preview-thumbnail') as HTMLElement;
        el.style.width = String(contentWidth) + 'px';
        el.style.height = String(contentHeight) + 'px';
        el.style.overflow = 'hidden';
        el.innerHTML = this.html_content;
        const canvas = await html2canvas(el);
        const imgData = canvas.toDataURL();

        // Materials Information Collect
        let materials = this.getMaterials(this.html_content);
        materials = _.uniq(materials);
        const videos = this.materials.filter((e) => {
          return e.material_type === 'video' && materials.indexOf(e._id) !== -1;
        });
        const images = this.materials.filter((e) => {
          return e.material_type === 'image' && materials.indexOf(e._id) !== -1;
        });
        const pdfs = this.materials.filter((e) => {
          return e.material_type === 'pdf' && materials.indexOf(e._id) !== -1;
        });
        console.log('materials', materials);
        const videoIds = videos.map((e) => e._id);
        const pdfIds = pdfs.map((e) => e._id);
        const imageIds = images.map((e) => e._id);

        const themeData = {
          title: this.theme.title,
          subject: this.theme.subject,
          json_content: JSON.stringify(this.json_content),
          html_content: this.html_content,
          thumbnail: imgData,
          type: 'newsletter',
          videos: videoIds,
          pdfs: pdfIds,
          images: imageIds
        };
        if (this.mode == 'edit') {
          this.themeService
            .updateTheme(this.theme._id, themeData)
            .subscribe((res) => {
              if (res['status'] == true) {
                if (!this.inline) {
                  this.isSaving = false;
                  this.json_content = {};
                  this.html_content = '';
                } else {
                  this.onClosePage.emit({ ...themeData, _id: this.theme._id });
                }
                this.toastr.success(
                  'Newsletter template is saved Successfully'
                );
              }
            });
        } else {
          this.themeService.saveTheme(themeData).subscribe((res) => {
            if (res['status'] == true) {
              this.isSaving = false;
              this.json_content = {};
              this.html_content = '';
              this.toastr.success('Newsletter template is saved Successfully');
              if (!this.inline) {
                if (res.data && res.data._id) {
                  this.location.replaceState(
                    '/newsletter/edit/' + res.data._id
                  );
                  this.mode = 'edit';
                  this.theme._id = res.data._id;
                } else {
                  this.location.back();
                }
              } else {
                this.onClosePage.next(res['data']);
              }
            }
          });
        }
      }).bind(this)
    );
  }

  importDialog(): void {
    this.dialog
      .open(ImportTemplatesComponent, {
        width: '98vw',
        maxWidth: '800px',
        height: 'calc(65vh + 48px)'
      })
      .afterClosed()
      .subscribe((template) => {
        if (template && template.id) {
          this.loadTemplate(template.id);
        }
      });
  }

  goToBack(): void {
    if (!this.inline) {
      this.location.back();
    } else {
      this.onClosePage.next(null);
    }
  }

  getMaterials(html: string): any {
    const dom = document.createElement('div');
    const materials = [];
    dom.innerHTML = html;
    const materialDoms = dom.querySelectorAll('.material-object');
    materialDoms.forEach((e) => {
      const materialDom = <HTMLLinkElement>e;
      let href = materialDom.getAttribute('href');
      href = href.replace('{{', '');
      href = href.replace('}}', '');
      const material = href;
      materials.push(material);
    });

    const materialLinks = document.querySelectorAll(
      'a[href*="{{material-object:"]'
    );
    materialLinks.forEach((e) => {
      const materialDom = <HTMLLinkElement>e;
      let href = materialDom.getAttribute('href');
      href = href.replace('{{material-object:', '');
      href = href.replace('}}', '');
      const material = href;
      materials.push(material);
    });
    return materials;
  }

  setCursorPos(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.cursorEnd = field.selectionEnd;
    }
  }

  onSubjectTokenSelected(token): void {
    setTimeout(() => {
      this.theme.subject = this.theme.subject.replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
  }

  insertSubjectToken(value: string): void {
    const tokenValue = `{${value}}`;
    this.subjectEl.nativeElement.focus();
    this.subjectEl.nativeElement.setSelectionRange(
      this.cursorStart,
      this.cursorEnd
    );
    document.execCommand('insertText', false, tokenValue);
    this.cursorStart += tokenValue.length;
    this.cursorEnd = this.cursorStart;
    this.subjectEl.nativeElement.setSelectionRange(
      this.cursorStart,
      this.cursorEnd
    );
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
