import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async canActivate(): Promise<boolean> {
    const user = this.authService.getUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    // Vérifier si l'utilisateur est administrateur
    if (user.role !== 'admin') {
      const toast = await this.toastCtrl.create({
        message: 'Accès réservé aux administrateurs',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      toast.present();
      
      this.router.navigate(['/']);
      return false;
    }

    // Vérifier les droits d'accès admin via l'API
    try {
      const hasAccess = await this.adminService.checkAdminAccess().toPromise();
      return hasAccess || false;
    } catch (error) {
      console.error('Erreur vérification accès admin:', error);
      
      const toast = await this.toastCtrl.create({
        message: 'Erreur de vérification des droits administrateur',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      toast.present();
      
      this.router.navigate(['/']);
      return false;
    }
  }
}