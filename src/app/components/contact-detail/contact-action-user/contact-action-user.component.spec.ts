import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactActionUserComponent } from './contact-action-user.component';

describe('ContactActionUserComponent', () => {
  let component: ContactActionUserComponent;
  let fixture: ComponentFixture<ContactActionUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContactActionUserComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactActionUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
