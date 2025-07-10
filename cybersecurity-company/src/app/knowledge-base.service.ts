import { Injectable } from '@angular/core';
import { ChatIntegrationService } from './chat-integration.service';

export interface KnowledgeBaseFile {
  id: string;
  name: string;
  content: string; // base64 encoded
  uploadDate: Date;
  size: number;
  messageIds: string[]; // IDs of messages that reference this file
}

export interface KnowledgeBaseStats {
  totalFiles: number;
  totalSize: number;
  lastUploadDate: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {
  private storageKey = 'knowledgeBase';
  private messageIdsKey = 'knowledgeBaseMessageIds';

  constructor(private chatIntegrationService: ChatIntegrationService) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Add a file to the knowledge base
   */
  addFile(file: File, content: string): KnowledgeBaseFile {
    const knowledgeBaseFile: KnowledgeBaseFile = {
      id: this.generateFileId(),
      name: file.name,
      content: content,
      uploadDate: new Date(),
      size: file.size,
      messageIds: []
    };

    const files = this.getAllFiles();
    files.push(knowledgeBaseFile);
    this.saveFiles(files);

    return knowledgeBaseFile;
  }

  /**
   * Get all files in the knowledge base
   */
  getAllFiles(): KnowledgeBaseFile[] {
    if (!this.isBrowser()) {
      return [];
    }

    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const files = JSON.parse(stored);
        return files.map((file: any) => ({
          ...file,
          uploadDate: new Date(file.uploadDate)
        }));
      } catch (e) {
        console.error('Error parsing knowledge base files:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * Get a specific file by ID
   */
  getFileById(id: string): KnowledgeBaseFile | null {
    const files = this.getAllFiles();
    return files.find(file => file.id === id) || null;
  }

  /**
   * Delete a file from the knowledge base
   */
  deleteFile(id: string): { success: boolean; messageIds: string[] } {
    const files = this.getAllFiles();
    const fileIndex = files.findIndex(file => file.id === id);
    
    if (fileIndex === -1) {
      return { success: false, messageIds: [] };
    }

    const file = files[fileIndex];
    const messageIds = [...file.messageIds]; // Copy the array

    // Remove the file
    files.splice(fileIndex, 1);
    this.saveFiles(files);

    // Delete related messages from chat session
    this.chatIntegrationService.deleteMessagesByFileId(id);

    return { success: true, messageIds };
  }

  /**
   * Add a message ID to a file's reference list
   */
  addMessageReference(fileId: string, messageId: string): void {
    const files = this.getAllFiles();
    const file = files.find(f => f.id === fileId);
    
    if (file && !file.messageIds.includes(messageId)) {
      file.messageIds.push(messageId);
      this.saveFiles(files);
    }
  }

  /**
   * Remove a message ID from a file's reference list
   */
  removeMessageReference(fileId: string, messageId: string): void {
    const files = this.getAllFiles();
    const file = files.find(f => f.id === fileId);
    
    if (file) {
      file.messageIds = file.messageIds.filter(id => id !== messageId);
      this.saveFiles(files);
    }
  }

  /**
   * Get all files that are referenced by a specific message
   */
  getFilesByMessageId(messageId: string): KnowledgeBaseFile[] {
    const files = this.getAllFiles();
    return files.filter(file => file.messageIds.includes(messageId));
  }

  /**
   * Get knowledge base statistics
   */
  getStats(): KnowledgeBaseStats {
    const files = this.getAllFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const lastUploadDate = files.length > 0 
      ? new Date(Math.max(...files.map(f => f.uploadDate.getTime())))
      : null;

    return {
      totalFiles: files.length,
      totalSize,
      lastUploadDate
    };
  }

  /**
   * Clear all files from the knowledge base
   */
  clearAllFiles(): void {
    if (!this.isBrowser()) {
      return;
    }
    
    // Get all file IDs before clearing
    const files = this.getAllFiles();
    const fileIds = files.map(file => file.id);
    
    // Clear storage
    localStorage.removeItem(this.storageKey);
    
    // Delete related messages from chat session
    this.chatIntegrationService.deleteMessagesByFileIds(fileIds);
  }

  /**
   * Check if a file with the same name already exists
   */
  fileExists(fileName: string): boolean {
    const files = this.getAllFiles();
    return files.some(file => file.name === fileName);
  }

  /**
   * Update file metadata
   */
  updateFileMetadata(id: string, updates: Partial<KnowledgeBaseFile>): boolean {
    const files = this.getAllFiles();
    const fileIndex = files.findIndex(file => file.id === id);
    
    if (fileIndex === -1) {
      return false;
    }

    files[fileIndex] = { ...files[fileIndex], ...updates };
    this.saveFiles(files);
    return true;
  }

  private saveFiles(files: KnowledgeBaseFile[]): void {
    if (!this.isBrowser()) {
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(files));
  }

  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}