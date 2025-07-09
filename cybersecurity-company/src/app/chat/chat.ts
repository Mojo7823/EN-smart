import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
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
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MarkdownPipe } from '../shared/markdown.pipe';
import { LLMSettingsService, ChatMessage, ChatSession } from '../llm-settings.service';

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

  constructor(private llmSettingsService: LLMSettingsService) {}

  ngOnInit() {
    this.isLLMConfigured = this.llmSettingsService.isLLMConfigured();
    if (this.isLLMConfigured) {
      this.loadChatSession();
    }
  }

  ngOnDestroy() {
    // Auto-save chat session when component is destroyed
    if (this.chatSession) {
      this.llmSettingsService.saveCurrentChatSession(this.chatSession);
    }
  }

  private loadChatSession() {
    this.chatSession = this.llmSettingsService.getCurrentChatSession();
    if (!this.chatSession) {
      this.chatSession = this.llmSettingsService.createNewChatSession();
    }
    setTimeout(() => this.scrollToBottom(), 100);
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading || !this.isLLMConfigured) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const message = this.currentMessage.trim();
    this.currentMessage = '';

    // Begin sending the message but don't await immediately
    const sendPromise = this.llmSettingsService.sendMessage(message);

    // Immediately refresh chat session so the user's message shows
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

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.llmSettingsService.clearCurrentChatSession();
    this.chatSession = this.llmSettingsService.createNewChatSession();
    this.errorMessage = '';
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
}