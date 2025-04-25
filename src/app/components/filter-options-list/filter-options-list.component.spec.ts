import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterOptionsListComponent } from './filter-options-list.component';

describe('FilterOptionsListComponent', () => {
  let component: FilterOptionsListComponent;
  let fixture: ComponentFixture<FilterOptionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilterOptionsListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterOptionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
