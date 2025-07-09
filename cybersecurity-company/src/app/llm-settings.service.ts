import { Injectable } from '@angular/core';

export interface LLMConfig {
  enabled: boolean;
  provider: 'openai' | 'azure' | 'custom';
  apiKey: string;
  apiHost: string;
  model: string;
}

export interface ChatMessageContentFile {
  type: 'file';
  file: {
    filename: string;
    // base64 encoded data, prefixed with data:application/pdf;base64,
    file_data: string;
  };
}

export interface ChatMessageContentText {
  type: 'text';
  text: string;
}

export type ChatMessageContent = string | Array<ChatMessageContentFile | ChatMessageContentText>;


export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: ChatMessageContent; // Can be string or array for multi-modal
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

  /**
   * Transform rich (array-based) message content into the plain-text string
   * format currently accepted by the OpenAI / Azure OpenAI chat-completion
   * endpoints.  
   *  • “text” parts are concatenated with new-lines.  
   *  • “file” parts are replaced with an easy-to-read placeholder so the
   *    assistant still gets some context without sending raw file bytes.
   */
  private flattenContent(content: ChatMessageContent): string {
    if (Array.isArray(content)) {
      return content
        .map(part =>
          part.type === 'text'
            ? part.text
            : `[File: ${(part as ChatMessageContentFile).file.filename}]`
        )
        .join('\n');
    }
    return content as string;
  }

  // LLM API interaction
  async sendMessage(message: string, fileData?: { name: string, content: string }): Promise<string> {
    const config = this.getLLMConfig();

    if (!this.isLLMConfigured()) {
      throw new Error('LLM is not properly configured. Please check your settings.');
    }

    let userMessageContent: ChatMessageContent;

    if (fileData) {
      userMessageContent = [
        {
          type: 'file',
          file: {
            filename: fileData.name,
            file_data: `data:application/pdf;base64,${fileData.content}`
          }
        }
      ];
      // Add text part if message is not empty
      if (message) {
        (userMessageContent as Array<ChatMessageContentFile | ChatMessageContentText>).push({ type: 'text', text: message });
      }
    } else {
      userMessageContent = message;
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      role: 'user',
      content: userMessageContent, // This will store the rich content
      timestamp: new Date()
    };
    this.addMessageToCurrentSession(userMessage);

    // Get current session for context
    const session = this.getCurrentChatSession();
    // Prepare messages for API: if content is an array, use it directly, otherwise wrap string content.
    const apiMessages = session ? session.messages.map(msg => {
      let apiContent;
      if (Array.isArray(msg.content)) { // Already in new format
        apiContent = msg.content;
      } else if (typeof msg.content === 'string') { // Old format, just text
        apiContent = msg.content; // OpenAI API can handle plain string for user/assistant text-only messages
                                  // For system messages, it must be string.
                                  // For user/assistant messages with mixed content, it must be an array.
        if (msg.role === 'user' && fileData && msg === userMessage) { // This is the current message with a file
             apiContent = userMessageContent;
        } else if (msg.role !== 'system') { // If it's not a system message and not the current file message, wrap it
            apiContent = [{ type: 'text', text: msg.content } as ChatMessageContentText];
        }
      } else { // Should not happen with current logic, but good to handle
        apiContent = [{ type: 'text', text: 'Error: Malformed message content' }];
      }
      return {
        role: msg.role,
        content: apiContent
      };
    }) : [];


    // Add system message if this is the first message from the user in the session
    // The system message content must be a string.
    if (apiMessages.filter(m => m.role === 'user').length === 1 && apiMessages[0].role !== 'system') {
      apiMessages.unshift({ // Corrected from 'messages.unshift' to 'apiMessages.unshift'
        role: 'system',
        content: 'You are a helpful assistant for a cybersecurity robot platform. You can help with robot security assessments, classification, and general questions about robotics cybersecurity.'
      });
    }

    try {
      const messagesForAPI = apiMessages.map(m => ({
        role: m.role,
        content: Array.isArray(m.content) ? this.flattenContent(m.content as ChatMessageContent) : m.content
      }));

      const requestBody = {
        model: config.model,
        messages: messagesForAPI,
        max_tokens: 1000,
        temperature: 0.7
      };

      // Log the request body for debugging (excluding sensitive headers)
      // In a real app, be careful about logging potentially sensitive message content
      console.debug('LLM API Request:', { host: config.apiHost, model: config.model, messagesCount: apiMessages.length }); // Corrected


      const response = await fetch(`${config.apiHost}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          // Ignore if response text cannot be read
        }
        console.error(`LLM API Error: ${response.status} - ${response.statusText}. Body: ${errorText}`);
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}. Check console for more details.`);
      }

      const data = await response.json();

      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('Invalid response format from LLM API: "choices" array is missing or empty.', data);
        throw new Error('Invalid response format from LLM API: "choices" array is missing or empty.');
      }
      
      const choice = data.choices[0];
      if (!choice.message || typeof choice.message.content !== 'string') {
        console.error('Invalid response format from LLM API: "message.content" is missing or not a string.', data);
        throw new Error('Invalid response format from LLM API: "message.content" is missing or not a string.');
      }

      const assistantMessage = choice.message.content;
      
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

  /**
   * Regenerate the last assistant response based on the most recent user message.
   * It removes the last assistant message (if present) and calls the LLM again
   * without adding an additional user message, effectively producing a new answer.
   */
  async regenerateAssistant(): Promise<string> {
    const config = this.getLLMConfig();

    if (!this.isLLMConfigured()) {
      throw new Error('LLM is not properly configured. Please check your settings.');
    }

    let session = this.getCurrentChatSession();
    if (!session || session.messages.length === 0) {
      throw new Error('No chat history to regenerate.');
    }

    // Remove last assistant message if present
    const lastMsg = session.messages[session.messages.length - 1];
    if (lastMsg.role === 'assistant') {
      session.messages.pop();
    }

    this.saveCurrentChatSession(session);

    // Build payload - similar transformation as in sendMessage
    const apiMessages = session.messages.map(msg => {
        let apiContent;
        if (Array.isArray(msg.content)) {
            apiContent = msg.content;
        } else if (typeof msg.content === 'string') {
            // System messages must be string, others can be array of content parts
            apiContent = (msg.role === 'system') ? msg.content : [{ type: 'text', text: msg.content } as ChatMessageContentText];
        } else {
            apiContent = [{ type: 'text', text: 'Error: Malformed message content for regenerate' }];
        }
        return {
            role: msg.role,
            content: apiContent
        };
    });


    if (apiMessages.length === 0) {
      throw new Error('No user message to regenerate from.');
    }

    // Add system prompt if this is the first exchange and system prompt isn't already there
    if (apiMessages.filter(m => m.role === 'user').length > 0 && apiMessages[0].role !== 'system') {
      apiMessages.unshift({
        role: 'system',
        content:
          'You are a helpful assistant for a cybersecurity robot platform. You can help with robot security assessments, classification, and general questions about robotics cybersecurity.'
      });
    }

    try {
      const messagesForAPI = apiMessages.map(m => ({
        role: m.role,
        content: Array.isArray(m.content) ? this.flattenContent(m.content as ChatMessageContent) : m.content
      }));

      const requestBody = {
        model: config.model,
        messages: messagesForAPI,
        max_tokens: 1000,
        temperature: 0.7
      };

      const response = await fetch(`${config.apiHost}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          /* ignore */
        }
        console.error(`LLM API Error (regenerate): ${response.status} - ${response.statusText}. Body: ${errorText}`);
        throw new Error(
          `API request failed with status ${response.status}: ${response.statusText}. Check console for more details.`
        );
      }

      const data = await response.json();
      if (
        !data ||
        !data.choices ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0 ||
        !data.choices[0].message ||
        typeof data.choices[0].message.content !== 'string'
      ) {
        console.error('Invalid response format from LLM API (regenerate).', data);
        throw new Error('Invalid response format from LLM API.');
      }

      const assistantMessage = data.choices[0].message.content;

      const assistantChatMessage: ChatMessage = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      };
      this.addMessageToCurrentSession(assistantChatMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Error calling LLM API (regenerate):', error);
      throw error;
    }
  }
}
