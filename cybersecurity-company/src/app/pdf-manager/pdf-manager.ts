import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RobotService, UploadedFile } from '../robot';

@Component({
  selector: 'app-pdf-manager',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="pdf-manager-content">
      <mat-card class="pdf-manager-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>description</mat-icon>
          <mat-card-title>PDF Document Manager</mat-card-title>
          <mat-card-subtitle>Upload and manage PDF documents</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Upload Section -->
          <div class="upload-section">
            <h3>Upload PDF Document</h3>
            <div class="upload-area" 
                 (click)="fileInput.click()" 
                 (dragover)="onDragOver($event)" 
                 (drop)="onDrop($event)"
                 [class.uploading]="isUploading">
              <mat-icon>cloud_upload</mat-icon>
              <p *ngIf="!isUploading">Click to browse or drag & drop a PDF file here</p>
              <p *ngIf="isUploading">Uploading...</p>
              <input #fileInput type="file" accept=".pdf" (change)="onFileSelected($event)" style="display: none;">
            </div>
            <mat-progress-bar *ngIf="isUploading" mode="indeterminate"></mat-progress-bar>
          </div>

          <!-- File List Section -->
          <div class="file-list-section" *ngIf="uploadedFiles.length > 0">
            <h3>Uploaded Documents</h3>
            <div class="file-grid">
              <mat-card *ngFor="let file of uploadedFiles" class="file-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>picture_as_pdf</mat-icon>
                  <mat-card-title>{{ file.name }}</mat-card-title>
                  <mat-card-subtitle>{{ formatFileSize(file.size) }} • {{ formatDate(file.uploadDate) }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-actions>
                  <button mat-button (click)="viewPdf(file)">
                    <mat-icon>visibility</mat-icon>
                    View
                  </button>
                  <button mat-button (click)="downloadPdf(file)">
                    <mat-icon>download</mat-icon>
                    Download
                  </button>
                  <button mat-button color="warn" (click)="deletePdf(file)">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="uploadedFiles.length === 0">
            <mat-icon>folder_open</mat-icon>
            <h3>No PDF documents uploaded yet</h3>
            <p>Upload your first PDF document to get started</p>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to Dashboard
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .pdf-manager-content {
      padding: 24px;
      background: #ffffff;
      min-height: 100vh;
    }

    .pdf-manager-card {
      max-width: 1200px;
      margin: 0 auto;
      background: #ffffff !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
    }

    .pdf-manager-card mat-card-header {
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      padding: 24px;
      margin: -16px -16px 16px -16px;
    }

    .pdf-manager-card mat-card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333333;
    }

    .pdf-manager-card .mat-mdc-card-avatar {
      background: #e3f2fd;
      color: #1976d2;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 16px;
    }

    .upload-section {
      margin-bottom: 32px;
    }

    .upload-section h3 {
      color: #333333;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .upload-area:hover {
      border-color: #2196f3;
      background: #f3f9ff;
    }

    .upload-area.uploading {
      border-color: #2196f3;
      background: #f3f9ff;
      cursor: not-allowed;
    }

    .upload-area mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
      margin-bottom: 16px;
    }

    .upload-area p {
      color: #666;
      font-size: 1rem;
      margin: 0;
    }

    .file-list-section {
      margin-bottom: 32px;
    }

    .file-list-section h3 {
      color: #333333;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .file-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .file-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .file-card mat-card-header {
      padding: 16px;
    }

    .file-card mat-card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #333333;
    }

    .file-card mat-card-subtitle {
      font-size: 0.875rem;
      color: #666;
    }

    .file-card .mat-mdc-card-avatar {
      background: #ffebee;
      color: #d32f2f;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .file-card mat-card-actions {
      padding: 8px 16px;
      border-top: 1px solid #e0e0e0;
    }

    .file-card mat-card-actions button {
      margin-right: 8px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      color: #333;
      font-size: 1.2rem;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #666;
      font-size: 1rem;
    }

    mat-card-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .pdf-manager-content {
        padding: 16px;
      }
      
      .file-grid {
        grid-template-columns: 1fr;
      }
      
      .upload-area {
        padding: 24px;
      }
    }
  `]
})
export class PdfManagerComponent implements OnInit {
  uploadedFiles: UploadedFile[] = [];
  isUploading = false;

  constructor(
    private robotService: RobotService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUploadedFiles();
  }

  loadUploadedFiles(): void {
    this.uploadedFiles = this.robotService.getUploadedFiles();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file);
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
      this.uploadFile(files[0]);
    }
  }

  uploadFile(file: File): void {
    if (!file.type.includes('pdf')) {
      this.snackBar.open('Please select a PDF file', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      this.snackBar.open('File size must be less than 50MB', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.isUploading = true;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        data: base64Data.split(',')[1] // Remove data URL prefix
      };

      this.robotService.addUploadedFile(uploadedFile);
      this.loadUploadedFiles();
      this.isUploading = false;
      
      this.snackBar.open('PDF uploaded successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    };
    
    reader.onerror = () => {
      this.isUploading = false;
      this.snackBar.open('Error uploading file', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    };
    
    reader.readAsDataURL(file);
  }

  viewPdf(file: UploadedFile): void {
    if (file.data) {
      const dialogRef = this.dialog.open(PdfViewerDialog, {
        width: '90vw',
        height: '90vh',
        maxWidth: '1200px',
        maxHeight: '800px',
        data: file
      });
    }
  }

  downloadPdf(file: UploadedFile): void {
    if (file.data) {
      const binaryString = atob(file.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  deletePdf(file: UploadedFile): void {
    this.robotService.removeUploadedFile(file.name);
    this.loadUploadedFiles();
    this.snackBar.open('PDF deleted successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

@Component({
  selector: 'app-pdf-viewer-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="pdf-viewer-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ data.name }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="dialog-content">
        <iframe 
          [src]="pdfUrl" 
          width="100%" 
          height="100%" 
          style="border: none;"
          title="PDF Viewer">
        </iframe>
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 90vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }

    .dialog-content {
      flex: 1;
      overflow: hidden;
    }

    .dialog-content iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `]
})
export class PdfViewerDialog {
  pdfUrl: SafeResourceUrl | null = null;

  constructor(
    public dialogRef: MatDialogRef<PdfViewerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UploadedFile,
    private sanitizer: DomSanitizer
  ) {
    if (data.data) {
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}