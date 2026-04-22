import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationCommandePage } from './confirmation-commande.page';

describe('ConfirmationCommandePage', () => {
  let component: ConfirmationCommandePage;
  let fixture: ComponentFixture<ConfirmationCommandePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationCommandePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
