import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { KnowledgeBaseService, KnowledgeBaseFile } from '../knowledge-base.service';

@Component({
  selector: 'app-knowledge-base',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="knowledge-base-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>library_books</mat-icon>
        <mat-card-title>Knowledge Base</mat-card-title>
        <mat-card-subtitle>
          {{ stats.totalFiles }} files • {{ formatFileSize(stats.totalSize) }}
          <span *ngIf="stats.totalFiles > 0">• Last updated: {{ formatDate(stats.lastUpdated) }}</span>
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Upload Section -->
        <div class="upload-section" *ngIf="!isUploading">
          <div class="upload-area" 
               (click)="fileInput.click()" 
               (dragover)="onDragOver($event)" 
               (drop)="onDrop($event)">
            <mat-icon>cloud_upload</mat-icon>
            <p>Click to browse or drag & drop PDF files here</p>
            <small>Files will be available for AI assistant context</small>
          </div>
          <input #fileInput type="file" accept=".pdf" (change)="onFileSelected($event)" style="display: none;" multiple>
        </div>

        <mat-progress-bar *ngIf="isUploading" mode="indeterminate"></mat-progress-bar>

        <!-- Files List -->
        <div class="files-section" *ngIf="files.length > 0">
          <h3>Uploaded Files</h3>
          <div class="files-grid">
            <mat-card *ngFor="let file of files" class="file-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>picture_as_pdf</mat-icon>
                <mat-card-title>{{ file.name }}</mat-card-title>
                <mat-card-subtitle>
                  {{ formatFileSize(file.size) }} • {{ formatDate(file.uploadDate) }}
                  <br>
                  <small>Used {{ file.usageCount }} times • Last used: {{ formatDate(file.lastUsed) }}</small>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-actions>
                <button mat-button (click)="viewFile(file)" matTooltip="View PDF">
                  <mat-icon>visibility</mat-icon>
                  View
                </button>
                <button mat-button (click)="downloadFile(file)" matTooltip="Download PDF">
                  <mat-icon>download</mat-icon>
                  Download
                </button>
                <button mat-button color="warn" (click)="deleteFile(file)" matTooltip="Delete file">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="files.length === 0 && !isUploading">
          <mat-icon>folder_open</mat-icon>
          <h3>No files in knowledge base</h3>
          <p>Upload PDF files to provide context for the AI assistant</p>
        </div>
      </mat-card-content>

      <mat-card-actions *ngIf="files.length > 0">
        <button mat-button (click)="clearAll()" color="warn">
          <mat-icon>clear_all</mat-icon>
          Clear All
        </button>
        <span class="spacer"></span>
        <button mat-button (click)="refreshFiles()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .knowledge-base-card {
      margin-bottom: 24px;
      background: #ffffff !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
    }

    .knowledge-base-card mat-card-header {
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      padding: 24px;
      margin: -16px -16px 16px -16px;
    }

    .knowledge-base-card mat-card-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333333;
    }

    .knowledge-base-card .mat-mdc-card-avatar {
      background: #e8f5e8;
      color: #2e7d32;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 16px;
    }

    .upload-section {
      margin-bottom: 24px;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .upload-area:hover {
      border-color: #4caf50;
      background: #f1f8e9;
    }

    .upload-area mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #666;
      margin-bottom: 12px;
    }

    .upload-area p {
      color: #666;
      font-size: 1rem;
      margin: 8px 0 4px 0;
    }

    .upload-area small {
      color: #999;
      font-size: 0.875rem;
    }

    .files-section {
      margin-bottom: 24px;
    }

    .files-section h3 {
      color: #333333;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .file-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .file-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .file-card mat-card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #333333;
      margin-bottom: 4px;
    }

    .file-card mat-card-subtitle {
      color: #666;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .file-card .mat-mdc-card-avatar {
      background: #fff3e0;
      color: #f57c00;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 12px;
    }

    .file-card mat-card-actions {
      padding: 8px 16px 16px 16px;
      display: flex;
      gap: 8px;
    }

    .file-card mat-card-actions button {
      flex: 1;
      min-width: 0;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
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
      font-weight: 600;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #666;
      font-size: 1rem;
      margin: 0;
    }

    .spacer {
      flex: 1;
    }

    mat-card-actions {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      margin: 16px -16px -16px -16px;
    }
  `]
})
export class KnowledgeBaseComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  files: KnowledgeBaseFile[] = [];
  stats: any = { totalFiles: 0, totalSize: 0, lastUpdated: new Date() };
  isUploading = false;

  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadFiles(): void {
    this.files = this.knowledgeBaseService.getAllFiles();
    this.stats = this.knowledgeBaseService.getStats();
  }

  refreshFiles(): void {
    this.loadFiles();
    this.snackBar.open('Knowledge base refreshed', 'Close', { duration: 2000 });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      this.uploadFiles(Array.from(files));
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
      this.uploadFiles(Array.from(files));
    }
  }

  async uploadFiles(files: File[]): Promise<void> {
    this.isUploading = true;
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        if (file.type !== 'application/pdf') {
          this.snackBar.open(`Skipped ${file.name}: Only PDF files are allowed`, 'Close', { duration: 3000 });
          errorCount++;
          continue;
        }

        if (file.size > 32 * 1024 * 1024) {
          this.snackBar.open(`Skipped ${file.name}: File size exceeds 32MB limit`, 'Close', { duration: 3000 });
          errorCount++;
          continue;
        }

        await this.knowledgeBaseService.addFile(file);
        successCount++;
      } catch (error) {
        console.error('Error uploading file:', error);
        this.snackBar.open(`Error uploading ${file.name}`, 'Close', { duration: 3000 });
        errorCount++;
      }
    }

    this.isUploading = false;
    this.loadFiles();

    if (successCount > 0) {
      this.snackBar.open(`Successfully uploaded ${successCount} file(s)`, 'Close', { duration: 3000 });
    }
  }

  viewFile(file: KnowledgeBaseFile): void {
    const dialogRef = this.dialog.open(PdfViewerDialog, {
      width: '90vw',
      height: '90vh',
      data: file
    });
  }

  downloadFile(file: KnowledgeBaseFile): void {
    const dataUrl = this.knowledgeBaseService.getFileDataUrl(file);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteFile(file: KnowledgeBaseFile): void {
    if (confirm(`Are you sure you want to delete "${file.name}"? This will also remove it from any chat messages that reference it.`)) {
      const success = this.knowledgeBaseService.deleteFile(file.id);
      if (success) {
        this.loadFiles();
        this.snackBar.open(`Deleted ${file.name}`, 'Close', { duration: 2000 });
      } else {
        this.snackBar.open(`Error deleting ${file.name}`, 'Close', { duration: 3000 });
      }
    }
  }

  clearAll(): void {
    if (confirm('Are you sure you want to delete all files from the knowledge base? This action cannot be undone.')) {
      this.knowledgeBaseService.clearAll();
      this.loadFiles();
      this.snackBar.open('All files deleted from knowledge base', 'Close', { duration: 3000 });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// PDF Viewer Dialog Component
@Component({
  selector: 'pdf-viewer-dialog-kb',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>picture_as_pdf</mat-icon>
      {{ data.name }}
    </h2>
    <mat-dialog-content>
      <iframe [src]="pdfUrl" width="100%" height="100%" style="border: none;"></iframe>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="download()">
        <mat-icon>download</mat-icon>
        Download
      </button>
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      height: calc(90vh - 120px);
      padding: 0;
    }
    
    iframe {
      width: 100%;
      height: 100%;
    }
    
    h2 mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class PdfViewerDialog {
  pdfUrl: SafeResourceUrl;

  constructor(
    public dialogRef: MatDialogRef<PdfViewerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: KnowledgeBaseFile,
    private sanitizer: DomSanitizer,
    private knowledgeBaseService: KnowledgeBaseService
  ) {
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.knowledgeBaseService.getFileDataUrl(data)
    );
  }

  download(): void {
    const dataUrl = this.knowledgeBaseService.getFileDataUrl(this.data);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = this.data.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  close(): void {
    this.dialogRef.close();
  }
}