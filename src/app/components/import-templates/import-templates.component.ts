import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ThemeService } from '@services/theme.service';

@Component({
  selector: 'app-import-templates',
  templateUrl: './import-templates.component.html',
  styleUrls: ['./import-templates.component.scss']
})
export class ImportTemplatesComponent implements OnInit, OnDestroy {
  constructor(
    private dialogRef: MatDialogRef<ImportTemplatesComponent>,
    private themeService: ThemeService
  ) {}

  templates = [];
  templateLoadSubscription: Subscription;
  loadingSubscription: Subscription;
  loading = false;
  hasMore = true;

  ngOnInit(): void {
    this.templateLoadSubscription = this.themeService.templates$.subscribe(
      (templates) => {
        if (templates && templates.length) {
          this.templates = templates;
        } else {
          this.loading = true;
          this.themeService.getStandarTemplates(1, 20).subscribe((res) => {
            this.loading = false;
            if (res && res['data']) {
              const loaded = res['data'] || [];
              if (loaded.length < 20) {
                this.hasMore = false;
              } else {
                this.hasMore = true;
              }
              this.templates = loaded;
            } else {
              this.hasMore = false;
            }
          });
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.templateLoadSubscription &&
      this.templateLoadSubscription.unsubscribe();
    this.themeService.templates.next(this.templates);
  }

  start(template): void {
    this.dialogRef.close(template);
  }

  loadMore(): void {
    this.loading = true;
    this.themeService
      .getStandarTemplates(1 + this.templates.length / 20, 20)
      .subscribe((res) => {
        this.loading = false;
        if (res && res['data']) {
          const loaded = res['data'] || [];
          if (loaded.length < 20) {
            this.hasMore = false;
          } else {
            this.hasMore = true;
          }
          this.templates = [...this.templates, ...loaded];
        } else {
          this.hasMore = false;
        }
      });
  }
}
