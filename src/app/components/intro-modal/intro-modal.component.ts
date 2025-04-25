import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-intro-modal',
  templateUrl: './intro-modal.component.html',
  styleUrls: ['./intro-modal.component.scss']
})
export class IntroModalComponent implements OnInit {
  step = 1;
  constructor(
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  nextStep(): void {
    this.step++;
  }
}
