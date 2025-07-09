import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LLMSettingsService, LLMConfig } from '../llm-settings.service';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent implements OnInit {
  llmConfig: LLMConfig = {
    enabled: false,
    provider: 'openai',
    apiKey: '',
    apiHost: '',
    model: ''
  };

  availableProviders = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'azure', label: 'Azure OpenAI' },
    { value: 'custom', label: 'Custom OpenAI Compatible' }
  ];

  constructor(private llmSettingsService: LLMSettingsService) {}

  ngOnInit() {
    this.llmConfig = this.llmSettingsService.getLLMConfig();
  }

  onSave() {
    this.llmSettingsService.saveLLMConfig(this.llmConfig);
    // Could add a toast/snackbar notification here
    console.log('LLM settings saved successfully');
  }

  onReset() {
    this.llmConfig = {
      enabled: false,
      provider: 'openai',
      apiKey: '',
      apiHost: '',
      model: ''
    };
  }

  onProviderChange() {
    // Set default values based on provider
    switch (this.llmConfig.provider) {
      case 'openai':
        this.llmConfig.apiHost = 'https://api.openai.com/v1';
        this.llmConfig.model = 'gpt-3.5-turbo';
        break;
      case 'azure':
        this.llmConfig.apiHost = '';
        this.llmConfig.model = 'gpt-3.5-turbo';
        break;
      case 'custom':
        this.llmConfig.apiHost = '';
        this.llmConfig.model = '';
        break;
    }
  }
}