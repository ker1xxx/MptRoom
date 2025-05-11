import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmittedTaskCardComponent } from './submitted-task-card.component';

describe('SubmittedTaskCardComponent', () => {
  let component: SubmittedTaskCardComponent;
  let fixture: ComponentFixture<SubmittedTaskCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmittedTaskCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmittedTaskCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
