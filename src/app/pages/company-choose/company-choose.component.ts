import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ALL_COMPANIES } from '@constants/variable.constants';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-company-choose',
  templateUrl: './company-choose.component.html',
  styleUrls: ['./company-choose.component.scss']
})
export class CompanyChooseComponent implements OnInit {
  step = 1;
  companies = ALL_COMPANIES;
  is_focus = false;
  otherCompany = '';
  user: User = new User();

  @ViewChild('jobField') jobInput: ElementRef;
  @ViewChild('companyField') companyInput: ElementRef;
  profileSubscription: Subscription;

  constructor(
    public userService: UserService,
    private router: Router,
    private toast: ToastrService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user = profile;
      }
    );
  }

  ngOnInit(): void {}

  setCompany(label: string): void {
    this.user.company = label;
    this.goHome();
  }

  setJob(job: string): void {
    this.user.job = job;
    if (job === 'realtor') {
      this.step = 2;
      this.is_focus = false;
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
    this.userService
      .updateProfile({ job: this.user.job, company: this.user.company })
      .subscribe(() => {
        this.userService.updateProfileImpl({
          job: this.user.job,
          company: this.user.company
        });
        this.is_focus = false;
      });
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
}
