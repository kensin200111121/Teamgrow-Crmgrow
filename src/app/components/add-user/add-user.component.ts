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
import { Clipboard } from '@angular/cdk/clipboard';
import { UserService } from '@services/user.service';
import { SelectCompanyComponent } from '@components/select-company/select-company.component';
import { HelperService } from '@services/helper.service';
import { ToastrService } from 'ngx-toastr';
import { AvatarEditorComponent } from '@components/avatar-editor/avatar-editor.component';
import {
  generatePassword,
  getRandomInt,
  validateEmail
} from '@utils/functions';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  user: User = new User();
  step = 1;
  passwordType = 'password';
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
  checkingUser = false;
  existingUser = false;
  saving = false;
  submitted = false;
  defaultTimeZone = true;
  loginEnabled = false;
  masterEnabled = true;
  accountPassword = '';
  autoPassword = false;
  welcomeEmailEnabled = false;
  profileData = {};

  checkUserSubscription: Subscription;
  confirmEmail = new Subject<string>();
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;

  constructor(
    private dialogRef: MatDialogRef<AddUserComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private helperService: HelperService,
    private clipboard: Clipboard,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {
    if (data) {
      this.user = this.data.user;
    }
    this.confirmEmail
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.existingUser = false;
        if (this.userEmail && validateEmail(this.userEmail)) {
          this.checkingUser = true;
          this.checkUserSubscription &&
            this.checkUserSubscription.unsubscribe();
          this.checkUserSubscription = this.userService
            .checkEmail(this.userEmail)
            .subscribe(
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
      });
  }

  ngOnInit(): void {}

  ngOnDestory(): void {
    this.checkUserSubscription && this.checkUserSubscription.unsubscribe();
  }

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
      this.confirmEmail.next(this.userEmail);
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

  updateProfile(form: any): void {
    if (
      this.checkingUser ||
      (!this.checkingUser && this.existingUser) ||
      this.checkPhoneRequired() ||
      !this.checkPhoneValid()
    ) {
      return;
    }
    this.saving = true;
    const data = { ...form };
    if (this.user.picture_profile) {
      data.picture_profile = this.user.picture_profile;
    }
    this.profileData = { ...data };
    this.saving = false;
    this.step = 2;
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

  setOptionValue(timezone): string {
    return JSON.stringify(timezone);
  }

  regeneratePassword(): void {
    const length = getRandomInt(6, 12);
    this.accountPassword = generatePassword(length);
  }

  onSwitchPasswordMode(auto: boolean): void {
    this.autoPassword = auto;
    if (this.autoPassword) {
      const length = getRandomInt(6, 12);
      this.accountPassword = generatePassword(length);
    } else {
      this.accountPassword = '';
      this.passwordType = 'password';
    }
  }

  copyPassword(): void {
    this.clipboard.copy(this.accountPassword);
    this.toast.success('Copied the password successfully!');
  }

  onBack(): void {
    this.step -= 1;
  }

  requiredPassword(): boolean {
    return this.accountPassword === '';
  }

  invalidPassword(): boolean {
    return this.accountPassword.length < 6;
  }
  saveProfile(): void {
    this.saving = true;
    this.submitted = true;
    if (
      this.loginEnabled &&
      !this.autoPassword &&
      (this.requiredPassword() || this.invalidPassword())
    ) {
      this.saving = false;
      return;
    }
    this.profileData = {
      ...this.profileData,
      time_zone_info: this.timezone,
      login_enabled: this.loginEnabled,
      master_enabled: this.masterEnabled,
      welcome_email: this.welcomeEmailEnabled
    };
    if (this.accountPassword) {
      this.profileData['password'] = this.accountPassword;
    } else {
      delete this.profileData['password'];
    }
    this.dialogRef.close({ profile: this.profileData });
  }
}
