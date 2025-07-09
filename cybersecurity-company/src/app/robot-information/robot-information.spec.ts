import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotInformation } from './robot-information';

describe('RobotInformation', () => {
  let component: RobotInformation;
  let fixture: ComponentFixture<RobotInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RobotInformation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotInformation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
