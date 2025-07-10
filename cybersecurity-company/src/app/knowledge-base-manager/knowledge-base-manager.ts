import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { KnowledgeBaseService, KnowledgeBaseDocument } from '../knowledge-base.service';
import { LLMSettingsService } from '../llm-settings.service';

@Component({
  selector: 'app-knowledge-base-manager',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="knowledge-base-content">
      <mat-card class="knowledge-base-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>library_books</mat-icon>
          <mat-card-title>Knowledge Base Manager</mat-card-title>
          <mat-card-subtitle>Manage your AI assistant's knowledge base documents</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Statistics Section -->
          <div class="stats-section">
            <div class="stat-item">
              <mat-icon>description</mat-icon>
              <span class="stat-value">{{ stats.totalDocuments }}</span>
              <span class="stat-label">Documents</span>
            </div>
            <div class="stat-item">
              <mat-icon>storage</mat-icon>
              <span class="stat-value">{{ formatFileSize(stats.totalSize) }}</span>
              <span class="stat-label">Total Size</span>
            </div>
            <div class="stat-item">
              <mat-icon>chat</mat-icon>
              <span class="stat-value">{{ stats.referencedDocuments }}</span>
              <span class="stat-label">Referenced in Chat</span>
            </div>
          </div>

          <!-- Upload Section -->
          <div class="upload-section">
            <h3>Upload New Document</h3>
            <div class="upload-area" 
                 (click)="fileInput.click()" 
                 (dragover)="onDragOver($event)" 
                 (drop)="onDrop($event)"
                 [class.uploading]="isUploading">
              <mat-icon>cloud_upload</mat-icon>
              <p *ngIf="!isUploading">Click to browse or drag & drop a PDF file here</p>
              <p *ngIf="isUploading">Uploading to knowledge base...</p>
              <input #fileInput type="file" accept=".pdf" (change)="onFileSelected($event)" style="display: none;">
            </div>
            <mat-progress-bar *ngIf="isUploading" mode="indeterminate"></mat-progress-bar>
          </div>

          <!-- Search Section -->
          <div class="search-section" *ngIf="documents.length > 0">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search documents</mat-label>
              <input matInput [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search by name, description, or tags">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>

          <!-- Documents List Section -->
          <div class="documents-list-section" *ngIf="filteredDocuments.length > 0">
            <h3>Documents ({{ filteredDocuments.length }})</h3>
            <div class="documents-grid">
              <mat-card *ngFor="let document of filteredDocuments" class="document-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar [class.referenced]="isDocumentReferenced(document.id)">picture_as_pdf</mat-icon>
                  <mat-card-title>{{ document.name }}</mat-card-title>
                  <mat-card-subtitle>
                    {{ formatFileSize(document.size) }} • {{ formatDate(document.uploadDate) }}
                    <span *ngIf="isDocumentReferenced(document.id)" class="referenced-badge">
                      <mat-icon>chat</mat-icon> Referenced in chat
                    </span>
                  </mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content *ngIf="document.description">
                  <p class="document-description">{{ document.description }}</p>
                </mat-card-content>

                <div *ngIf="document.tags && document.tags.length > 0" class="tags-section">
                  <mat-chip-listbox>
                    <mat-chip *ngFor="let tag of document.tags">{{ tag }}</mat-chip>
                  </mat-chip-listbox>
                </div>

                <mat-card-actions>
                  <button mat-button (click)="viewDocument(document)">
                    <mat-icon>visibility</mat-icon>
                    View
                  </button>
                  <button mat-button (click)="editDocument(document)">
                    <mat-icon>edit</mat-icon>
                    Edit
                  </button>
                  <button mat-button (click)="downloadDocument(document)">
                    <mat-icon>download</mat-icon>
                    Download
                  </button>
                  <button mat-button color="warn" (click)="deleteDocument(document)">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="documents.length === 0">
            <mat-icon>library_books</mat-icon>
            <h3>No documents in knowledge base yet</h3>
            <p>Upload your first document to start building your AI assistant's knowledge base</p>
          </div>

          <!-- No Search Results -->
          <div class="empty-state" *ngIf="documents.length > 0 && filteredDocuments.length === 0">
            <mat-icon>search_off</mat-icon>
            <h3>No documents match your search</h3>
            <p>Try adjusting your search terms or clear the search to see all documents</p>
            <button mat-raised-button (click)="clearSearch()">Clear Search</button>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to Dashboard
          </button>
          <button mat-raised-button color="primary" (click)="openBulkUploadDialog()" [disabled]="documents.length === 0">
            <mat-icon>upload_file</mat-icon>
            Bulk Actions
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .knowledge-base-content {
      padding: 24px;
      background: #ffffff;
      min-height: 100vh;
    }

    .knowledge-base-card {
      max-width: 1400px;
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

    .stats-section {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      justify-content: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      min-width: 120px;
    }

    .stat-item mat-icon {
      color: #1976d2;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
      margin-top: 4px;
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

    .search-section {
      margin-bottom: 32px;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .documents-list-section {
      margin-bottom: 32px;
    }

    .documents-list-section h3 {
      color: #333333;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }

    .document-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .document-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .document-card mat-card-header {
      padding: 16px;
    }

    .document-card mat-card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #333333;
    }

    .document-card mat-card-subtitle {
      font-size: 0.875rem;
      color: #666;
    }

    .document-card .mat-mdc-card-avatar {
      background: #ffebee;
      color: #d32f2f;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .document-card .mat-mdc-card-avatar.referenced {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .referenced-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 8px;
      color: #2e7d32;
      font-size: 0.75rem;
    }

    .referenced-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .document-description {
      color: #666;
      font-size: 0.875rem;
      margin: 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tags-section {
      padding: 0 16px 8px;
    }

    .document-card mat-card-actions {
      padding: 8px 16px;
      border-top: 1px solid #e0e0e0;
    }

    .document-card mat-card-actions button {
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
      .knowledge-base-content {
        padding: 16px;
      }
      
      .documents-grid {
        grid-template-columns: 1fr;
      }
      
      .upload-area {
        padding: 24px;
      }

      .stats-section {
        flex-wrap: wrap;
        gap: 16px;
      }

      .stat-item {
        min-width: 100px;
      }
    }
  `]
})
export class KnowledgeBaseManagerComponent implements OnInit {
  documents: KnowledgeBaseDocument[] = [];
  filteredDocuments: KnowledgeBaseDocument[] = [];
  isUploading = false;
  searchQuery = '';
  stats = { totalDocuments: 0, totalSize: 0, referencedDocuments: 0 };

  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private llmSettingsService: LLMSettingsService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
    this.updateStats();
  }

  loadDocuments(): void {
    this.documents = this.knowledgeBaseService.getAllDocuments();
    this.filteredDocuments = [...this.documents];
  }

  updateStats(): void {
    this.stats = this.knowledgeBaseService.getDocumentStats();
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
      const base64Content = base64Data.split(',')[1]; // Remove data URL prefix

      try {
        this.knowledgeBaseService.addDocument({
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString(),
          data: base64Content,
          description: `Uploaded to knowledge base on ${new Date().toLocaleDateString()}`
        });

        this.loadDocuments();
        this.updateStats();
        this.isUploading = false;
        
        this.snackBar.open('PDF added to knowledge base successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      } catch (error) {
        this.isUploading = false;
        this.snackBar.open('Error adding file to knowledge base', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    };
    
    reader.onerror = () => {
      this.isUploading = false;
      this.snackBar.open('Error reading file', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    };
    
    reader.readAsDataURL(file);
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredDocuments = [...this.documents];
      return;
    }

    this.filteredDocuments = this.knowledgeBaseService.searchDocuments(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredDocuments = [...this.documents];
  }

  isDocumentReferenced(documentId: string): boolean {
    return this.knowledgeBaseService.getReferencesForDocument(documentId).length > 0;
  }

  viewDocument(document: KnowledgeBaseDocument): void {
    this.dialog.open(DocumentViewerDialog, {
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
      maxHeight: '800px',
      data: document
    });
  }

  editDocument(document: KnowledgeBaseDocument): void {
    const dialogRef = this.dialog.open(DocumentEditDialog, {
      width: '500px',
      data: { ...document }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.knowledgeBaseService.updateDocument(document.id, result);
        this.loadDocuments();
        this.snackBar.open('Document updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  downloadDocument(document: KnowledgeBaseDocument): void {
    if (document.data) {
      const binaryString = atob(document.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  deleteDocument(document: KnowledgeBaseDocument): void {
    const references = this.knowledgeBaseService.getReferencesForDocument(document.id);
    
    let confirmMessage = `Are you sure you want to delete "${document.name}"?`;
    if (references.length > 0) {
      confirmMessage += ` This document is referenced in ${references.length} chat message(s). Deleting it will also remove those messages.`;
    }

    if (confirm(confirmMessage)) {
      // First, handle cascade delete of chat messages
      if (references.length > 0) {
        // Group references by session
        const sessionGroups = references.reduce((groups, ref) => {
          if (!groups[ref.sessionId]) {
            groups[ref.sessionId] = [];
          }
          groups[ref.sessionId].push(ref.messageIndex);
          return groups;
        }, {} as { [sessionId: string]: number[] });

        // For the current session, remove affected messages
        const currentSession = this.llmSettingsService.getCurrentChatSession();
        if (currentSession && sessionGroups[currentSession.id]) {
          const indicesToRemove = sessionGroups[currentSession.id].sort((a, b) => b - a); // Sort descending
          for (const index of indicesToRemove) {
            if (index < currentSession.messages.length) {
              currentSession.messages.splice(index, 1);
            }
          }
          this.llmSettingsService.saveCurrentChatSession(currentSession);
        }
      }

      // Delete the document
      this.knowledgeBaseService.deleteDocument(document.id);
      this.loadDocuments();
      this.updateStats();
      
      let message = 'Document deleted successfully';
      if (references.length > 0) {
        message += ` and ${references.length} related chat message(s) removed`;
      }
      
      this.snackBar.open(message, 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  openBulkUploadDialog(): void {
    // Placeholder for bulk operations dialog
    this.snackBar.open('Bulk operations coming soon!', 'Close', {
      duration: 2000,
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

// Document Viewer Dialog
@Component({
  selector: 'app-document-viewer-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="document-viewer-dialog">
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
    .document-viewer-dialog {
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
export class DocumentViewerDialog {
  pdfUrl: SafeResourceUrl | null = null;

  constructor(
    public dialogRef: MatDialogRef<DocumentViewerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: KnowledgeBaseDocument,
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

// Document Edit Dialog
@Component({
  selector: 'app-document-edit-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatChipsModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Edit Document</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Document Name</mat-label>
        <input matInput [(ngModel)]="editData.name" placeholder="Enter document name">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="editData.description" placeholder="Enter document description" rows="3"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tags (comma-separated)</mat-label>
        <input matInput [(ngModel)]="tagsInput" (input)="onTagsChange()" placeholder="Enter tags separated by commas">
      </mat-form-field>

      <div *ngIf="editData.tags && editData.tags.length > 0" class="tags-preview">
        <mat-chip-listbox>
          <mat-chip *ngFor="let tag of editData.tags">{{ tag }}</mat-chip>
        </mat-chip-listbox>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!editData.name?.trim()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .tags-preview {
      margin-top: 8px;
    }

    mat-dialog-content {
      min-width: 400px;
    }
  `]
})
export class DocumentEditDialog {
  editData: Partial<KnowledgeBaseDocument>;
  tagsInput = '';

  constructor(
    public dialogRef: MatDialogRef<DocumentEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: KnowledgeBaseDocument
  ) {
    this.editData = { ...data };
    this.tagsInput = data.tags?.join(', ') || '';
  }

  onTagsChange(): void {
    this.editData.tags = this.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  save(): void {
    this.dialogRef.close(this.editData);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}