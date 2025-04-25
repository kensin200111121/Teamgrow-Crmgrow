import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConnectService } from '@services/connect.service';
import { UserService } from '@services/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Garbage } from '@models/garbage.model';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-calendly-list',
  templateUrl: './calendly-list.component.html',
  styleUrls: ['./calendly-list.component.scss']
})
export class CalendlyListComponent implements OnInit {
  loading = false;
  calendlyList = [];
  calendlyKey = '';
  garbageSubscription: Subscription;
  garbage: Garbage = new Garbage();

  constructor(
    private dialogRef: MatDialogRef<CalendlyListComponent>,
    private userService: UserService,
    private connectService: ConnectService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    this.calendlyKey = this.data.key;
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.connectService
      .getEvent()
      .pipe(
        map((res) => res),
        catchError((error) => {
          this.loading = false;
          return of([]);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.loading = false;
          this.calendlyList = [...this.calendlyList, ...res['data']];
          if (!this.calendlyKey) {
            this.calendlyList.forEach((calendly) => {
              calendly.selectStatus = false;
            });
          } else {
            this.calendlyList.forEach((calendly) => {
              if (calendly.uri == this.calendlyKey) {
                calendly.selectStatus = true;
              } else {
                calendly.selectStatus = false;
              }
            });
          }
        }
      });
  }

  setEvent(index: number): void {
    const eventType = this.calendlyList[index];
    const { uri: id, scheduling_url: link } = eventType;
    const calendly = { id, link };
    this.connectService.setEvent(calendly).subscribe((res) => {
      if (res && res['status']) {
        this.garbage.calendly.link = link;
        this.garbage.calendly.id = id;
        // this.toast.success('Event is selected successfully.');
        this.userService.updateGarbageImpl(this.garbage);
        this.dialogRef.close();
      }
    });
  }
}
