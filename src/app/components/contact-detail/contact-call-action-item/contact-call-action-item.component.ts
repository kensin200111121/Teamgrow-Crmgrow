import { Component, Input } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { StoreService } from '@app/services/store.service';
import { UserService } from '@app/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { DialerCallComponent } from '@components/dialer-call/dialer-call.component';
import { DialogSettings } from '@constants/variable.constants';
import { ElementRef, ViewChild } from '@angular/core';
import { DialerService } from '@services/dialer.service';
import { ContactActionService } from '@app/services/contact-action.service';
import { SspaService } from '../../../services/sspa.service';
import { environment } from '@environments/environment';
@Component({
  selector: 'app-contact-call-action-item',
  templateUrl: './contact-call-action-item.component.html',
  styleUrls: ['./contact-call-action-item.component.scss']
})
export class ContactCallActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'phone_log';
  @Input() protected contactId: string;
  @Input() activity: ContactActivityActionV2;
  @Input() isPending: boolean;

  tab = { icon: '', label: 'Calls', id: 'phone_log' };
  // Call Log Recording Play
  recordingData = {};
  loadingRecord = false;
  selectedRecord = '';
  playingRecord = false;
  currentPlayTime = 0;
  @ViewChild('audioRef') recordAudio: ElementRef;
  callLabel = ''; // call label
  isSspa = environment.isSspa;

  constructor(
    private dialog: MatDialog,
    protected contactDetailInfoService: ContactDetailInfoService,
    public userService: UserService,
    private dialerService: DialerService,
    private contactActionService: ContactActionService,
    public sspaService: SspaService
  ) {
    super();
  }

  editCallComment(phone_log): void {
    this.dialog
      .open(DialerCallComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          call: phone_log
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.status && res.data) {
          phone_log.rating = res.data.rating || 0;
          phone_log.content = res.data.content;
          phone_log.label = res.data.label;
          this.getLatestCallLabel();
        }
      });
  }

  getLatestCallLabel(): void {}

  openCall(): void {
    this.contactActionService.openCall();
  }

  openSendText(): void {
    this.contactActionService.openSendText();
  }

  downloadRecord(record, event): void {
    const downloadBtn = event.target.closest('.download-btn');
    if (!downloadBtn) {
      return;
    }
    downloadBtn.classList.add('downloading');
    const dom = document.createElement('a');
    dom.download = 'recording.mp3';
    if (this.recordingData[record]) {
      const url = this.recordingData[record];
      fetch(url)
        .then((r) => {
          r.blob()
            .then((blob) => {
              const dUrl = window.URL.createObjectURL(blob);
              dom.href = dUrl;
              dom.click();
              downloadBtn.classList.remove('downloading');
            })
            .catch((err) => {
              alert(
                'Downloading call recorded material is failed.' + err.message
              );
              downloadBtn.classList.remove('downloading');
            });
        })
        .catch((err) => {
          alert('Downloading call recorded material is failed.' + err.message);
          downloadBtn.classList.remove('downloading');
        });
    } else {
      this.dialerService.loadRecording(record).subscribe((res) => {
        if (res.status && res.data && res.data.url) {
          const url = res.data.url;
          fetch(url)
            .then((r) => {
              r.blob()
                .then((blob) => {
                  const dUrl = window.URL.createObjectURL(blob);
                  dom.href = dUrl;
                  dom.click();
                  downloadBtn.classList.remove('downloading');
                })
                .catch((err) => {
                  alert(
                    'Downloading call recorded material is failed.' +
                      err.message
                  );
                  downloadBtn.classList.remove('downloading');
                });
            })
            .catch((err) => {
              alert(
                'Downloading call recorded material is failed.' + err.message
              );
              downloadBtn.classList.remove('downloading');
            });
        } else {
          downloadBtn.classList.remove('downloading');
        }
      });
    }
  }

  pauseRecording(): void {
    this.playingRecord = false;
    this.recordAudio.nativeElement.pause();
  }

  resumeRecording(): void {
    this.playingRecord = true;
    this.recordAudio.nativeElement.play();
  }

  playRecording(record): void {
    this.selectedRecord = record;
    if (this.recordingData[record]) {
      setTimeout(() => {
        this.playingRecord = true;
        this.loadingRecord = false;
        this.recordAudio.nativeElement.src = this.recordingData[record];
      }, 1000);
    } else {
      this.loadingRecord = true;
      this.dialerService.loadRecording(record).subscribe((res) => {
        if (res.status && res.data && res.data.url) {
          this.loadingRecord = false;
          this.playingRecord = true;
          this.recordAudio.nativeElement.src = res.data.url;
          this.recordingData[record] = res.data.url;
        } else {
          this.selectedRecord = '';
        }
      });
    }
  }
}
