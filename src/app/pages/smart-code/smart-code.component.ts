import { SspaService } from '../../services/sspa.service';
import _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import {
  DialogSettings,
  STATUS,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { SmartCodeAddComponent } from '@components/smart-code-add/smart-code-add.component';
import { Garbage } from '@models/garbage.model';
import { SmartCode } from '@models/smart-code.model';
import { Subscription } from 'rxjs';
import { KEY } from '@constants/key.constant';
import { User } from '@models/user.model';
import { AddPhoneComponent } from '@components/add-phone/add-phone.component';
import { Router } from '@angular/router';
import { JSONParser } from '@utils/functions';
import { SmsSubscribeComponent } from '@app/components/sms-subscribe/sms-subscribe.component';

@Component({
  selector: 'app-smart-code',
  templateUrl: './smart-code.component.html',
  styleUrls: ['./smart-code.component.scss']
})
export class SmartCodeComponent implements OnInit {
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  DISPLAY_COLUMNS = [
    'smart_code',
    'tags',
    'message',
    'twilio',
    'materials',
    'automation',
    'actions'
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  STATUS = STATUS;

  garbage: Garbage = new Garbage();

  smartCodes: SmartCode[] = [];
  selection: SmartCode[] = [];
  filteredCodes: SmartCode[] = [];
  searchStr = '';

  pageSelection: SmartCode[] = [];
  pageSize = this.PAGE_COUNTS[3];
  page = 1;

  loadSubscription: Subscription;
  user: User = new User();

  constructor(
    public userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    public sspaService: SspaService
  ) {
    this.userService.loadSmartCodes();

    const page = localStorage.getCrmItem(KEY.SMART_CODE.PAGE);
    const pageSize = localStorage.getCrmItem(KEY.SMART_CODE.PAGE_SIZE);
    if (page) {
      this.page = parseInt(page);
    }
    if (pageSize) {
      const parsedPageSize = JSONParser(pageSize);
      if (parsedPageSize) {
        this.pageSize = parsedPageSize;
      }
    }

    this.userService.garbage$.subscribe((res) => {
      if (res._id) {
        this.garbage = res;
      }
    });
  }

  ngOnInit(): void {
    this.userService.profile$.subscribe((user) => {
      this.user = user;
    });

    this.loadSmartCodes();
  }

  loadSmartCodes(): void {
    this.userService.loadSmartCodes();
    this.userService.smartCodes$.subscribe((data) => {
      this.smartCodes = (data || []).map((e) => {
        return new SmartCode().deserialize(e);
      });
      this.filter();
    });
  }

  changePage(page: number): void {
    this.page = page;
    localStorage.setCrmItem(KEY.SMART_CODE.PAGE, page + '');
  }

  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    this.pageSize = type;
    localStorage.setCrmItem(KEY.SMART_CODE.PAGE_SIZE, JSON.stringify(type));
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }

  filter(): void {
    this.selection = [];
    const words = _.uniqBy(
      this.searchStr.split(' ').sort((a, b) => (a.length > b.length ? -1 : 1)),
      (e) => e.toLowerCase()
    );
    const reg = new RegExp(words.join('|'), 'gi');
    this.filteredCodes = this.smartCodes.filter((smartCode) => {
      if (
        this.searchStr &&
        words.length &&
        _.uniqBy((smartCode.code || '').match(reg), (e) => e.toLowerCase())
          .length !== words.length
      ) {
        return false;
      }
      return true;
    });
  }

  openSmartCode(code: SmartCode): void {}
  addPhone(): void {
    this.dialog
      .open(SmsSubscribeComponent, {
        width: '90vw',
        maxWidth: '720px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        console.log(res);
      });
  }

  addSmartCode(): void {
    this.dialog
      .open(SmartCodeAddComponent, {
        data: {
          garbage: this.garbage
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['data']) {
          this.loadSmartCodes();
        }
      });
  }

  checkSmartCodeEnable(): void {
    if (
      this.user?.proxy_number ||
      this.user?.twilio_number ||
      this.user?.wavv_number
    ) {
      this.addSmartCode();
    } else {
      this.addPhone();
    }
  }

  editSmartCode(code: SmartCode): void {
    this.dialog
      .open(SmartCodeAddComponent, {
        data: {
          garbage: this.garbage,
          smartCode: code
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['data'] && res['code']) {
          const newSmartCode = new SmartCode().deserialize(res['data']);
          this.smartCodes.some((e, index) => {
            if (e.code === res['code']) {
              this.smartCodes.splice(index, 1, newSmartCode);
            }
          });
          this.filter();
        }
      });
  }

  deleteSmartCode(smartCode: SmartCode): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete Smart Code',
        message: 'Are you sure you want to delete this smart code?',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        const smart_codes = this.garbage.smart_codes;
        if (smartCode && smartCode.code) {
          delete smart_codes[smartCode.code];
          this.userService
            .updateGarbage({
              smart_codes
            })
            .subscribe((status) => {
              if (status) {
                const index = this.smartCodes.findIndex(
                  (e) => e.code === smartCode.code
                );
                this.smartCodes.splice(index, 1);
                this.filter();
                // this.toast.success('Smart code is deleted successfully.');
              }
            });
        }
      }
    });
  }
}
