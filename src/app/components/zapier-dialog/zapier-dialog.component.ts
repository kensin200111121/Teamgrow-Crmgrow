import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-zapier-dialog',
  templateUrl: './zapier-dialog.component.html',
  styleUrls: ['./zapier-dialog.component.scss']
})
export class ZapierDialogComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<ZapierDialogComponent>,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.loadScript();
  }

  loadScript(): void {
    document.getElementById('zapier').innerHTML =
      '<zapier-zap-templates theme="light"' +
      'ids="1216840,1216841,1216842,1216900,1217021,1217023,1217026,1217027"' +
      'limit="10"' +
      'link-target="new-tab"' +
      'presentation="row"' +
      'use-this-zap="show"' +
      '></zapier-zap-templates>';
  }
}
