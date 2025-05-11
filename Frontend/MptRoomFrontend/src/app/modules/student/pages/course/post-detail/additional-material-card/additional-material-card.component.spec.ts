import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalMaterialCardComponent } from './additional-material-card.component';

describe('AdditionalMaterialCardComponent', () => {
  let component: AdditionalMaterialCardComponent;
  let fixture: ComponentFixture<AdditionalMaterialCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalMaterialCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdditionalMaterialCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
