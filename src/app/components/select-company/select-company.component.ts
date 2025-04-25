import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ALL_COMPANIES } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-select-company',
  templateUrl: './select-company.component.html',
  styleUrls: ['./select-company.component.scss']
})
export class SelectCompanyComponent implements OnInit {
  step = 1;
  companies = ALL_COMPANIES;
  is_focus = false;
  jobType = '';
  companyType = '';
  otherCompany = '';
  user: User = new User();
  type = '';

  @ViewChild('jobField') jobInput: ElementRef;
  @ViewChild('companyField') companyInput: ElementRef;
  profileSubscription: Subscription;

  constructor(
    public userService: UserService,
    private dialogRef: MatDialogRef<SelectCompanyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService
  ) {
    if (this.data) {
      this.type = this.data.type;
    }
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user = profile;
      }
    );
  }

  ngOnInit(): void {}

  setCompany(label: string): void {
    this.companyType = label;
    this.dialogRef.close({
      job: this.jobType,
      company: this.companyType
    });
  }

  setJob(job: string): void {
    this.jobType = job;
    if (job === 'realtor') {
      this.step = 2;
      this.is_focus = false;
    }
  }

  focus(type: string): void {
    this.is_focus = true;
    if (type == 'job') {
      setTimeout(() => {
        this.jobInput.nativeElement.focus();
      }, 300);
    } else {
      setTimeout(() => {
        this.companyInput.nativeElement.focus();
      }, 300);
    }
  }

  blur(type: string): void {
    this.is_focus = false;
    if (this.otherCompany && type == 'company') {
      this.companies.forEach((e) => {
        if (e.type == 'other') {
          e.label = this.otherCompany;
        }
      });
      this.setCompany(this.otherCompany);
    } else if (this.otherCompany && type == 'job') {
      this.setCompany(this.otherCompany);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
