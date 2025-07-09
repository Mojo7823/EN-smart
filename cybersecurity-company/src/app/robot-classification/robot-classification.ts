import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RobotService, RobotClassificationResult } from '../robot';

interface ClassificationStep {
  id: string;
  question: string;
  options: Array<{
    text: string;
    nextStep: string;
    isResult?: boolean;
    result?: RobotClassificationResult;
  }>;
}

@Component({
  selector: 'app-robot-classification',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './robot-classification.html',
  styleUrl: './robot-classification.css'
})
export class RobotClassificationComponent {
  currentStep: ClassificationStep | null = null;
  isComplete = false;
  finalResult: RobotClassificationResult | null = null;
  navigationHistory: string[] = [];

  private classificationSteps: Record<string, ClassificationStep> = {
    start: {
      id: 'start',
      question: 'Is the robot\'s primary function to transport a person?',
      options: [
        { text: 'Yes', nextStep: 'person-carrier' },
        { text: 'No', nextStep: 'physical-contact' }
      ]
    },
    'person-carrier': {
      id: 'person-carrier',
      question: 'Is it ALL of the following: For a standing, single passenger, For indoor flat surfaces, Slow & Lightweight, Semi-autonomous?',
      options: [
        { 
          text: 'Yes', 
          nextStep: 'result', 
          isResult: true,
          result: {
            category: 'Person Carrier Robot',
            type: 'Type 3.1 Specific Use Case',
            description: 'A robot designed for transporting a single standing passenger on indoor flat surfaces with slow speed, lightweight design, and semi-autonomous operation.'
          }
        },
        { 
          text: 'No', 
          nextStep: 'result',
          isResult: true,
          result: {
            category: 'Person Carrier Robot',
            type: 'Type 3.2 General / Higher Capability',
            description: 'A robot designed for transporting persons with higher capabilities or broader use cases than the specific use case requirements.'
          }
        }
      ]
    },
    'physical-contact': {
      id: 'physical-contact',
      question: 'Does it provide assistance via direct and intended physical contact?',
      options: [
        { text: 'Yes', nextStep: 'restraint-type' },
        { text: 'No', nextStep: 'mobile-servant' }
      ]
    },
    'restraint-type': {
      id: 'restraint-type',
      question: 'Is it a \'Restraint Type\'? (e.g., an exoskeleton that holds the user)',
      options: [
        { text: 'Yes', nextStep: 'low-powered-restraint' },
        { text: 'No', nextStep: 'restraint-free' }
      ]
    },
    'low-powered-restraint': {
      id: 'low-powered-restraint',
      question: 'Is it \'Low Powered\'? (User can overpower the robot)',
      options: [
        { 
          text: 'Yes', 
          nextStep: 'result',
          isResult: true,
          result: {
            category: 'Physical Assistant Robot',
            type: 'Type 2.1 Low Powered, Restraint',
            description: 'A restraint-type robot that provides physical assistance with low power that can be overpowered by the user.'
          }
        },
        { 
          text: 'No', 
          nextStep: 'result',
          isResult: true,
          result: {
            category: 'Physical Assistant Robot',
            type: 'Type 2.2 High Powered, Restraint',
            description: 'A restraint-type robot that provides physical assistance with high power that cannot be easily overpowered by the user.'
          }
        }
      ]
    },
    'restraint-free': {
      id: 'restraint-free',
      question: 'Is it ALL of the following: Low powered, No autonomous mode, Statically stable, Lightweight & Slow?',
      options: [
        { 
          text: 'Yes', 
          nextStep: 'result',
          isResult: true,
          result: {
            category: 'Physical Assistant Robot',
            type: 'Type 2.3 Low Risk, Restraint-Free',
            description: 'A restraint-free robot that provides physical assistance with low power, no autonomous mode, static stability, and lightweight slow operation.'
          }
        },
        { 
          text: 'No', 
          nextStep: 'result',
          isResult: true,
          result: {
            category: 'Physical Assistant Robot',
            type: 'Type 2.4 High Risk, Restraint-Free',
            description: 'A restraint-free robot that provides physical assistance with higher risk characteristics due to power, autonomy, or mobility features.'
          }
        }
      ]
    },
    'mobile-servant': {
      id: 'mobile-servant',
      question: 'Is it ALL of the following: Small & Lightweight, Slow, Has NO manipulator?',
      options: [
        { 
          text: 'Yes', 
          nextStep: 'result',
          isResult: true,
          result: {
            category: 'Mobile Servant Robot',
            type: 'Type 1.1 Lower Risk Profile',
            description: 'A mobile servant robot with small, lightweight design, slow movement, and no manipulator, resulting in a lower risk profile.'
          }
        },
        { 
          text: 'No', 
          nextStep: 'result',
          isResult: true,
          result: {
            category: 'Mobile Servant Robot',
            type: 'Type 1.2 Higher Risk Profile',
            description: 'A mobile servant robot with characteristics that result in a higher risk profile due to size, speed, or manipulator presence.'
          }
        }
      ]
    }
  };

  constructor(
    private robotService: RobotService,
    private router: Router
  ) {
    this.startClassification();
  }

  startClassification(): void {
    this.currentStep = this.classificationSteps['start'];
    this.isComplete = false;
    this.finalResult = null;
    this.navigationHistory = [];
  }

  selectOption(option: any): void {
    if (option.isResult && option.result) {
      this.finalResult = option.result;
      this.isComplete = true;
      this.robotService.setRobotClassification(option.result);
    } else {
      // Add current step to history before navigating
      if (this.currentStep) {
        this.navigationHistory.push(this.currentStep.id);
      }
      this.currentStep = this.classificationSteps[option.nextStep];
    }
  }

  returnToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  restartClassification(): void {
    this.startClassification();
  }

  goBack(): void {
    if (this.navigationHistory.length > 0) {
      const previousStepId = this.navigationHistory.pop();
      if (previousStepId) {
        this.currentStep = this.classificationSteps[previousStepId];
      }
    }
  }

  canGoBack(): boolean {
    return this.navigationHistory.length > 0;
  }
}
