import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministratorUsersPageComponent } from './administrator-users-page.component';

describe('AdministratorUsersPageComponent', () => {
  let component: AdministratorUsersPageComponent;
  let fixture: ComponentFixture<AdministratorUsersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministratorUsersPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministratorUsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
