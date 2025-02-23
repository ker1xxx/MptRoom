import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentMarkCardComponent } from './recent-mark-card.component';

describe('RecentMarkCardComponent', () => {
  let component: RecentMarkCardComponent;
  let fixture: ComponentFixture<RecentMarkCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentMarkCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentMarkCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
