import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Contact } from '@app/models/contact.model';
import { Action } from '@app/enums/sphere-action.enum';
import { SphereService } from '@app/services/sphere.service';
import { Subject, takeUntil } from 'rxjs';
import { ListType } from '@app/enums/sphere-list.enum';
import moment from 'moment-timezone';
import { IBucket } from '@app/types/buckete';
import { Router } from '@angular/router';

@Component({
  selector: 'app-conversation-item',
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss']
})
export class ConversationItemComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();
  readonly Action = Action;
  private _buckets: IBucket[] = [];
  private _contact: Contact;
  readonly SCORES = ['', 'No', 'Maybe', 'Yes'];
  isCompleted = false;

  @Output() action = new EventEmitter<Action>();

  @Input() type: ListType;
  @Input()
  set contact(val: Contact) {
    this._contact = val;
  }

  get contact(): Contact {
    return this._contact;
  }

  get bucket(): IBucket {
    return this._buckets.find((e) => e._id === this._contact.sphere_bucket_id);
  }

  get lastContactAt(): Date {
    const contactedAt = new Date(this._contact.contacted_at || 0).getTime();
    const updatedAt = new Date(this._contact.updated_at || 0).getTime();
    const max = Math.max(contactedAt, updatedAt);
    return new Date(max);
  }

  get isMissed(): boolean {
    if (this.type === ListType.ACTIVE) {
      const emailLimitDate = moment()
        .clone()
        .subtract(this.bucket?.duration || 0, 'days')
        .startOf('day')
        .toDate();
      if (new Date(this._contact.contacted_at) > emailLimitDate) {
        return false;
      }
      return true;
    }
    return false;
  }

  get actions(): Action[] {
    if (this.type === ListType.ACTIVE) {
      const actions = [];
      const contactLimitDate = moment()
        .clone()
        .subtract((this.bucket?.duration || 0) + 4, 'days')
        .startOf('day')
        .toDate();
      if (
        new Date(this._contact.contacted_at) > contactLimitDate &&
        this._contact.email
      ) {
        actions.push(Action.EMAIL);
      }
      if (
        new Date(this._contact.contacted_at) > contactLimitDate &&
        this._contact.cell_phone
      ) {
        actions.push(Action.CALL);
      }

      if (
        new Date(this._contact.contacted_at) > contactLimitDate &&
        this._contact.cell_phone
      ) {
        actions.push(Action.TEXT);
      }
      return actions;
    } else if (this.type === ListType.MISSED) {
      const actions = [];
      const contactLimitDate = moment()
        .clone()
        .subtract((this.bucket?.duration || 0) + 5, 'days')
        .endOf('day')
        .toDate();
      if (
        new Date(this._contact.contacted_at) < contactLimitDate &&
        this._contact.email
      ) {
        actions.push(Action.EMAIL);
      }
      if (
        new Date(this._contact.contacted_at) < contactLimitDate &&
        this._contact.cell_phone
      ) {
        actions.push(Action.CALL);
      }
      if (
        new Date(this._contact.contacted_at) < contactLimitDate &&
        this._contact.cell_phone
      ) {
        actions.push(Action.TEXT);
      }
      return actions;
    } else {
      const actions = [];
      if (this._contact.email) {
        actions.push(Action.EMAIL);
      }
      if (this._contact.cell_phone) {
        actions.push(Action.CALL);
        actions.push(Action.TEXT);
      }
      return actions;
    }
  }

  constructor(public router: Router, private sphereService: SphereService) {}

  ngOnInit(): void {
    this.sphereService.buckets$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this._buckets = data;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }

  markAsComplete(): void {
    this.sphereService
      .markAsCompleted({
        id: this._contact._id,
        actions: this.actions?.length
          ? this.actions
          : [Action.EMAIL, Action.CALL, Action.TEXT]
      })
      .subscribe((res) => {
        if (res) {
          this.isCompleted = true;
          setTimeout(() => {
            this.action.emit(Action.COMPLETE);
          }, 2000);
        }
      });
  }

  doAction(action: Action): void {
    this.action.emit(action);
  }

  /**
   * Open the contact detail page
   * @param contact : contact
   */
  openContact(contact: Contact): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }
}
