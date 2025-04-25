import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactInputTagComponent } from './contact-input-tag.component';

describe('ContactInputTagComponent', () => {
  let component: ContactInputTagComponent;
  let fixture: ComponentFixture<ContactInputTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContactInputTagComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactInputTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
