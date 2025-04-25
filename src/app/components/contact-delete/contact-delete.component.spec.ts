import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactDeleteComponent } from './contact-delete.component';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ContactDeleteComponent', () => {
  let component: ContactDeleteComponent;
  let fixture: ComponentFixture<ContactDeleteComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ContactDeleteComponent>>;

  beforeEach(async () => {
    const dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [ContactDeleteComponent],
      imports: [
        MatProgressBarModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [{ provide: MatDialogRef, useValue: dialogRefMock }]
    }).compileComponents();

    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<
      MatDialogRef<ContactDeleteComponent>
    >;

    fixture = TestBed.createComponent(ContactDeleteComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.deletePercent).toBe(0);
    expect(component.deletedCount).toBe(0);
    expect(component.allCount).toBe(0);
  });

  it('should display the delete status correctly', () => {
    component.deletePercent = 50;
    component.deletedCount = 5;
    component.allCount = 10;
    fixture.detectChanges();

    const statusElement = fixture.debugElement.query(
      By.css('.v-center.justify-content-between .f-3.fw-600')
    ).nativeElement;
    const percentElement = fixture.debugElement.query(
      By.css('.v-center.justify-content-between .f-3.fw-600:nth-child(2)')
    ).nativeElement;

    expect(statusElement.textContent).toContain('delete status'); // Ensure translation key is displayed, ideally this should be translated text
    expect(percentElement.textContent).toContain('50%');
  });

  it('should display the warning message', () => {
    const warningElement = fixture.debugElement.query(
      By.css('.attention .f-4.fw-600.c-black')
    ).nativeElement;
    expect(warningElement.textContent).toContain(
      "Don't close this tab while deleting contacts"
    );
  });
});
