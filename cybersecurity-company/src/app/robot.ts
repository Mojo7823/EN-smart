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
}
