import { Component, OnInit } from '@angular/core';
import { VortexIdentityService } from '@app/services/vortex-identity.service';

@Component({
  selector: 'app-overview-courses',
  templateUrl: './overview-courses.component.html',
  styleUrls: ['./overview-courses.component.scss']
})
export class OverviewCoursesComponent implements OnInit {
  loading = false;
  userCourses = [];
  displayCourses = [];
  universityJwt = null;
  basicCourses = [
    {
      id: 2808854,
      course_name: 'Mindset, Habits and Time Management',
      description:
        'Being in the right mindset and having the right habits are essential to being successful and efficient with your prospecting. This course gets you in on the need-to-know to effectively manage your prospecting time.'
    },
    {
      id: 2808915,
      course_name: 'Skills, Scripts, Roleplay & Resources for Each Lead Type',
      description:
        'This course provides you scripts, resources, and roleplay information for each lead type we offer to get you started on the right foot with your prospecting.'
    },
    {
      id: 2808929,
      course_name: 'Tech Training - Vortex, Dialer, Mail Merge',
      description:
        'This course is a technical training of Vortex. You are trained on how to import your leads, create and manage filters and folders, setting up the dialer, creating and printing mailers and labels, and finding the best strategies for Ad Builder. This course is a technical training of Vortex. You are trained on how to import your leads, create and manage filters and folders, setting up the dialer, creating and printing mailers and labels, and finding the best strategies for Ad Builder. This course is a technical training of Vortex. You are trained on how to import your leads, create and manage filters and folders, setting up the dialer, creating and printing mailers and labels, and finding the best strategies for Ad Builder.'
    }
  ];
  universityUrl = 'https://university.redx.com/api/sso/v2/sso/jwt?jwt=';

  constructor(private vortexIdentityService: VortexIdentityService) {}

  ngOnInit(): void {
    this.loadUniversityJwt();
    this.loadThinkificCourses();
  }

  loadUniversityJwt() {
    this.vortexIdentityService.loadUniversityJwt().subscribe((res) => {
      if (res) {
        this.universityJwt = res;
        this.universityUrl += this.universityJwt;
      }
    });
  }

  loadThinkificCourses() {
    this.vortexIdentityService.loadCourses().subscribe((courses) => {
      this.userCourses = courses;

      this.displayCourses = this.basicCourses;
      this.buildDisplayCourseList();
    });
  }
  buildDisplayCourseList() {
    const sortedUserCourses = this.userCourses.sort((a, b) => {
      return (
        parseFloat(b.percentage_completed ?? '0.0') -
        parseFloat(a.percentage_completed ?? '0.0')
      );
    });

    if (sortedUserCourses.length === 0 || sortedUserCourses.length < 3) {
      this.displayCourses = [...sortedUserCourses, ...this.basicCourses];
    } else {
      this.displayCourses = sortedUserCourses;
    }

    this.displayCourses = this.displayCourses.slice(0, 3);
  }

  buildAndNavigateToCourseUrl(courseId: number) {
    const url = new URL('https://university.redx.com/api/sso/v2/sso/jwt');
    url.searchParams.set('jwt', this.universityJwt);
    url.searchParams.set(
      'return_to',
      `https://university.redx.com/courses/${courseId}`
    );

    window.open(url, '_blank');
  }
}
