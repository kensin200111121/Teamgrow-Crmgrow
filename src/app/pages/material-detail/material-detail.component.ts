import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-material-detail',
  templateUrl: './material-detail.component.html',
  styleUrls: ['./material-detail.component.scss']
})
export class MaterialDetailComponent implements OnInit {
  routeSubscription: Subscription;

  constructor(private route: ActivatedRoute, private router: Router) {}
  material_id = null;
  material_type = null;

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.material_id = params['id'];
      this.material_type = params['material_type'];
    });
  }
}
