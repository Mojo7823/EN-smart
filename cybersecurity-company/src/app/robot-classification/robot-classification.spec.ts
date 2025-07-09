import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotClassification } from './robot-classification';

describe('RobotClassification', () => {
  let component: RobotClassification;
  let fixture: ComponentFixture<RobotClassification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RobotClassification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RobotClassification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
