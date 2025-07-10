import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KnowledgeBaseService, KnowledgeBaseFile, KnowledgeBaseStats } from '../knowledge-base.service';

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
    MatTooltipModule
  ],
  template: `
    <div class="knowledge-base-container">
      <mat-card class="knowledge-base-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>library_books</mat-icon>
          <mat-card-title>Knowledge Base Manager</mat-card-title>
          <mat-card-subtitle>Manage your uploaded documents and chat context</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Statistics Section -->
          <div class="stats-section" *ngIf="stats.totalFiles > 0">
            <div class="stat-item">
              <mat-icon>folder</mat-icon>
              <div class="stat-content">
                <span class="stat-value">{{ stats.totalFiles }}</span>
                <span class="stat-label">Files</span>
              </div>
            </div>
            <div class="stat-item">
              <mat-icon>storage</mat-icon>
              <div class="stat-content">
                <span class="stat-value">{{ formatFileSize(stats.totalSize) }}</span>
                <span class="stat-label">Total Size</span>
              </div>
            </div>
            <div class="stat-item" *ngIf="stats.lastUploadDate">
              <mat-icon>schedule</mat-icon>
              <div class="stat-content">
                <span class="stat-value">{{ formatDate(stats.lastUploadDate) }}</span>
                <span class="stat-label">Last Upload</span>
              </div>
            </div>
          </div>

          <!-- Files List -->
          <div class="files-section" *ngIf="files.length > 0">
            <h3>Uploaded Documents</h3>
            <div class="files-grid">
              <mat-card *ngFor="let file of files" class="file-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>picture_as_pdf</mat-icon>
                  <mat-card-title>{{ file.name }}</mat-card-title>
                  <mat-card-subtitle>
                    {{ formatFileSize(file.size) }} • {{ formatDate(file.uploadDate) }}
                  </mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="file-info">
                    <div class="reference-count" *ngIf="file.messageIds.length > 0">
                      <mat-icon>chat</mat-icon>
                      <span>Referenced in {{ file.messageIds.length }} message{{ file.messageIds.length > 1 ? 's' : '' }}</span>
                    </div>
                    <div class="file-id">
                      <small>ID: {{ file.id }}</small>
                    </div>
                  </div>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-button color="warn" (click)="deleteFile(file)" matTooltip="Delete file and related messages">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                  <button mat-button (click)="viewFileDetails(file)" matTooltip="View file details">
                    <mat-icon>info</mat-icon>
                    Details
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="files.length === 0">
            <mat-icon>library_books</mat-icon>
            <h3>No documents in knowledge base</h3>
            <p>Upload PDF documents in the chat to add them to your knowledge base</p>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="clearAllFiles()" color="warn" *ngIf="files.length > 0">
            <mat-icon>clear_all</mat-icon>
            Clear All Files
          </button>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to Dashboard
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .knowledge-base-container {
      padding: 24px;
      background: #ffffff;
      min-height: 100vh;
    }

    .knowledge-base-card {
      max-width: 1200px;
      margin: 0 auto;
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
      font-size: 1.5rem;
      font-weight: 600;
      color: #333333;
    }

    .knowledge-base-card .mat-mdc-card-avatar {
      background: #e8f5e8;
      color: #2e7d32;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 16px;
    }

    .stats-section {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-item mat-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-weight: 600;
      font-size: 1.1rem;
      color: #333333;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #666666;
    }

    .files-section {
      margin-bottom: 32px;
    }

    .files-section h3 {
      color: #333333;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

    .file-info {
      margin-top: 12px;
    }

    .reference-count {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .reference-count mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .file-id {
      color: #999;
      font-size: 0.8rem;
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
      margin: 16px 0 8px 0;
      color: #333;
    }

    .empty-state p {
      margin: 0;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .stats-section {
        flex-direction: column;
        gap: 16px;
      }

      .files-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class KnowledgeBaseComponent implements OnInit {
  files: KnowledgeBaseFile[] = [];
  stats: KnowledgeBaseStats = {
    totalFiles: 0,
    totalSize: 0,
    lastUploadDate: null
  };

  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.files = this.knowledgeBaseService.getAllFiles();
    this.stats = this.knowledgeBaseService.getStats();
  }

  deleteFile(file: KnowledgeBaseFile): void {
    const dialogRef = this.dialog.open(DeleteFileDialog, {
      width: '400px',
      data: {
        fileName: file.name,
        messageCount: file.messageIds.length
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const deleteResult = this.knowledgeBaseService.deleteFile(file.id);
        if (deleteResult.success) {
          this.snackBar.open(
            `File "${file.name}" deleted successfully. ${deleteResult.messageIds.length} related message(s) will be removed.`,
            'Close',
            { duration: 5000 }
          );
          this.loadFiles();
        } else {
          this.snackBar.open('Failed to delete file', 'Close', { duration: 3000 });
        }
      }
    });
  }

  clearAllFiles(): void {
    const dialogRef = this.dialog.open(ClearAllFilesDialog, {
      width: '400px',
      data: { fileCount: this.files.length }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.knowledgeBaseService.clearAllFiles();
        this.snackBar.open('All files cleared from knowledge base', 'Close', { duration: 3000 });
        this.loadFiles();
      }
    });
  }

  viewFileDetails(file: KnowledgeBaseFile): void {
    this.dialog.open(FileDetailsDialog, {
      width: '500px',
      data: file
    });
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

  goBack(): void {
    // This will be handled by the router
    window.history.back();
  }
}

// Delete File Confirmation Dialog
@Component({
  selector: 'delete-file-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Delete File</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete "<strong>{{ data.fileName }}</strong>"?</p>
      <p *ngIf="data.messageCount > 0" class="warning-text">
        <mat-icon>warning</mat-icon>
        This will also delete {{ data.messageCount }} message(s) that reference this file.
      </p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="confirm()">Delete</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-text {
      color: #d32f2f;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin: 16px 0;
    }
  `]
})
export class DeleteFileDialog {
  constructor(
    public dialogRef: MatDialogRef<DeleteFileDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { fileName: string; messageCount: number }
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}

// Clear All Files Confirmation Dialog
@Component({
  selector: 'clear-all-files-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Clear All Files</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete all {{ data.fileCount }} files from the knowledge base?</p>
      <p class="warning-text">
        <mat-icon>warning</mat-icon>
        This will also delete all messages that reference these files.
      </p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="confirm()">Clear All</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-text {
      color: #d32f2f;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin: 16px 0;
    }
  `]
})
export class ClearAllFilesDialog {
  constructor(
    public dialogRef: MatDialogRef<ClearAllFilesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { fileCount: number }
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}

// File Details Dialog
@Component({
  selector: 'file-details-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>File Details</h2>
    <mat-dialog-content>
      <div class="file-details">
        <div class="detail-row">
          <strong>Name:</strong> {{ data.name }}
        </div>
        <div class="detail-row">
          <strong>ID:</strong> {{ data.id }}
        </div>
        <div class="detail-row">
          <strong>Size:</strong> {{ formatFileSize(data.size) }}
        </div>
        <div class="detail-row">
          <strong>Upload Date:</strong> {{ formatDate(data.uploadDate) }}
        </div>
        <div class="detail-row">
          <strong>Message References:</strong> {{ data.messageIds.length }}
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .file-details {
      margin: 16px 0;
    }
    .detail-row {
      margin: 8px 0;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
  `]
})
export class FileDetailsDialog {
  constructor(
    public dialogRef: MatDialogRef<FileDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: KnowledgeBaseFile
  ) {}

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

  close(): void {
    this.dialogRef.close();
  }
}