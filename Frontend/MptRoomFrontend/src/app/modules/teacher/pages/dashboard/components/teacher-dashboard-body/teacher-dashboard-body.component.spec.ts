import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherDashboardBodyComponent } from './teacher-dashboard-body.component';

describe('TeacherDashboardBodyComponent', () => {
  let component: TeacherDashboardBodyComponent;
  let fixture: ComponentFixture<TeacherDashboardBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherDashboardBodyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherDashboardBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
