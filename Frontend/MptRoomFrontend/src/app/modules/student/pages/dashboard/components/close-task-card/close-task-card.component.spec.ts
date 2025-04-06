import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseTaskCardComponent } from './close-task-card.component';

describe('CloseTaskCardComponent', () => {
  let component: CloseTaskCardComponent;
  let fixture: ComponentFixture<CloseTaskCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloseTaskCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloseTaskCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
