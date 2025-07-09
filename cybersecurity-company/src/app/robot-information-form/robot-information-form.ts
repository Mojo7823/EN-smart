import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RobotService, RobotInformation } from '../robot';

@Component({
  selector: 'app-robot-information-form',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './robot-information-form.html',
  styleUrl: './robot-information-form.css'
})
export class RobotInformationForm {
  robotInfo: RobotInformation = {
    name: '',
    firmwareVersion: '',
    mainFunction: '',
    description: ''
  };

  constructor(
    private robotService: RobotService,
    private router: Router
  ) {
    // Load existing data if available
    const existingData = this.robotService.getRobotData();
    if (existingData.information) {
      this.robotInfo = { ...existingData.information };
    }
  }

  onSubmit(): void {
    if (this.robotInfo.name || this.robotInfo.firmwareVersion || this.robotInfo.mainFunction || this.robotInfo.description) {
      this.robotService.setRobotInformation(this.robotInfo);
      this.router.navigate(['/dashboard']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
