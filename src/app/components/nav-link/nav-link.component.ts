import { Component, Input, OnInit } from '@angular/core';
import { Strings } from '@app/constants/strings.constant';
import { DialerService } from '@app/services/dialer.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-nav-link',
  templateUrl: './nav-link.component.html',
  styleUrls: ['./nav-link.component.scss']
})
export class NavLinkComponent implements OnInit {
  @Input('class') className = '';
  @Input('link') link = '';
  constructor(
    public dialerService: DialerService,
    private toast: ToastrService
  ) {}
  ngOnInit(): void {}
  onClick() {
    const calling = this.dialerService.calling.getValue();
    if (calling) {
      this.toast.error('', Strings.DISABLED_NAVIGATION);
      return;
    }
    window.location.href = this.link;
  }
}
