import { Injectable } from '@angular/core';
import { LLMSettingsService } from './llm-settings.service';
import { KnowledgeBaseService } from './knowledge-base.service';

@Injectable({
  providedIn: 'root'
})
export class ChatIntegrationService {
  constructor(
    private llmSettingsService: LLMSettingsService,
    private knowledgeBaseService: KnowledgeBaseService
  ) {}

  /**
   * Delete messages that reference a specific knowledge base file
   */
  deleteMessagesByFileId(fileId: string): void {
    const session = this.llmSettingsService.getCurrentChatSession();
    if (!session) {
      return;
    }

    const file = this.knowledgeBaseService.getFileById(fileId);
    if (!file) {
      return;
    }

    // Remove messages that reference this file
    const messageIdsToRemove = file.messageIds;
    session.messages = session.messages.filter(message => {
      const messageId = message.timestamp.getTime().toString();
      return !messageIdsToRemove.includes(messageId);
    });

    this.llmSettingsService.saveCurrentChatSession(session);
  }

  /**
   * Delete messages that reference any of the provided file IDs
   */
  deleteMessagesByFileIds(fileIds: string[]): void {
    fileIds.forEach(fileId => this.deleteMessagesByFileId(fileId));
  }
}