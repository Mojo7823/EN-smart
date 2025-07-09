import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Home } from './home/home';
import { RobotClassificationComponent } from './robot-classification/robot-classification';
import { RobotInformationForm } from './robot-information-form/robot-information-form';
import { SharedLayout } from './shared-layout/shared-layout';
import { PdfManagerComponent } from './pdf-manager/pdf-manager';
import { SettingsComponent } from './settings/settings';

export const routes: Routes = [
  { path: '', component: Home },
  { 
    path: '', 
    component: SharedLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'robot-classification', component: RobotClassificationComponent },
      { path: 'robot-information-form', component: RobotInformationForm },
      { path: 'pdf-manager', component: PdfManagerComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];
