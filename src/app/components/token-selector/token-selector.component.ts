import { Component, Output, EventEmitter, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { TemplateToken } from '@utils/data.types';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { DEFAULT_TEMPLATE_TOKENS } from '@constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';
import { CreateTokenComponent } from '@components/create-token/create-token.component';
import { ToastrService } from 'ngx-toastr';
import { USER_FEATURES } from '@app/constants/feature.constants';
@Component({
  selector: 'app-token-selector',
  templateUrl: './token-selector.component.html',
  styleUrls: ['./token-selector.component.scss']
})
export class TokenSelectorComponent {
  readonly USER_FEATURES = USER_FEATURES;
  garbage: Garbage = new Garbage();
  garbageSubscription: Subscription;
  tokenSearchStr = '';
  templateTokens: TemplateToken[] = [];
  searchResult: TemplateToken[] = [];

  @Output() selectToken = new EventEmitter<{
    value: string;
    token: boolean;
  }>();
  constructor(
    private elRef: ElementRef,
    private dialog: MatDialog,
    public userService: UserService,
    private toastr: ToastrService
  ) {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      this.templateTokens = DEFAULT_TEMPLATE_TOKENS;
      const user = this.userService.profile.getValue();
      if (!user?.assignee_info?.is_enabled) {
        this.templateTokens = this.templateTokens.filter((token) => {
          return token.id < 10; // subtract assignee tokens
        });
      }
      if (this.garbage.template_tokens && this.garbage.template_tokens.length) {
        this.templateTokens = [
          ...this.templateTokens,
          ...this.garbage.template_tokens
        ];
      }
      this.searchResult = this.templateTokens;
    });
  }

  insertTextContentValue(value: string, token = false): void {
    this.selectToken.emit({ value: value, token: token });
  }

  createNewToken(): void {
    const materialDialog = this.dialog.open(CreateTokenComponent, {
      width: '100vw',
      maxWidth: '400px',
      data: {
        tokens: this.templateTokens
      }
    });
    materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res) {
        this.toastr.success('New token created successfully');
      }
    });
  }

  changeTokenSearchStr(): void {
    this.searchResult = [];
    if (this.tokenSearchStr) {
      this.templateTokens.forEach((e) => {
        if (e.name.toLowerCase().includes(this.tokenSearchStr.toLowerCase())) {
          this.searchResult.push(e);
        }
      });
    } else {
      this.searchResult = this.templateTokens;
    }
  }

  clearTokenSearchStr(): void {
    this.tokenSearchStr = '';
    this.changeTokenSearchStr();
  }

  toggleSearchFocus(isOpened: boolean) {
    console.log('isOpened');
    if (isOpened) {
      setTimeout(() => {
        const element = <HTMLElement>(
          this.elRef.nativeElement.querySelector('[name="search"]')
        );
        element && element.focus();
      }, 100);
    }
  }
}
