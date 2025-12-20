import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Precheck } from './precheck';

describe('Precheck', () => {
  let component: Precheck;
  let fixture: ComponentFixture<Precheck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Precheck]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Precheck);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
