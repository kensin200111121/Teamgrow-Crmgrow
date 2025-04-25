import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ListType } from '@app/enums/sphere-list.enum';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss']
})
export class ConversationsComponent implements OnInit {
  @ViewChild('preferenceDrawer') preferenceDrawer: MatDrawer;
  readonly ListType = ListType;

  constructor() {}

  ngOnInit(): void {}

  openPreference(): void {
    this.preferenceDrawer.open();
  }

  closePreference(): void {
    this.preferenceDrawer.close();
  }

  sortContacts(): void {}
}
