import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RobotService } from '../robot';

@Component({
  selector: 'app-save-session-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Save Session</h2>
    <mat-dialog-content>
      <p>Save your current session to an XML file.</p>
      <mat-form-field appearance="fill" style="width: 100%;">
        <mat-label>Session Name</mat-label>
        <input matInput [(ngModel)]="sessionName" placeholder="Enter session name">
      </mat-form-field>
      <div class="session-info">
        <p><strong>Current Session Contains:</strong></p>
        <ul>
          <li *ngIf="hasInformation">Robot Information</li>
          <li *ngIf="hasClassification">Robot Classification</li>
          <li *ngIf="hasFiles">Uploaded Files ({{ fileCount }})</li>
        </ul>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!sessionName.trim()">
        <mat-icon>save</mat-icon>
        Save Session
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .session-info {
      margin-top: 16px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .session-info ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    mat-dialog-actions {
      justify-content: flex-end;
    }
  `]
})
export class SaveSessionDialog {
  sessionName: string = '';
  hasInformation: boolean = false;
  hasClassification: boolean = false;
  hasFiles: boolean = false;
  fileCount: number = 0;

  constructor(
    public dialogRef: MatDialogRef<SaveSessionDialog>,
    private robotService: RobotService
  ) {
    const data = this.robotService.getRobotData();
    this.hasInformation = !!data.information;
    this.hasClassification = !!data.classification;
    this.hasFiles = !!(data.uploadedFiles && data.uploadedFiles.length > 0);
    this.fileCount = data.uploadedFiles ? data.uploadedFiles.length : 0;
    
    // Set default session name
    this.sessionName = `Robot Session ${new Date().toLocaleDateString()}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.sessionName.trim()) {
      const xmlContent = this.robotService.exportToXML();
      this.downloadXML(xmlContent, this.sessionName.trim());
      this.dialogRef.close(true);
    }
  }

  private downloadXML(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

@Component({
  selector: 'app-load-session-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Load Session</h2>
    <mat-dialog-content>
      <p>Load a previously saved session from an XML file.</p>
      <div class="upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
        <mat-icon>cloud_upload</mat-icon>
        <p>Click to browse or drag & drop an XML file here</p>
        <input #fileInput type="file" accept=".xml" (change)="onFileSelected($event)" style="display: none;">
      </div>
      <div *ngIf="selectedFile" class="selected-file">
        <mat-icon>description</mat-icon>
        <span>{{ selectedFile.name }}</span>
      </div>
      <div *ngIf="errorMessage" class="error-message">
        <mat-icon>error</mat-icon>
        <span>{{ errorMessage }}</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onLoad()" [disabled]="!selectedFile">
        <mat-icon>folder_open</mat-icon>
        Load Session
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      margin: 16px 0;
      transition: border-color 0.3s ease;
    }
    .upload-area:hover {
      border-color: #2196f3;
    }
    .upload-area mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
    }
    .selected-file {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #e3f2fd;
      border-radius: 4px;
      margin-top: 16px;
    }
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin-top: 16px;
    }
    mat-dialog-actions {
      justify-content: flex-end;
    }
  `]
})
export class LoadSessionDialog {
  selectedFile: File | null = null;
  errorMessage: string = '';

  constructor(
    public dialogRef: MatDialogRef<LoadSessionDialog>,
    private robotService: RobotService
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  private validateAndSetFile(file: File): void {
    this.errorMessage = '';
    
    if (!file.name.toLowerCase().endsWith('.xml')) {
      this.errorMessage = 'Please select an XML file.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.errorMessage = 'File size must be less than 10MB.';
      return;
    }

    this.selectedFile = file;
  }

  onLoad(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const xmlContent = e.target?.result as string;
      if (xmlContent) {
        const success = this.robotService.importFromXML(xmlContent);
        if (success) {
          this.dialogRef.close(true);
        } else {
          this.errorMessage = 'Failed to load session. Please check the XML file format.';
        }
      }
    };
    reader.readAsText(this.selectedFile);
  }
}