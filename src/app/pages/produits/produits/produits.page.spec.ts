import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProduitsPage } from './produits.page';

describe('ProduitsPage', () => {
  let component: ProduitsPage;
  let fixture: ComponentFixture<ProduitsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProduitsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
