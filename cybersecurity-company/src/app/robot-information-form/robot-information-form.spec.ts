import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotInformationForm } from './robot-information-form';

describe('RobotInformationForm', () => {
  let component: RobotInformationForm;
  let fixture: ComponentFixture<RobotInformationForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RobotInformationForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotInformationForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
