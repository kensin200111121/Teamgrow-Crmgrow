import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LANG_OPTIONS } from '@constants/variable.constants';
import { Lang } from '@models/dataType';
import { LangService } from '@services/lang.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  languages: Lang[] = LANG_OPTIONS;
  selectedLanguage: Lang = null;
  languageSubscription: Subscription;

  constructor(private langService: LangService) {}

  ngOnInit(): void {
    this.languageSubscription && this.languageSubscription.unsubscribe();
    this.languageSubscription = this.langService.language$.subscribe(
      (code: string) => {
        LANG_OPTIONS.some((e: Lang) => {
          if (e.code === code) {
            this.selectedLanguage = e;
            return true;
          }
          return false;
        });
      }
    );
  }

  ngOnDestroy(): void {
    this.languageSubscription && this.languageSubscription.unsubscribe();
  }

  /**
   * Change the Language
   */
  changeLang(lang: Lang): void {
    this.langService.changeLang(lang.code);
  }
}
