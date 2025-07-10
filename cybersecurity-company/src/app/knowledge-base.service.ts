import { Injectable } from '@angular/core';

export interface KnowledgeBaseDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  data: string; // Base64 encoded content
  description?: string;
  tags?: string[];
}

export interface DocumentReference {
  documentId: string;
  messageIndex: number;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {
  private documentsKey = 'knowledgeBaseDocuments';
  private documentReferencesKey = 'documentReferences';

  constructor() {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  // Document management
  getAllDocuments(): KnowledgeBaseDocument[] {
    if (!this.isBrowser()) {
      return [];
    }
    
    const stored = localStorage.getItem(this.documentsKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing knowledge base documents:', e);
        return [];
      }
    }
    return [];
  }

  getDocumentById(id: string): KnowledgeBaseDocument | null {
    const documents = this.getAllDocuments();
    return documents.find(doc => doc.id === id) || null;
  }

  addDocument(document: Omit<KnowledgeBaseDocument, 'id'>): KnowledgeBaseDocument {
    if (!this.isBrowser()) {
      throw new Error('Cannot add document: localStorage not available');
    }

    const newDocument: KnowledgeBaseDocument = {
      ...document,
      id: this.generateDocumentId()
    };

    const documents = this.getAllDocuments();
    documents.push(newDocument);
    localStorage.setItem(this.documentsKey, JSON.stringify(documents));
    
    return newDocument;
  }

  updateDocument(id: string, updates: Partial<KnowledgeBaseDocument>): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    const documents = this.getAllDocuments();
    const index = documents.findIndex(doc => doc.id === id);
    
    if (index === -1) {
      return false;
    }

    documents[index] = { ...documents[index], ...updates };
    localStorage.setItem(this.documentsKey, JSON.stringify(documents));
    return true;
  }

  deleteDocument(id: string): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    const documents = this.getAllDocuments();
    const filteredDocuments = documents.filter(doc => doc.id !== id);
    
    if (filteredDocuments.length === documents.length) {
      return false; // Document not found
    }

    localStorage.setItem(this.documentsKey, JSON.stringify(filteredDocuments));
    
    // Also clean up document references
    this.removeDocumentReferences(id);
    
    return true;
  }

  // Document reference tracking
  addDocumentReference(documentId: string, sessionId: string, messageIndex: number): void {
    if (!this.isBrowser()) {
      return;
    }

    const references = this.getDocumentReferences();
    const newReference: DocumentReference = {
      documentId,
      sessionId,
      messageIndex
    };

    references.push(newReference);
    localStorage.setItem(this.documentReferencesKey, JSON.stringify(references));
  }

  getDocumentReferences(): DocumentReference[] {
    if (!this.isBrowser()) {
      return [];
    }

    const stored = localStorage.getItem(this.documentReferencesKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing document references:', e);
        return [];
      }
    }
    return [];
  }

  getReferencesForDocument(documentId: string): DocumentReference[] {
    return this.getDocumentReferences().filter(ref => ref.documentId === documentId);
  }

  removeDocumentReferences(documentId: string): void {
    if (!this.isBrowser()) {
      return;
    }

    const references = this.getDocumentReferences();
    const filteredReferences = references.filter(ref => ref.documentId !== documentId);
    localStorage.setItem(this.documentReferencesKey, JSON.stringify(filteredReferences));
  }

  removeMessageReference(sessionId: string, messageIndex: number): void {
    if (!this.isBrowser()) {
      return;
    }

    const references = this.getDocumentReferences();
    const filteredReferences = references.filter(
      ref => !(ref.sessionId === sessionId && ref.messageIndex === messageIndex)
    );
    localStorage.setItem(this.documentReferencesKey, JSON.stringify(filteredReferences));
  }

  // Utility methods
  private generateDocumentId(): string {
    return 'doc_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Search functionality
  searchDocuments(query: string): KnowledgeBaseDocument[] {
    const documents = this.getAllDocuments();
    const lowercaseQuery = query.toLowerCase();
    
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      (doc.description && doc.description.toLowerCase().includes(lowercaseQuery)) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }

  // Statistics
  getDocumentStats(): { totalDocuments: number; totalSize: number; referencedDocuments: number } {
    const documents = this.getAllDocuments();
    const references = this.getDocumentReferences();
    const referencedDocumentIds = new Set(references.map(ref => ref.documentId));
    
    return {
      totalDocuments: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      referencedDocuments: referencedDocumentIds.size
    };
  }
}