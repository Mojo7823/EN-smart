import { Injectable } from '@angular/core';

export interface KnowledgeBaseFile {
  id: string;
  name: string;
  content: string; // base64 encoded
  extractedText?: string; // extracted text content for LLM
  size: number;
  uploadDate: Date;
  lastUsed: Date;
  usageCount: number;
}

export interface KnowledgeBaseStats {
  totalFiles: number;
  totalSize: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {
  private readonly STORAGE_KEY = 'knowledgeBase';
  private readonly STATS_KEY = 'knowledgeBaseStats';
  private files: Map<string, KnowledgeBaseFile> = new Map();
  private stats: KnowledgeBaseStats = {
    totalFiles: 0,
    totalSize: 0,
    lastUpdated: new Date()
  };

  constructor() {
    this.loadFromStorage();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private loadFromStorage(): void {
    if (!this.isBrowser()) return;

    try {
      // Load files
      const storedFiles = localStorage.getItem(this.STORAGE_KEY);
      if (storedFiles) {
        const filesArray = JSON.parse(storedFiles);
        this.files.clear();
        filesArray.forEach((file: any) => {
          file.uploadDate = new Date(file.uploadDate);
          file.lastUsed = new Date(file.lastUsed);
          this.files.set(file.id, file);
        });
      }

      // Load stats
      const storedStats = localStorage.getItem(this.STATS_KEY);
      if (storedStats) {
        this.stats = JSON.parse(storedStats);
        this.stats.lastUpdated = new Date(this.stats.lastUpdated);
      }
    } catch (error) {
      console.error('Error loading knowledge base from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (!this.isBrowser()) return;

    try {
      // Save files
      const filesArray = Array.from(this.files.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filesArray));

      // Save stats
      this.stats.lastUpdated = new Date();
      localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving knowledge base to storage:', error);
    }
  }

  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async addFile(file: File): Promise<KnowledgeBaseFile> {
    const content = await this.readFileAsBase64(file);
    
    const knowledgeFile: KnowledgeBaseFile = {
      id: this.generateFileId(),
      name: file.name,
      content: content,
      size: file.size,
      uploadDate: new Date(),
      lastUsed: new Date(),
      usageCount: 0
    };

    this.files.set(knowledgeFile.id, knowledgeFile);
    this.updateStats();
    this.saveToStorage();

    // Extract text asynchronously after the file is stored
    if (file.type === 'application/pdf') {
      this.extractTextFromPDFAsync(knowledgeFile.id, content);
    }

    return knowledgeFile;
  }

  private async extractTextFromPDFAsync(fileId: string, base64Content: string): Promise<void> {
    // Only extract text in browser environment
    if (!this.isBrowser()) {
      return;
    }

    try {
      const extractedText = await this.extractTextFromPDF(base64Content);
      
      // Update the file with extracted text
      const file = this.files.get(fileId);
      if (file) {
        file.extractedText = extractedText;
        this.saveToStorage();
      }
    } catch (error) {
      console.warn('Failed to extract text from PDF:', error);
    }
  }

  async getExtractedTextForFile(fileId: string): Promise<string | undefined> {
    const file = this.files.get(fileId);
    if (!file) return undefined;

    // If we already have extracted text, return it
    if (file.extractedText) {
      return file.extractedText;
    }

    // If it's a PDF and we don't have extracted text yet, try to extract it now
    if (file.name.toLowerCase().endsWith('.pdf') && this.isBrowser()) {
      try {
        const extractedText = await this.extractTextFromPDF(file.content);
        file.extractedText = extractedText;
        this.saveToStorage();
        return extractedText;
      } catch (error) {
        console.warn('Failed to extract text from PDF:', error);
        return undefined;
      }
    }

    return undefined;
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  getFile(id: string): KnowledgeBaseFile | undefined {
    const file = this.files.get(id);
    if (file) {
      file.lastUsed = new Date();
      file.usageCount++;
      this.saveToStorage();
    }
    return file;
  }

  getAllFiles(): KnowledgeBaseFile[] {
    return Array.from(this.files.values()).sort((a, b) => 
      b.lastUsed.getTime() - a.lastUsed.getTime()
    );
  }

  deleteFile(id: string): boolean {
    const file = this.files.get(id);
    if (file) {
      this.files.delete(id);
      this.updateStats();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteFileByName(name: string): boolean {
    const file = this.getFileByName(name);
    if (file) {
      return this.deleteFile(file.id);
    }
    return false;
  }

  deleteFiles(ids: string[]): string[] {
    const deletedIds: string[] = [];
    ids.forEach(id => {
      if (this.deleteFile(id)) {
        deletedIds.push(id);
      }
    });
    return deletedIds;
  }

  getFilesForContext(): KnowledgeBaseFile[] {
    // Return files that have been used recently or frequently
    return Array.from(this.files.values())
      .filter(file => file.usageCount > 0 || 
        (Date.now() - file.lastUsed.getTime()) < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.usageCount - a.usageCount || 
        b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  getStats(): KnowledgeBaseStats {
    return { ...this.stats };
  }

  private updateStats(): void {
    this.stats.totalFiles = this.files.size;
    this.stats.totalSize = Array.from(this.files.values())
      .reduce((total, file) => total + file.size, 0);
    this.stats.lastUpdated = new Date();
  }

  clearAll(): void {
    this.files.clear();
    this.updateStats();
    this.saveToStorage();
  }

  // Get file content as data URL for viewing
  getFileDataUrl(file: KnowledgeBaseFile): string {
    return `data:application/pdf;base64,${file.content}`;
  }

  // Check if file exists by name
  fileExists(name: string): boolean {
    return Array.from(this.files.values()).some(file => file.name === name);
  }

  // Get file by name
  getFileByName(name: string): KnowledgeBaseFile | undefined {
    return Array.from(this.files.values()).find(file => file.name === name);
  }

  private async extractTextFromPDF(base64Content: string): Promise<string> {
    try {
      // Dynamically import PDF.js only in browser environment
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configure PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      // Convert base64 to Uint8Array
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      let extractedText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with proper spacing
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += `Page ${pageNum}:\n${pageText}\n\n`;
      }

      return extractedText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  }
}