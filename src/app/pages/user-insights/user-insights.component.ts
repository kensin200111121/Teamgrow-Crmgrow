import { SspaService } from '../../services/sspa.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FileUploader } from 'ng2-file-upload';
import { CountryISO } from 'ngx-intl-tel-input';
import { ToastrService } from 'ngx-toastr';
import { AvatarEditorComponent } from '@components/avatar-editor/avatar-editor.component';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { SelectCompanyComponent } from '@components/select-company/select-company.component';
import {
  COMPANIES,
  INDUSTRIES,
  PHONE_COUNTRIES,
  ROLES,
  TIMEZONE
} from '@constants/variable.constants';
import { HelperService } from '@services/helper.service';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-user-insights',
  templateUrl: './user-insights.component.html',
  styleUrls: ['./user-insights.component.scss']
})
export class UserInsightsComponent implements OnInit {
  step = 1;
  useTypes = [
    { type: 'stay_top', label: 'Stay top of mind', image: 'image 1' },
    { type: 'marketing', label: 'Manage our marketing', image: 'image 2' },
    { type: 'deal', label: 'Close Deals', image: 'image 3' },
    { type: 'sale', label: 'Increase Sales', image: 'image 4' },
    { type: 'audience', label: 'Increase my audience', image: 'image 5' },
    {
      type: 'prospect',
      label: 'Reach my prospects at the right moment',
      image: 'image 6'
    }
  ];
  industries = INDUSTRIES;
  roles = ROLES;
  selectIndustries = [];
  selectRoles = [];
  selectedType = '';
  otherType = '';
  picture_profile;
  name = '';
  userEmail = '';
  phoneNumber = {};
  userCompany = '';
  website = '';
  timezone = '';
  address = '';
  timezones = TIMEZONE;
  companies = COMPANIES;
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  defaultTimeZone = true;
  public uploader: FileUploader = new FileUploader({
    url: environment.api + 'file',
    authToken: this.userService.getToken(),
    itemAlias: 'photo'
  });

  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  constructor(
    private userService: UserService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private router: Router,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  setType(type: string): void {
    this.selectedType = type;
  }

  changeType(evt: any, type: string): void {
    evt.target.checked = true;
    this.selectedType = type;
  }

  skip(): void {
    this.router.navigate(['/home']);
  }

  next(): void {
    this.step++;
  }

  back(): void {
    this.step--;
  }

  finish(): void {}

  selectIndustry(industry: string): void {
    if (this.selectIndustries.indexOf(industry) === -1) {
      this.selectIndustries.push(industry);
    } else {
      const pos = this.selectIndustries.indexOf(industry);
      this.selectIndustries.splice(pos, 1);
    }
  }

  selectRole(role: string): void {
    if (this.selectRoles.indexOf(role) === -1) {
      this.selectRoles.push(role);
    } else {
      const pos = this.selectRoles.indexOf(role);
      this.selectRoles.splice(pos, 1);
    }
  }

  openProfilePhoto(): void {
    this.helperService
      .promptForFiles('image/jpg, image/png, image/jpeg, image/webp, image/bmp')
      .then((files) => {
        const file: File = files[0];
        const type = file.type;
        const validTypes = [
          'image/jpg',
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/bmp'
        ];
        if (validTypes.indexOf(type) === -1) {
          this.toast.warning('Unsupported File Selected.');
          return;
        }
        const imageEditor = this.dialog.open(AvatarEditorComponent, {
          width: '98vw',
          maxWidth: '400px',
          disableClose: true,
          data: {
            fileInput: file
          }
        });
        imageEditor.afterClosed().subscribe((res) => {
          if (res != false && res != '') {
            if (res == null) {
              this.picture_profile = '';
            } else {
              this.setProfileImage(res);
            }
          }
        });
      })
      .catch((err) => {
        this.toast.error('File Select', err);
      });
  }

  setProfileImage(evt: any): void {
    this.picture_profile = evt;
    this.urltoFile(evt, 'profile.jpg', 'image/jpeg').then((file) => {
      this.uploader.addToQueue([file]);
      this.uploader.uploadAll();
    });
  }

  urltoFile(url: any, filename: string, mimeType: string): any {
    mimeType = mimeType || (url.match(/^data:([^;]+);/) || '')[1];
    return fetch(url)
      .then(function (res) {
        return res.arrayBuffer();
      })
      .then(function (buf) {
        let returnFile;
        try {
          returnFile = new File([buf], filename, { type: mimeType });
        } catch {
          const blob = new Blob([buf], { type: mimeType });
          Object.assign(blob, {});
          returnFile = blob as File;
        }
        return returnFile;
      });
  }

  confirmPhone(event): void {}

  confirmCompany(): void {
    if (this.userCompany == 'Choose other') {
      this.dialog
        .open(SelectCompanyComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '450px',
          disableClose: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const company = res['company'];
            const job = res['job'];
            this.userService
              .updateProfile({ company, job })
              .subscribe((res) => {
                if (res) {
                  this.userService.updateProfileImpl({ company, job });
                  // this.toast.success('Company is changed successfully.');
                  this.userCompany = company;
                  this.companies[0] = company;
                }
              });
          }
        });
    }
  }

  checkPhoneRequired(): boolean {
    if (!this.phoneNumber || !this.phoneControl) {
      return true;
    }
    if (!Object.keys(this.phoneNumber)) {
      return true;
    }
    return false;
  }
  checkPhoneValid(): boolean {
    if (!this.phoneNumber || !this.phoneControl) {
      return true;
    }
    if (Object.keys(this.phoneNumber).length && !this.phoneControl.valid) {
      return false;
    }
    return true;
  }
}
