import { Component, Inject, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { LeadForm } from '@app/models/lead-form.model';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-create-embeded-form',
  templateUrl: './create-embeded-form.component.html',
  styleUrls: ['./create-embeded-form.component.scss']
})
export class CreateEmbededFormComponent implements OnInit {
  get htmlCode(): string {
    return `<iframe style="border: none; width: 100%; height: 100%;" src='${environment.website}/embeded-form/${this.data._id}'></iframe>`;
  }

  get scriptCode(): string {
    return `<script src="${environment.website}/embed_lead_form.js?env=${environment.envMode}"></script>`;
  }

  get styleCode(): string {
    return `<link href="your custom style link" name="crmgrow-lead-form"></link><style name="crmgrow-lead-form">// here custom style</style>`;
  }

  get styleDemoCode(): string {
    return `<link href="//please insert the url of the custom style for the form" name="crmgrow-lead-form"></link>\n\n<style name="crmgrow-lead-form">\n// Or please insert the custom styles here.\n</style>`;
  }

  isExpended = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: LeadForm,
    private clipboard: Clipboard,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {}

  copyHTMLCode(): void {
    this.clipboard.copy(this.htmlCode);
    this.toast.success('Copied the embed html(iframe) code');
  }

  copyScriptCode(): void {
    this.clipboard.copy(this.scriptCode);
    this.toast.success('Copied the script code');
  }

  copyStyleCode(): void {
    this.clipboard.copy(this.styleCode);
    this.toast.success('Copied the style code');
  }
}
