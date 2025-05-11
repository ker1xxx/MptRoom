import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherTimeTableBodyComponent } from './teacher-time-table-body.component';

describe('TeacherTimeTableBodyComponent', () => {
  let component: TeacherTimeTableBodyComponent;
  let fixture: ComponentFixture<TeacherTimeTableBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherTimeTableBodyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherTimeTableBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
