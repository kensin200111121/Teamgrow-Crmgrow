import { Component, OnInit } from '@angular/core';
import { environment } from '@environments/environment';
import { SspaService } from '@app/services/sspa.service';
import { OnboardingService } from '@app/services/onboarding-services';
import { UserService } from '@app/services/user.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { VORTEX_FEATURES } from '@app/constants/feature.constants';

@Component({
  selector: 'app-user-onboarding',
  templateUrl: './user-onboarding-component.html',
  styleUrls: ['./user-onboarding-component.scss']
})
export class UserOnboardingComponent implements OnInit {
  readonly isSspa = environment.isSspa;
  readonly feature = VORTEX_FEATURES;
  onboardingOptions = [
    {
      name: 'email',
      title: 'Connect Your Email',
      description:
        'Sync your email to send messages to contacts directly within Vortex.',
      providers: [
        {
          label: 'Gmail',
          icon: 'img/google.svg',
          alt: 'Gmail',
          link: '/account/integrations?provider=google&service=mail'
        },
        {
          label: 'Outlook',
          icon: 'img/microsoft.svg',
          alt: 'Outlook',
          link: '/account/integrations?provider=microsoft&service=mail'
        }
      ]
    },
    {
      name: 'calendar',
      title: 'Connect a Calendar',
      description: 'Schedule and manage appointments directly from Vortex.',
      providers: [
        {
          label: 'Gmail',
          icon: 'img/google.svg',
          alt: 'Gmail Calendar',
          link: '/account/integrations?provider=google&service=calendar'
        },
        {
          label: 'Outlook',
          icon: 'img/microsoft.svg',
          alt: 'Outlook Calendar',
          link: '/account/integrations?provider=microsoft&service=calendar'
        }
      ]
    },
    {
      name: 'dialer',
      title: 'Set Up Your Dialer',
      description: 'Activate your WAVV number to start making calls in Vortex.',
      providers: [
        {
          label: 'Get Started',
          link: ''
        }
      ],
      feature: VORTEX_FEATURES.NURTURE
    },
    {
      name: 'sms',
      title: 'Register SMS Number',
      description:
        'Register your texting number to improve deliverability and prevent spam. Once verified, start texting contacts directly from Vortex',
      providers: [
        {
          label: 'Get Started',
          link: ''
        }
      ],
      feature: VORTEX_FEATURES.NURTURE
    },
    {
      name: 'contacts',
      title: 'Import Contacts',
      description:
        'Organize your database and group contacts for better relationship management.',
      providers: [
        {
          label: 'Upload .CSV File',
          right_icon: 'img/link_contact.svg',
          alt: 'import contacts',
          type: 'csv'
        },
        {
          label: 'Contacts',
          icon: 'img/google.svg',
          alt: 'google contacts',
          type: 'google'
        }
      ]
    },
    {
      name: 'team_members',
      title: 'Add Team Members',
      description:
        'Collaborate more effectively by adding team members to your account. Share leads, track performance, and streamline communication in one place.',
      providers: [
        {
          label: 'Invite',
          right_icon: 'img/link_contact.svg',
          alt: 'add members'
        }
      ],
      feature: VORTEX_FEATURES.NURTURE
    }
  ];

  constructor(
    private dialog: MatDialog,
    public sspaService: SspaService,
    public onboardingService: OnboardingService,
    private userService: UserService,
    private router: Router
  ) {}
  ngOnInit(): void {}

  ngOnDestroy(): void {}

  toggleSkipping(section: string): void {
    this.onboardingService.toggleSkipping(section);
  }

  handleProvider(option, provider): void {
    switch (option?.name) {
      case 'email':
        if (environment.isSspa && provider?.link) {
          const newTab = window.open(provider.link, '_blank');
          newTab?.focus();

          const pollTimer = setInterval(() => {
            if (newTab?.closed) {
              clearInterval(pollTimer);
              this.onTabClosed(provider);
            }
          }, 500);
        }
        break;
      case 'calendar':
        if (environment.isSspa && provider?.link) {
          const newTab = window.open(provider.link, '_blank');
          newTab?.focus();

          const pollTimer = setInterval(() => {
            if (newTab?.closed) {
              clearInterval(pollTimer);
              this.onTabClosed(provider);
            }
          }, 500);
        }
        break;
      case 'contacts':
        if (provider?.type == 'csv') {
          this.router.navigate(['/contacts/import-csv']).then(() => {
            this.dialog.closeAll();
          });
        } else {
          this.userService.syncGoogleContact().subscribe((res) => {
            if (res) {
              window.open(res, '_blank');
            }
          });
        }
        break;
      default:
        break;
    }
  }

  onTabClosed(provider): void {
    this.onboardingService.reinitOnboardingSteps();
  }
}
