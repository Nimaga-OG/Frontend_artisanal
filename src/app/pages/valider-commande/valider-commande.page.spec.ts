import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValiderCommandePage } from './valider-commande.page';

describe('ValiderCommandePage', () => {
  let component: ValiderCommandePage;
  let fixture: ComponentFixture<ValiderCommandePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ValiderCommandePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
