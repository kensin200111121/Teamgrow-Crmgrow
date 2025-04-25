import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CreateTokenComponent } from '@components/create-token/create-token.component';
import { DeleteTokenComponent } from '@components/delete-token/delete-token.component';
import {
  BulkActions,
  DEFAULT_TEMPLATE_TOKENS,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { TemplateToken } from '@utils/data.types';

@Component({
  selector: 'app-token-manager',
  templateUrl: './token-manager.component.html',
  styleUrls: ['./token-manager.component.scss']
})
export class TokenManagerComponent implements OnInit {
  readonly MIN_ROW_COUNT = MIN_ROW_COUNT;
  templateTokens: TemplateToken[] = [];
  selectedTokens: TemplateToken[] = [];
  PAGE_COUNTS = [
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[0];
  page = 1;
  isLoading = true;
  actions = BulkActions.TokenManager;
  disabledActions = [];

  garbageSubscription: Subscription;
  @Input('showTitle') showTitle = true;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        this.isLoading = false;
        this.selectedTokens = [];
        if (garbage.template_tokens && garbage.template_tokens.length) {
          this.templateTokens = [...garbage.template_tokens];
        }
      }
    );
    const pageSize = this.userService.tokenPageSize.getValue();
    if (pageSize) {
      this.pageSize = { id: pageSize, label: pageSize + '' };
    } else {
      this.pageSize = this.PAGE_COUNTS[0];
    }
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
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

  onEditToken(token: TemplateToken): void {
    this.dialog
      .open(CreateTokenComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          tokens: this.templateTokens,
          editToken: token
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.toastr.success('Token updated successfully');
        }
      });
  }

  onDeleteToken(token: TemplateToken): void {
    this.onDeleteTokens([token]);
  }

  onDeleteTokens(tokens: TemplateToken[]): void {
    this.dialog
      .open(DeleteTokenComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          deleteTokens: [...tokens]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.toastr.success('Tokens removed successfully');
        }
      });
  }

  isPartialSelected(): boolean {
    return this.selectedTokens.length > 0;
  }

  isAllSelected(): boolean {
    return (
      this.templateTokens.length -
        DEFAULT_TEMPLATE_TOKENS.length -
        this.selectedTokens.length ===
      0
    );
  }

  isAllSelectedPage(): boolean {
    const start = (this.page - 1) * this.pageSize.id;
    const end = this.page * this.pageSize.id;
    const pageTokens = this.templateTokens.slice(start, end);

    if (!pageTokens.length) return false;

    for (const token of pageTokens) {
      if (!token.default && !this.isSelected(token)) return false;
    }
    return true;
  }

  isSelected(token: TemplateToken): boolean {
    const index = this.selectedTokens.findIndex((t) => t.id === token.id);
    return index > -1;
  }

  onSelect(token: TemplateToken): void {
    const index = this.selectedTokens.findIndex((e) => e.id === token.id);
    if (index > -1) {
      this.selectedTokens.splice(index, 1);
    } else {
      this.selectedTokens.push(token);
    }
    this.onUpdateBulkAction();
  }

  onSelectAllPage(): void {
    const isAllSelectedPage = this.isAllSelectedPage();
    const start = (this.page - 1) * this.pageSize.id;
    const end = this.page * this.pageSize.id;
    if (isAllSelectedPage) {
      this.templateTokens.slice(start, end).forEach((token) => {
        if (this.isSelected(token)) {
          this.selectedTokens = this.selectedTokens.filter(
            (e) => e.id !== token.id
          );
        }
      });
    } else {
      this.templateTokens.slice(start, end).forEach((token) => {
        if (!this.isSelected(token) && !token.default) {
          this.selectedTokens.push(token);
        }
      });
    }
    this.onUpdateBulkAction();
  }

  onSelectAll(): void {
    this.templateTokens.forEach((token) => {
      if (!this.isSelected(token) && !token.default) {
        this.selectedTokens.push(token);
      }
    });
    this.onUpdateBulkAction();
  }

  onDeselect(): void {
    this.selectedTokens = [];
    this.onUpdateBulkAction();
  }

  onAction($event): void {
    switch ($event.command) {
      case 'edit':
        this.onEditToken(this.selectedTokens[0]);
        break;
      case 'delete':
        this.onDeleteTokens(this.selectedTokens);
        break;
      case 'select':
        this.onSelectAll();
        break;
      case 'deselect':
        this.onDeselect();
        break;
      default:
        return;
    }
  }

  onChangePage(page: number): void {
    this.page = page;
  }

  onChangePageSize(type): void {
    this.pageSize = type;
    this.userService.tokenPageSize.next(this.pageSize.id);
  }

  onUpdateBulkAction(): void {
    this.disabledActions = [];
    if (this.selectedTokens.length > 0) {
      if (this.selectedTokens.length > 1) {
        this.disabledActions.push({
          label: 'Edit',
          type: 'button',
          icon: 'i-edit',
          command: 'edit'
        });
      }
      if (this.isAllSelected()) {
        this.disabledActions.push({
          label: 'Select all',
          type: 'button',
          command: 'select'
        });
      }
    }
  }

  getTokenValue(token: TemplateToken): string {
    if (token.value) {
      return token.value;
    } else if (token.match_field) {
      return `contact.${token.match_field}`;
    }
    return '';
  }
}
