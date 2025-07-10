import { Component, OnInit, ElementRef, ViewChild, OnDestroy, HostListener, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MarkdownPipe } from '../shared/markdown.pipe';
import { LLMSettingsService, ChatMessage, ChatSession } from '../llm-settings.service';
import { KnowledgeBaseService, KnowledgeBaseFile } from '../knowledge-base.service';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    CdkTextareaAutosize,
    MarkdownPipe,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages', { static: false }) chatMessagesElement!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInputElement!: ElementRef;

  currentMessage: string = '';
  isLoading: boolean = false;
  chatSession: ChatSession | null = null;
  isLLMConfigured: boolean = false;
  errorMessage: string = '';
  selectedFile: File | null = null;
  knowledgeBaseFiles: KnowledgeBaseFile[] = [];
  hasUploadedFiles = false;

  constructor(
    private llmSettingsService: LLMSettingsService,
    private knowledgeBaseService: KnowledgeBaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLLMConfigured = this.llmSettingsService.isLLMConfigured();
    if (this.isLLMConfigured) {
      this.loadChatSession();
    }
    this.loadKnowledgeBaseFiles();
    this.cleanupOrphanedMessages();
  }

  ngOnDestroy() {
    // Auto-save chat session when component is destroyed
    if (this.chatSession) {
      this.llmSettingsService.saveCurrentChatSession(this.chatSession);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUploadedFiles) {
      event.preventDefault();
      event.returnValue = 'You have uploaded files that will be deleted when you leave. Are you sure you want to leave?';
    }
  }

  private loadChatSession() {
    this.chatSession = this.llmSettingsService.getCurrentChatSession();
    if (!this.chatSession) {
      this.chatSession = this.llmSettingsService.createNewChatSession();
    }
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private loadKnowledgeBaseFiles(): void {
    this.knowledgeBaseFiles = this.knowledgeBaseService.getAllFiles();
    this.hasUploadedFiles = this.knowledgeBaseFiles.length > 0;
  }

  async sendMessage() {
    if ((!this.currentMessage.trim() && !this.selectedFile) || this.isLoading || !this.isLLMConfigured) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const message = this.currentMessage.trim();
    this.currentMessage = '';
    const file = this.selectedFile;
    this.selectedFile = null; // Clear selected file

    // Convert file to base64 if present and add to knowledge base
    let fileData: { name: string, content: string } | undefined;
    if (file) {
      try {
        const base64Content = await this.readFileAsBase64(file);
        fileData = { name: file.name, content: base64Content };
        
        // Add file to knowledge base
        await this.knowledgeBaseService.addFile(file);
        this.loadKnowledgeBaseFiles();
        this.snackBar.open(`File "${file.name}" added to knowledge base`, 'Close', { duration: 3000 });
      } catch (error) {
        console.error('Error reading file:', error);
        this.errorMessage = 'Error reading file. Please try again.';
        this.isLoading = false;
        return;
      }
    }

    // Begin sending the message but don't await immediately
    const sendPromise = this.llmSettingsService.sendMessage(message, fileData);

    // Immediately refresh chat session so the user's message shows
    // (The user message part of sendMessage in service already handles this)
    this.chatSession = this.llmSettingsService.getCurrentChatSession();
    setTimeout(() => this.scrollToBottom(), 100);


    try {
      await sendPromise;
      // Update chat with assistant response
      this.chatSession = this.llmSettingsService.getCurrentChatSession();
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      this.errorMessage = error instanceof Error ? error.message : 'An error occurred while sending the message';
    } finally {
      this.isLoading = false;
      // Focus back on input
      setTimeout(() => {
        if (this.messageInputElement) {
          this.messageInputElement.nativeElement.focus();
        }
      }, 100);
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // result is DataURL (e.g., data:application/pdf;base64,xxxxx)
        // We need to extract only the base64 part
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      // Basic validation (e.g., file type, size)
      if (file.type !== 'application/pdf') {
        this.errorMessage = 'Only PDF files are allowed.';
        this.selectedFile = null;
        element.value = ''; // Clear the input
        return;
      }
      if (file.size > 32 * 1024 * 1024) { // 32MB limit (as per docs)
        this.errorMessage = 'File size exceeds 32MB limit.';
        this.selectedFile = null;
        element.value = ''; // Clear the input
        return;
      }
      this.selectedFile = file;
      this.errorMessage = ''; // Clear any previous error
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    // Also reset the file input if you have a reference to it
    // e.g., @ViewChild('fileInput') fileInputRef: ElementRef;
    // if (this.fileInputRef) { this.fileInputRef.nativeElement.value = ''; }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    if (confirm('Are you sure you want to clear all chat messages?')) {
      this.llmSettingsService.clearCurrentChatSession();
      this.chatSession = this.llmSettingsService.createNewChatSession();
      this.errorMessage = '';
    }
  }

  deleteMessage(index: number) {
    if (!this.chatSession) {
      return;
    }
    this.chatSession.messages.splice(index, 1);
    this.llmSettingsService.saveCurrentChatSession(this.chatSession);
  }

  async regenerateAssistant() {
    if (!this.chatSession || this.isLoading) {
      return;
    }

    // Remove last assistant message if it is indeed the last message
    if (
      this.chatSession.messages.length &&
      this.chatSession.messages[this.chatSession.messages.length - 1].role === 'assistant'
    ) {
      this.chatSession.messages.pop();
    }

    this.llmSettingsService.saveCurrentChatSession(this.chatSession);

    try {
      this.isLoading = true;
      await this.llmSettingsService.regenerateAssistant();
      // Refresh session to include new assistant response
      this.chatSession = this.llmSettingsService.getCurrentChatSession();
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Error regenerating response:', error);
      this.errorMessage =
        error instanceof Error ? error.message : 'An error occurred while regenerating the response';
    } finally {
      this.isLoading = false;
    }
  }

  private scrollToBottom() {
    if (this.chatMessagesElement) {
      const element = this.chatMessagesElement.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  refreshConfig() {
    this.isLLMConfigured = this.llmSettingsService.isLLMConfigured();
    if (this.isLLMConfigured && !this.chatSession) {
      this.loadChatSession();
    }
  }

  // Helper methods for rendering complex messages in the template
  isUserMessageWithFile(message: ChatMessage): boolean {
    if (message.role === 'user' && Array.isArray(message.content)) {
      return message.content.some(part => part.type === 'file');
    }
    return false;
  }

  getUserMessageFilename(message: ChatMessage): string {
    if (this.isUserMessageWithFile(message)) {
      const filePart = (message.content as Array<any>).find(part => part.type === 'file');
      return filePart?.file?.filename || 'Attached File';
    }
    return '';
  }

  getTextFromMessage(message: ChatMessage): string {
    if (Array.isArray(message.content)) {
      const textPart = message.content.find(part => part.type === 'text');
      return textPart ? (textPart as any).text : '';
    }
    return message.content as string; // Fallback for simple string content (e.g., assistant messages)
  }

  // Knowledge base management methods
  viewKnowledgeBaseFile(file: KnowledgeBaseFile): void {
    const dialogRef = this.dialog.open(PdfViewerDialog, {
      width: '90vw',
      height: '90vh',
      data: file
    });
  }

  deleteKnowledgeBaseFile(file: KnowledgeBaseFile): void {
    if (confirm(`Are you sure you want to delete "${file.name}" from the knowledge base? This will also remove it from any chat messages that reference it.`)) {
      const success = this.knowledgeBaseService.deleteFile(file.id);
      if (success) {
        // Remove messages that reference this file
        this.llmSettingsService.removeMessagesWithDeletedFiles([file.name]);
        this.loadKnowledgeBaseFiles();
        this.loadChatSession(); // Refresh chat to show updated messages
        this.snackBar.open(`Deleted ${file.name} from knowledge base`, 'Close', { duration: 2000 });
      } else {
        this.snackBar.open(`Error deleting ${file.name}`, 'Close', { duration: 3000 });
      }
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

  // Clean up orphaned messages that reference deleted files
  private cleanupOrphanedMessages(): void {
    const existingFileNames = this.knowledgeBaseFiles.map(file => file.name);
    const session = this.llmSettingsService.getCurrentChatSession();
    
    if (!session) return;

    const orphanedFileNames: string[] = [];
    session.messages.forEach(message => {
      if (message.role === 'user' && Array.isArray(message.content)) {
        const fileParts = message.content.filter(part => part.type === 'file');
        fileParts.forEach(filePart => {
          const filename = (filePart as any).file.filename;
          if (!existingFileNames.includes(filename) && !orphanedFileNames.includes(filename)) {
            orphanedFileNames.push(filename);
          }
        });
      }
    });

    if (orphanedFileNames.length > 0) {
      this.llmSettingsService.removeMessagesWithDeletedFiles(orphanedFileNames);
      this.loadChatSession(); // Refresh chat to show updated messages
    }
  }
}

// PDF Viewer Dialog Component for Chat
@Component({
  selector: 'pdf-viewer-dialog-chat',
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