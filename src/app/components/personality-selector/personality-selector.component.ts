import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PersonalityManagerComponent } from '../personality-manager/personality-manager.component';
import { PersonalityService } from '@app/services/personality.service';
import { Personality } from '@app/models/personality.model';
@Component({
  selector: 'app-personality-selector',
  templateUrl: './personality-selector.component.html',
  styleUrls: ['./personality-selector.component.scss']
})
export class PersonalitySelectorComponent {
  _selected = null;
  @Input() set selected(value: Personality) {
    if (value) {
      this._selected = this.personList.find((e) => e._id === value._id);
    }
  }
  @Output() selectPerson = new EventEmitter<Personality>();
  personList: Personality[];
  constructor(
    private dialog: MatDialog,
    public personalityService: PersonalityService
  ) {
    this.personalityService.load();
    this.personalityService.personalities$.subscribe((res) => {
      if (res?.length) {
        const userPersons = res.filter((item) => item.role !== 'admin');
        userPersons.sort((x, y) => (y.title > x.title ? 1 : -1));
        const adminPersons = res.filter((item) => item.role === 'admin');
        adminPersons.sort((x, y) => (x.title > y.title ? 1 : -1));
        this.personList = [...adminPersons, ...userPersons];
      }
    });
  }

  selectPersonality(person: Personality): void {
    if (person) {
      this._selected = person;
      this.selectPerson.emit(person);
    } else {
      this._selected = null;
      this.selectPerson.emit(null);
    }
  }

  managePersonality(): void {
    const dialog = this.dialog.open(PersonalityManagerComponent, {
      data: {}
    });
    dialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    dialog.afterClosed().subscribe((res) => {
      if (res && res.status) {
        console.log('response', res);
      }
    });
  }
}
