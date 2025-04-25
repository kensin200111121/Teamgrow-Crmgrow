import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AssistantCreateComponent } from '@components/assistant-create/assistant-create.component';
import { AssistantPasswordComponent } from '@components/assistant-password/assistant-password.component';
import { AssistantRemoveComponent } from '@components/assistant-remove/assistant-remove.component';
import { DialogSettings } from '@constants/variable.constants';
import { Guest } from '@models/guest.model';
import { GuestService } from '@services/guest.service';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.scss']
})
export class AssistantComponent implements OnInit, OnDestroy {
  guests: Guest[] = [];
  loading = false;
  toggling = false;
  limitInfo = {
    is_limit: true,
    max_count: 1
  };
  profileSubscription: Subscription;

  constructor(
    private guestService: GuestService,
    private userService: UserService,
    private dialog: MatDialog,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadGuests();

    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user.assistant_info) {
        this.limitInfo = user.assistant_info;
      }
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  /**
   * Load Guests
   */
  loadGuests(): void {
    this.loading = true;
    this.guestService.loadGuests().subscribe(
      (guests) => {
        this.loading = false;
        this.guests = guests;
      },
      () => {
        this.loading = false;
      }
    );
  }

  /**
   * Open Create Dialog
   */
  openCreateDialog(): void {
    this.dialog
      .open(AssistantCreateComponent, {
        ...DialogSettings.ASSISTANT
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // this.toast.success('New Assistant successfully created.');
          this.guests.push(res);
        }
      });
  }

  /**
   * Open delete Dialog & clean list after success
   */
  openDeleteDialog(guest: Guest): void {
    this.dialog
      .open(AssistantRemoveComponent, {
        ...DialogSettings.CONFIRM,
        data: guest
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.guests.some((e, index) => {
            if (e._id === guest._id) {
              this.guests.splice(index, 1);
            }
          });
          // this.toast.success('Assistant successfully deleted.');
        }
      });
  }

  /**
   * Open password edit dialog
   */
  openPasswordEditDialog(guest: Guest): void {
    this.dialog.open(AssistantPasswordComponent, {
      ...DialogSettings.ASSISTANT,
      data: guest
    });
  }

  /**
   *
   */
  toggleAssistant(guest: Guest): void {
    const status = guest.disabled;
    guest.disabled = !status;
    this.toggling = true;
    this.guestService.update(guest._id, guest).subscribe(
      () => {
        this.toggling = false;
        if (!guest.disabled) {
          // this.toast.success('Assistant successfully enabled.');
        } else {
          // this.toast.success('Assistant successfully disabled.');
        }
      },
      () => {
        this.toggling = false;
        guest.disabled = status;
      }
    );
  }
}
