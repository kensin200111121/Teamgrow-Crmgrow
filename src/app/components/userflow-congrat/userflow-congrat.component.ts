import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-userflow-congrat',
  templateUrl: './userflow-congrat.component.html',
  styleUrls: ['./userflow-congrat.component.scss']
})
export class UserflowCongratComponent implements OnInit {
  readonly isSspa = environment.isSspa;

  constructor(
    private dialogRef: MatDialogRef<UserflowCongratComponent>,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  getStarted(): void {
    localStorage.setCrmItem('checklist', 'end');
    this.dialogRef.close();
  }
}
