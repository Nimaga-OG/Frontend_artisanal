import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { PanierService } from 'src/app/services/panier.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class LoginPage {
  email = '';
  mot_de_passe = '';
  showPassword = false;
  rememberMe = false;
  isLoading = false;
  email_valide = true;
  mot_de_passe_valide = true;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private panierService: PanierService
  ) {
    // Charger les informations sauvegardées si "Se souvenir de moi" était coché
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  validerFormulaire() {
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.email_valide = emailRegex.test(this.email);
    
    // Validation du mot de passe
    this.mot_de_passe_valide = this.mot_de_passe.length >= 1;
    
    return this.email_valide && this.mot_de_passe_valide;
  }

  async login() {
    if (!this.validerFormulaire()) {
      this.presentToast('Veuillez corriger les erreurs dans le formulaire', 'danger');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ 
      message: 'Connexion...',
      spinner: 'crescent'
    });
    await loading.present();

    // Sauvegarder l'email si "Se souvenir de moi" est coché
    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', this.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    this.auth.login(this.email, this.mot_de_passe).subscribe({
      next: () => {
        loading.dismiss();
        this.isLoading = false;
        this.panierService.reinitialiserPanierPourNouvelUtilisateur();
        this.router.navigate(['/']);
        this.presentToast('Connexion réussie!', 'success');
      },
      error: async (error) => {
        loading.dismiss();
        this.isLoading = false;
        
        let message = 'Échec de connexion. Vérifie tes identifiants.';
        
        if (error.status === 401) {
          message = 'Email ou mot de passe incorrect.';
        } else if (error.status === 0) {
          message = 'Impossible de se connecter au serveur. Vérifie ta connexion internet.';
        } else if (error.error && error.error.message) {
          message = error.error.message;
        }
        
        this.presentToast(message, 'danger');
      },
    });
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }

  // Méthode pour la réinitialisation du mot de passe (à implémenter)
  resetPassword() {
    this.presentToast('Fonctionnalité de réinitialisation à implémenter', 'warning');
  }
}