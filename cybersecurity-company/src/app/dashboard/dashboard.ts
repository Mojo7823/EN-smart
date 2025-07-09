import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RobotInformation } from '../robot-information/robot-information';
import { RobotService } from '../robot';
import { SaveSessionDialog, LoadSessionDialog } from '../session-manager/session-manager';
import { ChatComponent } from '../chat/chat';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    RobotInformation,
    ChatComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private robotService: RobotService
  ) {}

  navigateToClassification(): void {
    this.router.navigate(['/robot-classification']);
  }

  navigateToPdfManager(): void {
    this.router.navigate(['/pdf-manager']);
  }

  openAddInformationDialog(): void {
    // For now, we'll create a simple dialog component inline
    // In a real app, this would be a separate component
    const dialogRef = this.dialog.open(AddInformationDialog, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result);
      }
    });
  }

  // Refresh robot data when returning from classification
  ngOnInit() {
    // This will trigger update of robot information display
  }

  openSaveSessionDialog(): void {
    const dialogRef = this.dialog.open(SaveSessionDialog, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Session saved successfully - could show a success message here
        console.log('Session saved successfully');
      }
    });
  }

  openLoadSessionDialog(): void {
    const dialogRef = this.dialog.open(LoadSessionDialog, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Session loaded successfully - refresh the page or components
        console.log('Session loaded successfully');
        // Trigger a refresh by navigating to the same route
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/dashboard']);
        });
      }
    });
  }
}

// Simple dialog component for Add Information
@Component({
  selector: 'add-information-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Add Information</h2>
    <mat-dialog-content>
      <p>Select the type of information to add:</p>
      <div class="dialog-options">
        <button mat-raised-button color="primary" (click)="selectOption('robot-info')" class="option-btn">
          <mat-icon>info</mat-icon>
          Robot Information
        </button>
        <button mat-raised-button color="primary" (click)="selectOption('robot-specs')" class="option-btn">
          <mat-icon>settings</mat-icon>
          Robot Specifications
        </button>
        <button mat-raised-button color="primary" (click)="selectOption('robot-compliance')" class="option-btn">
          <mat-icon>verified</mat-icon>
          Robot Compliance
        </button>
        <button mat-raised-button color="primary" (click)="selectOption('robot-features')" class="option-btn">
          <mat-icon>star</mat-icon>
          Robot Features
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="close()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 1rem 0;
    }
    .option-btn {
      padding: 12px 16px;
      text-align: left;
      justify-content: flex-start;
    }
    .option-btn mat-icon {
      margin-right: 12px;
    }
  `]
})
export class AddInformationDialog {
  constructor(
    private dialog: MatDialog,
    private router: Router
  ) {}

  selectOption(option: string): void {
    if (option === 'robot-info') {
      this.dialog.closeAll();
      this.router.navigate(['/robot-information-form']);
    } else {
      // For now, just close the dialog for other options
      this.dialog.closeAll();
    }
  }

  close(): void {
    this.dialog.closeAll();
  }
}