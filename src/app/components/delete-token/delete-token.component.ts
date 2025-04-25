import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { TemplateToken } from '@utils/data.types';

@Component({
  selector: 'app-delete-token',
  templateUrl: './delete-token.component.html',
  styleUrls: ['./delete-token.component.scss']
})
export class DeleteTokenComponent implements OnInit {
  garbage: Garbage;
  deleteTokens: TemplateToken[] = [];
  isDeleting = false;
  isSubmitted = false;
  step = 1;
  failedData = [];
  status = {};
  garbageSubscription: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<DeleteTokenComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.deleteTokens) {
      this.step = 1;
      this.deleteTokens = [...this.data.deleteTokens];
      this.isSubmitted = false;
    }
  }

  ngOnInit(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        this.garbage = new Garbage().deserialize(garbage);
        if (
          !this.isSubmitted &&
          this.garbage &&
          this.garbage.template_tokens &&
          this.garbage.template_tokens.length
        ) {
          this.onDelete();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  onDelete(): void {
    this.isSubmitted = true;
    this.isDeleting = true;
    const ids = this.deleteTokens.map((e) => e.id);
    const tokens = this.garbage.template_tokens.filter(
      (e) => ids.indexOf(e.id) === -1
    );
    const updateData = { tokens: this.deleteTokens, template_tokens: tokens };
    this.userService.bulkRemoveToken(updateData).subscribe((res) => {
      this.isDeleting = false;
      if (res && res['status']) {
        delete updateData.tokens;
        if (res['data']) {
          updateData['template_tokens'] = res['data']['template_tokens'];
          this.failedData = res['data']['failed_data'];
          this.failedData.forEach((e) => {
            this.status[e.token.id] = false;
          });
          this.userService.updateGarbageImpl(updateData);
          this.step = 2;
        } else {
          this.userService.updateGarbageImpl(updateData);
          this.dialogRef.close(true);
        }
      }
    });
  }

  showDetails(item: any): void {
    this.status[item.token.id] = !this.status[item.token.id];
  }

  reasonTargetName(target): string {
    switch (target) {
      case 'templates':
        return 'Templates';
      case 'tasks':
        return 'Tasks';
      case 'automations':
        return 'Automations';
      case 'timelines':
        return 'TimeLines';
      case 'campaigns':
        return 'Campaigns';
      case 'material_themes':
        return 'Newsletters';
      default:
        return '';
    }
  }

  getTitle(target, value): string {
    if (
      target === 'templates' ||
      target === 'automations' ||
      target === 'campaigns' ||
      target === 'material_themes'
    ) {
      return value.title || '';
    } else if (target === 'tasks') {
      if (value.type === 'send_email') {
        return value.action.subject;
      } else {
        return value.action.content;
      }
    } else if (target === 'timelines') {
      if (value.type === 'text') {
        return value.action.content;
      } else {
        return value.action.subject;
      }
    }
    return '';
  }

  openReason(target, value): void {
    switch (target) {
      case 'templates':
        this.openTab(['/templates/edit/' + value._id]);
        break;
      case 'tasks':
        this.openTab(['/email-queue/' + value.process]);
        break;
      case 'automations':
        this.openTab(['/autoflow/edit/' + value._id]);
        break;
      case 'timelines':
        break;
      case 'campaigns':
        this.openTab(['/campaign/bulk/' + value._id]);
        break;
      case 'material_themes':
        this.openTab(['/newsletter/edit/' + value._id]);
        break;
      default:
    }
  }

  openTab(command): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(command));
    window.open(url, '_blank');
  }
}
