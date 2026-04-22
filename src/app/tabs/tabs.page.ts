import { Component } from '@angular/core';
import { IonTabs, IonIcon } from "@ionic/angular/standalone";
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { home, person, cart, heart, bag } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
    imports: [IonicModule, CommonModule, RouterModule, IonTabs, IonIcon]
})
export class TabsPage {}