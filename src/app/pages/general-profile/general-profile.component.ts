import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CountryISO } from 'ngx-intl-tel-input';
import { ToastrService } from 'ngx-toastr';
import { AvatarEditorComponent } from '@components/avatar-editor/avatar-editor.component';
import { COMPANIES, PHONE_COUNTRIES } from '@constants/variable.constants';
import { User } from '@models/user.model';
import { HelperService } from '@services/helper.service';
import { UserService } from '@services/user.service';
import { FileUploader } from 'ng2-file-upload';
import { environment } from '@environments/environment';
import { Subscription } from 'rxjs';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { SelectCompanyComponent } from '@components/select-company/select-company.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-general-profile',
  templateUrl: './general-profile.component.html',
  styleUrls: ['./general-profile.component.scss']
})
export class GeneralProfileComponent implements OnInit, OnDestroy {
  user: User = new User();
  name = '';
  userEmail = '';
  phoneNumber = {};
  userCompany = '';
  website = '';
  timezone = '';
  // address = '';
  continents: string[] = [];
  companies = COMPANIES;
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  saving = false;
  public uploader: FileUploader = new FileUploader({
    url: environment.api + 'file',
    authToken: this.userService.getToken(),
    itemAlias: 'photo'
  });
  isRedirect = false;
  profileSubscription: Subscription;
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;

  constructor(
    private userService: UserService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private toast: ToastrService,
    private router: Router,
    public sspaService: SspaService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          this.name = this.user.user_name;
          this.userEmail = this.user.email;
          this.phoneNumber = this.user.phone;
          this.userCompany = this.user.company;
          this.website = this.user.learn_more;
          this.timezone = this.user.time_zone_info;

          // this.address = this.user.location;
          this.companies = COMPANIES;
          if (this.userCompany != 'Choose other') {
            this.companies[0] = this.userCompany;
          }
        }
      }
    );
  }

  ngOnInit(): void {
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
      if (this.uploader.queue.length > 1) {
        this.uploader.queue.splice(0, 1);
      }
    };
    this.uploader.onCompleteItem = (
      item: any,
      response: any,
      status: any,
      headers: any
    ) => {
      try {
        response = JSON.parse(response);
        if (response.status) {
          this.user.picture_profile = response.data.url;
          const data = {
            picture_profile: this.user.picture_profile
          };
          this.userService.updateProfile(data).subscribe(() => {
            this.userService.updateProfileImpl(data);
          });
          // this.toast.success('Profile picture updating is successfully.');
        } else {
          const error = 'Profile picture updating is failed.';
          this.toast.error(error);
        }
      } catch (e) {
        const error = 'Profile picture updating is failed.';
        this.toast.error(error);
      }
    };
  }
  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
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
              const picture_profile = this.user.picture_profile;
              this.userService
                .updateProfile({ picture_profile })
                .subscribe(() => {
                  this.userService.updateProfileImpl({ picture_profile });
                });
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
    this.user.picture_profile = evt;
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

  updateProfile(form: any): void {
    if (this.checkPhoneRequired() || !this.checkPhoneValid()) {
      return;
    }

    // this.saving = true;
    let formData;
    if (
      form.user_name &&
      form.email &&
      form.phone.number &&
      !this.user.onboard.profile &&
      this.user.user_version >= 2.1
    ) {
      this.user.onboard.profile = true;
      formData = {
        ...form,
        ...{ onboard: this.user.onboard }
      };
      this.isRedirect = true;
    } else {
      formData = form;
      this.isRedirect = false;
    }
    this.saving = true;
    this.userService
      .updateProfile({ ...formData, time_zone_info: this.timezone })
      .subscribe((data) => {
        this.userService.updateProfileImpl(data);
        this.saving = false;
        if (this.isRedirect) {
          this.router.navigate(['/settings/integration']);
        }
      });
  }

  // handleAddressChange(evt: any): void {
  //   this.address = evt.formatted_address;
  // }

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
          } else {
            this.userCompany = this.companies[0];
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
