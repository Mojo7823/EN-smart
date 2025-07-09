import { Injectable } from '@angular/core';

export interface RobotClassificationResult {
  category: string;
  type: string;
  description: string;
}

export interface RobotInformation {
  name: string;
  firmwareVersion: string;
  mainFunction: string;
  description: string;
}

export interface RobotData {
  classification?: RobotClassificationResult;
  information?: RobotInformation;
  uploadedFiles?: UploadedFile[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  data?: string; // Base64 encoded file data for PDF files
}

@Injectable({
  providedIn: 'root'
})
export class RobotService {
  private storageKey = 'robotData';

  constructor() { }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  }

  getRobotData(): RobotData {
    if (!this.isBrowser()) {
      return {};
    }
    const data = sessionStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }

  setRobotClassification(classification: RobotClassificationResult): void {
    if (!this.isBrowser()) {
      return;
    }
    const data = this.getRobotData();
    data.classification = classification;
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  setRobotInformation(information: RobotInformation): void {
    if (!this.isBrowser()) {
      return;
    }
    const data = this.getRobotData();
    data.information = information;
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  clearRobotData(): void {
    if (!this.isBrowser()) {
      return;
    }
    sessionStorage.removeItem(this.storageKey);
  }

  // XML Export/Import functionality
  exportToXML(): string {
    const data = this.getRobotData();
    const timestamp = new Date().toISOString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<robotSession timestamp="${timestamp}">
  <metadata>
    <version>1.0</version>
    <exportDate>${timestamp}</exportDate>
  </metadata>`;

    if (data.information) {
      xml += `
  <robotInformation>
    <name><![CDATA[${data.information.name || ''}]]></name>
    <firmwareVersion><![CDATA[${data.information.firmwareVersion || ''}]]></firmwareVersion>
    <mainFunction><![CDATA[${data.information.mainFunction || ''}]]></mainFunction>
    <description><![CDATA[${data.information.description || ''}]]></description>
  </robotInformation>`;
    }

    if (data.classification) {
      xml += `
  <robotClassification>
    <category><![CDATA[${data.classification.category}]]></category>
    <type><![CDATA[${data.classification.type}]]></type>
    <description><![CDATA[${data.classification.description}]]></description>
  </robotClassification>`;
    }

    if (data.uploadedFiles && data.uploadedFiles.length > 0) {
      xml += `
  <uploadedFiles>`;
      data.uploadedFiles.forEach(file => {
        xml += `
    <file>
      <name><![CDATA[${file.name}]]></name>
      <size>${file.size}</size>
      <type><![CDATA[${file.type}]]></type>
      <uploadDate><![CDATA[${file.uploadDate}]]></uploadDate>
      ${file.data ? `<data><![CDATA[${file.data}]]></data>` : ''}
    </file>`;
      });
      xml += `
  </uploadedFiles>`;
    }

    xml += `
</robotSession>`;
    
    return xml;
  }

  importFromXML(xmlContent: string): boolean {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parsing errors
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        console.error('XML parsing error');
        return false;
      }

      const robotSession = xmlDoc.getElementsByTagName('robotSession')[0];
      if (!robotSession) {
        console.error('Invalid XML format: missing robotSession element');
        return false;
      }

      const data: RobotData = {};

      // Import robot information
      const robotInfo = xmlDoc.getElementsByTagName('robotInformation')[0];
      if (robotInfo) {
        data.information = {
          name: this.getTextContent(robotInfo, 'name'),
          firmwareVersion: this.getTextContent(robotInfo, 'firmwareVersion'),
          mainFunction: this.getTextContent(robotInfo, 'mainFunction'),
          description: this.getTextContent(robotInfo, 'description')
        };
      }

      // Import robot classification
      const robotClassification = xmlDoc.getElementsByTagName('robotClassification')[0];
      if (robotClassification) {
        data.classification = {
          category: this.getTextContent(robotClassification, 'category'),
          type: this.getTextContent(robotClassification, 'type'),
          description: this.getTextContent(robotClassification, 'description')
        };
      }

      // Import uploaded files
      const uploadedFiles = xmlDoc.getElementsByTagName('uploadedFiles')[0];
      if (uploadedFiles) {
        data.uploadedFiles = [];
        const files = uploadedFiles.getElementsByTagName('file');
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uploadedFile: UploadedFile = {
            name: this.getTextContent(file, 'name'),
            size: parseInt(this.getTextContent(file, 'size')) || 0,
            type: this.getTextContent(file, 'type'),
            uploadDate: this.getTextContent(file, 'uploadDate'),
            data: this.getTextContent(file, 'data')
          };
          data.uploadedFiles.push(uploadedFile);
        }
      }

      // Store the imported data
      if (this.isBrowser()) {
        sessionStorage.setItem(this.storageKey, JSON.stringify(data));
      }

      return true;
    } catch (error) {
      console.error('Error importing XML:', error);
      return false;
    }
  }

  private getTextContent(parent: Element, tagName: string): string {
    const element = parent.getElementsByTagName(tagName)[0];
    return element ? element.textContent || '' : '';
  }

  // File upload functionality
  addUploadedFile(file: UploadedFile): void {
    if (!this.isBrowser()) {
      return;
    }
    const data = this.getRobotData();
    if (!data.uploadedFiles) {
      data.uploadedFiles = [];
    }
    data.uploadedFiles.push(file);
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getUploadedFiles(): UploadedFile[] {
    const data = this.getRobotData();
    return data.uploadedFiles || [];
  }

  removeUploadedFile(fileName: string): void {
    if (!this.isBrowser()) {
      return;
    }
    const data = this.getRobotData();
    if (data.uploadedFiles) {
      data.uploadedFiles = data.uploadedFiles.filter(f => f.name !== fileName);
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }
}
