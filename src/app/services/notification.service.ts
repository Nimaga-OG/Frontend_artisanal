// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket: any;

  constructor(private toastController: ToastController) {
    // Connexion au backend (ajuste l’URL si besoin)
    this.socket = io('http://localhost:5000');

    // Écoute des notifications
    this.socket.on('notification', async (data: any) => {
      console.log('📢 Notification reçue :', data);

      // Afficher un toast
      const toast = await this.toastController.create({
        message: data.message || 'Nouvelle notification',
        duration: 3000,
        position: 'top',
        color: 'primary',
        buttons: [
          {
            side: 'end',
            icon: 'close',
            role: 'cancel'
          }
        ]
      });

      await toast.present();
    });
  }
}
