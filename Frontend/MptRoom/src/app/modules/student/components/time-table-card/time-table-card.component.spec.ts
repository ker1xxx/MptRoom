import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeTableCardComponent } from './time-table-card.component';

describe('TimeTableCardComponent', () => {
  let component: TimeTableCardComponent;
  let fixture: ComponentFixture<TimeTableCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeTableCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeTableCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
