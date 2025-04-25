import { Component, Input } from '@angular/core';
import { RouterService } from '@app/services/router.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss']
})
export class BackButtonComponent {
  prevPageTitle = '';

  @Input() defaultTitle = '';
  @Input() defaultRoute = '';
  @Input() directMove = false;

  constructor(private routerService: RouterService, private router: Router) {}

  ngOnInit(): void {
    const lastIndex = this.routerService.histories.length - 2;
    // when only previous url is default route, back title will be rendered
    if (
      lastIndex < 0 ||
      this.routerService.histories[lastIndex]?.url === this.defaultRoute
    ) {
      this.prevPageTitle = `to ${this.defaultTitle}`;
    } else {
      this.prevPageTitle = '';
    }
  }

  goToBack(): void {
    if (this.routerService.histories.length === 1 || this.directMove) {
      this.router.navigate([this.defaultRoute]);
    } else this.routerService.goBack();
  }
}
