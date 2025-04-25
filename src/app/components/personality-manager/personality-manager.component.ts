import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Personality } from '@app/models/personality.model';
import { PersonalityService } from '@app/services/personality.service';
import { ConfirmComponent } from '../confirm/confirm.component';
@Component({
  selector: 'app-personality-manager',
  templateUrl: './personality-manager.component.html',
  styleUrls: ['./personality-manager.component.scss']
})
export class PersonalityManagerComponent implements OnInit {
  mode = '';
  selected = new Personality();
  newPerson = new Personality();
  personList: Personality[];
  selectedTitle: string;
  selectedContent: string;
  existedPerson = false;
  constructor(
    public personalityService: PersonalityService,
    private dialog: MatDialog
  ) {
    this.personalityService.load();
    this.personalityService.personalities$.subscribe((res) => {
      if (res?.length) {
        const userPersons = res.filter((item) => item.role !== 'admin');
        userPersons.sort((x, y) => (y.title > x.title ? 1 : -1));
        const adminPersons = res.filter((item) => item.role === 'admin');
        adminPersons.sort((x, y) => (x.title < y.title ? 1 : -1));
        this.personList = [...adminPersons, ...userPersons];
      }
    });
  }

  ngOnInit(): void {}
  createNew(): void {
    this.mode = 'create';
    this.selected = null;
    this.existedPerson = false;
  }
  selectPerson(person: Personality): void {
    this.selected = person;
    this.selectedTitle = person.title;
    this.selectedContent = person.content;
    this.mode = 'edit';
    this.existedPerson = false;
  }
  onCreate(): void {
    if (this.existedPerson) return;
    this.personalityService.create(this.newPerson);
    this.mode = '';
  }
  onDelete(person: Personality): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete Personality',
        message: 'Are you sure to delete this personality?',
        cancelLabel: 'Cancel',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });
    dialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.personalityService.delete(person._id);
        this.mode = '';
      }
    });
  }
  onUpdate(): void {
    if (this.existedPerson) return;
    this.selected.title = this.selectedTitle;
    this.selected.content = this.selectedContent;
    this.personalityService.update(this.selected._id, this.selected);
    this.mode = '';
  }
  onCancel(): void {
    this.mode = '';
    this.existedPerson = false;
  }
  checkDuplication(title: string): void {
    let duplicated = false;
    if (this.personList?.length) {
      if (this.mode === 'create') {
        duplicated = this.personList.some((person) => person.title === title);
      } else {
        duplicated = this.personList.some(
          (person) => person.title === title && person._id !== this.selected._id
        );
      }
    }
    console.log('duplicated', duplicated);
    this.existedPerson = duplicated;
  }
}
