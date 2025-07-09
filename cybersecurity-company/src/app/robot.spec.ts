import { TestBed } from '@angular/core/testing';

import { Robot } from './robot';

describe('Robot', () => {
  let service: Robot;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Robot);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
