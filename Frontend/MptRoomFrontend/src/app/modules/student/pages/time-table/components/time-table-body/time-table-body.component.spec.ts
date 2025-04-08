import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeTableBodyComponent } from './time-table-body.component';

describe('TimeTableBodyComponent', () => {
  let component: TimeTableBodyComponent;
  let fixture: ComponentFixture<TimeTableBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeTableBodyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeTableBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
