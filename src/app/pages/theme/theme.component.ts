import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailEditorComponent } from 'angular-email-editor';
import { ThemeService } from '@services/theme.service';
import { UnlayerThemeId } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss']
})
export class ThemeComponent implements OnInit {
  submitted = false;
  isLoading = false;
  saving = false;

  options = {
    projectId: UnlayerThemeId,
    templateId: undefined,
    customJS: ['http://127.0.0.1:3000/customTool/crmgrow_video.js']
  };
  theme = {
    created_at: '',
    project_id: UnlayerThemeId,
    role: '',
    template_id: '',
    thumbnail: '',
    title: '',
    updated_at: '',
    user: '',
    _id: ''
  };

  json_content = {};
  html_content = '';
  mode = '';
  @ViewChild('editor') emailEditor: EmailEditorComponent;

  constructor(
    private route: ActivatedRoute,
    private themeService: ThemeService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.mode = this.route.snapshot.params['mode'];
    if (id) {
      this.loadTheme(id);
    }
  }

  loadTheme(id: string): void {
    this.isLoading = true;
    this.themeService.getTheme(id).subscribe(
      (res) => {
        if (res['status'] == true) {
          this.theme = res['data'];
          this.options.templateId = res['data'].template_id;
          this.json_content = res['data'].json_content;
          this.html_content = res['data'].html_content;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      },
      (err) => {
        this.isLoading = false;
      }
    );
  }

  editorLoaded(event: any): void {
    if (this.theme.role !== 'admin') {
      setTimeout(() => {
        if (this.options.templateId === undefined && this.html_content === '')
          return;

        this.emailEditor &&
          this.emailEditor.editor.loadDesign(this.json_content);
      }, 500);
    }
  }

  saveDesign(): void {
    this.saving = true;
    this.emailEditor.editor.exportHtml(
      (async (data) => {
        this.json_content = data.design;
        const stringWidth = this.json_content['body'].values.contentWidth;
        const contentWidth = Number(
          stringWidth.substr(0, stringWidth.length - 2)
        );
        const contentHeight = (contentWidth * 9) / 16;
        this.html_content = data.html;
        const el = document.querySelector('#preview-thumbnail') as HTMLElement;
        el.style.width = String(contentWidth) + 'px';
        el.style.height = String(contentHeight) + 'px';
        el.style.overflow = 'hidden';
        el.innerHTML = this.html_content;
        const canvas = await html2canvas(el);
        const imgData = canvas.toDataURL();
        const themeData = {
          title: this.theme.title,
          json_content: JSON.stringify(this.json_content),
          html_content: this.html_content,
          thumbnail: imgData
        };
        if (this.mode == 'edit') {
          this.themeService
            .updateTheme(this.theme._id, themeData)
            .subscribe((res) => {
              if (res['status'] == true) {
                this.saving = false;
                this.json_content = {};
                this.html_content = '';
                // this.toast.success('Theme Saved Successfully');
              }
            });
        } else {
          this.themeService.saveTheme(themeData).subscribe((res) => {
            if (res['status'] == true) {
              this.saving = false;
              this.json_content = {};
              this.html_content = '';
              // this.toast.success('Theme Saved Successfully');
            }
          });
        }
      }).bind(this)
    );
  }
}
