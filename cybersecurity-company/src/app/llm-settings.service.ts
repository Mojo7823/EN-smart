import { Injectable } from '@angular/core';

export interface LLMConfig {
  enabled: boolean;
  provider: 'openai' | 'azure' | 'custom';
  apiKey: string;
  apiHost: string;
  model: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created: Date;
  updated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LLMSettingsService {
  private storageKey = 'llmSettings';
  private chatSessionsKey = 'chatSessions';
  private currentChatKey = 'currentChat';

  constructor() {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  getLLMConfig(): LLMConfig {
    if (!this.isBrowser()) {
      return this.getDefaultConfig();
    }
    
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing LLM config:', e);
        return this.getDefaultConfig();
      }
    }
    return this.getDefaultConfig();
  }

  saveLLMConfig(config: LLMConfig): void {
    if (!this.isBrowser()) {
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(config));
  }

  private getDefaultConfig(): LLMConfig {
    return {
      enabled: false,
      provider: 'openai',
      apiKey: '',
      apiHost: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo'
    };
  }

  isLLMConfigured(): boolean {
    const config = this.getLLMConfig();
    return config.enabled && 
           config.apiKey.trim() !== '' && 
           config.apiHost.trim() !== '' && 
           config.model.trim() !== '';
  }

  // Chat session management
  getCurrentChatSession(): ChatSession | null {
    if (!this.isBrowser()) {
      return null;
    }
    
    const stored = localStorage.getItem(this.currentChatKey);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        session.created = new Date(session.created);
        session.updated = new Date(session.updated);
        session.messages = session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        return session;
      } catch (e) {
        console.error('Error parsing current chat session:', e);
        return null;
      }
    }
    return null;
  }

  createNewChatSession(): ChatSession {
    const session: ChatSession = {
      id: this.generateSessionId(),
      messages: [],
      created: new Date(),
      updated: new Date()
    };
    
    this.saveCurrentChatSession(session);
    return session;
  }

  saveCurrentChatSession(session: ChatSession): void {
    if (!this.isBrowser()) {
      return;
    }
    
    session.updated = new Date();
    localStorage.setItem(this.currentChatKey, JSON.stringify(session));
  }

  addMessageToCurrentSession(message: ChatMessage): void {
    let session = this.getCurrentChatSession();
    if (!session) {
      session = this.createNewChatSession();
    }
    
    session.messages.push(message);
    this.saveCurrentChatSession(session);
  }

  clearCurrentChatSession(): void {
    if (!this.isBrowser()) {
      return;
    }
    localStorage.removeItem(this.currentChatKey);
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // LLM API interaction
  async sendMessage(message: string): Promise<string> {
    const config = this.getLLMConfig();
    
    if (!this.isLLMConfigured()) {
      throw new Error('LLM is not properly configured. Please check your settings.');
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.addMessageToCurrentSession(userMessage);

    // Get current session for context
    const session = this.getCurrentChatSession();
    const messages = session ? session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })) : [];

    // Add system message if this is the first message
    if (messages.length === 1) {
      messages.unshift({
        role: 'system',
        content: 'You are a helpful assistant for a cybersecurity robot platform. You can help with robot security assessments, classification, and general questions about robotics cybersecurity.'
      });
    }

    try {
      const response = await fetch(`${config.apiHost}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from LLM API');
      }

      const assistantMessage = data.choices[0].message.content;
      
      // Add assistant response to session
      const assistantChatMessage: ChatMessage = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      };
      this.addMessageToCurrentSession(assistantChatMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Error calling LLM API:', error);
      throw error;
    }
  }
}