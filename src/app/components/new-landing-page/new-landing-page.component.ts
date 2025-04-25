import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-new-landing-page',
  templateUrl: './new-landing-page.component.html',
  styleUrls: ['./new-landing-page.component.scss']
})
export class NewLandingPageComponent implements OnInit {
  submitted = false;
  siteName: string;
  selectedTemplate: string;
  templates: any[];

  constructor(
    private dialogRef: MatDialogRef<NewLandingPageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.templates = this.data;
  }

  ngOnInit(): void {}

  selectTemplate(template): void {
    this.selectedTemplate = template.id;
  }

  createSite(): void {
    this.submitted = true;
    if (!this.siteName && !this.selectedTemplate) {
      return;
    }
    this.dialogRef.close({
      name: this.siteName,
      template: this.selectedTemplate
    });
  }
}
