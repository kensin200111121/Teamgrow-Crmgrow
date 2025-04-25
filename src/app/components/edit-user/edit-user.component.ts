import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CountryISO } from 'ngx-intl-tel-input';
import { COMPANIES, PHONE_COUNTRIES } from '@constants/variable.constants';
import { User } from '@models/user.model';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { SelectCompanyComponent } from '@components/select-company/select-company.component';
import { HelperService } from '@services/helper.service';
import { ToastrService } from 'ngx-toastr';
import { AvatarEditorComponent } from '@components/avatar-editor/avatar-editor.component';
import { validateEmail } from '@utils/functions';
import moment from 'moment-timezone';
@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {
  user: User = new User();
  name = '';
  userEmail = '';
  phoneNumber = {};
  userCompany = '';
  website = '';
  timezone = '';
  address = '';
  companies = COMPANIES;
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  saving = false;
  defaultTimeZone = true;
  existingUser = false;
  checkingUser = false;
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;

  constructor(
    private dialogRef: MatDialogRef<EditUserComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private helperService: HelperService,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {
    if (data) {
      this.user = this.data.editUser;
      this.name = this.user.user_name;
      this.userEmail = this.user.email;
      this.phoneNumber = this.user.phone;
      this.userCompany = this.user.company;
      this.website = this.user.learn_more;
      this.address = this.user.location;
      this.timezone = this.user.time_zone_info;
      if (this.userCompany != 'Choose other') {
        this.companies[0] = this.userCompany;
      }
    }
  }

  ngOnInit(): void {}

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
            this.userCompany = company;
            this.companies[0] = company;
          } else {
            this.userCompany = this.companies[0];
          }
        });
    }
  }

  handleAddressChange(evt: any): void {
    this.address = evt.formatted_address;
  }

  autofill(event: Event): void {
    const target = <HTMLInputElement>event.target;
    if (target.checked) {
      const primaryProfile = this.userService.profile.getValue();
      this.name = primaryProfile.user_name;
      this.userEmail = primaryProfile.email;
      this.phoneNumber = primaryProfile.phone;
      this.userCompany = primaryProfile.company;
      this.website = primaryProfile.learn_more;
      this.timezone = primaryProfile.time_zone_info;
      this.address = primaryProfile.location;
      // added by sylla
      this.confirmEmail();
      // end by sylla
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

  // added by sylla
  confirmEmail(): void {
    if (this.userEmail === this.user.email) {
      this.checkingUser = false;
      this.existingUser = false;
      return;
    }
    this.existingUser = false;
    if (this.userEmail && validateEmail(this.userEmail)) {
      this.checkingUser = true;
      this.userService.checkEmail(this.userEmail).subscribe(
        (res) => {
          this.checkingUser = false;
          if (res['status']) {
            this.existingUser = false;
          } else {
            this.existingUser = true;
          }
        },
        (err) => {
          this.checkingUser = false;
        }
      );
    }
  }
  // end by sylla

  updateProfile(form: any): void {
    // added by sylla
    if (!this.checkingUser && this.existingUser) {
      return;
    }
    // end by sylla
    if (this.checkPhoneRequired() || !this.checkPhoneValid()) {
      return;
    }
    this.saving = true;
    const data = { ...form, time_zone_info: this.timezone };
    if (this.user.picture_profile) {
      data.picture_profile = this.user.picture_profile;
    }
    this.userService.updateSubAccount(this.user._id, data).subscribe((res) => {
      if (res['status']) {
        this.saving = false;
        this.dialogRef.close(res['data']);
      }
    });
  }
  selectTimezone($event): void {
    this.timezone = $event || moment()['_z']?.name || moment.tz.guess();
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
              this.user.picture_profile = '';
            } else {
              this.helperService
                .resizeImage(res)
                .then((image) => {
                  this.user.picture_profile = image;
                })
                .catch((err) => {
                  this.toast.error('Image Resizing Failed');
                });
            }
          }
        });
      })
      .catch((err) => {
        this.toast.error('File Select', err);
      });
  }
}
