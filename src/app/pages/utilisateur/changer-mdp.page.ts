import { Component } from '@angular/core';
import { UtilisateurService } from 'src/app/services/utilisateur.service';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-changer-mdp',
  templateUrl: './changer-mdp.page.html',
  styleUrls: ['./changer-mdp.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChangerMdpPage {
  motActuel = '';
  nouveauMot = '';
  confirmerMot = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  formErrors: any = {};

  constructor(
    private utilisateurService: UtilisateurService, 
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  togglePasswordVisibility(field: string) {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  validerFormulaire(): boolean {
    this.formErrors = {};
    let isValid = true;

    // Validation mot de passe actuel
    if (!this.motActuel) {
      this.formErrors.motActuel = 'Le mot de passe actuel est requis';
      isValid = false;
    } else if (this.motActuel.length < 6) {
      this.formErrors.motActuel = 'Le mot de passe actuel doit contenir au moins 6 caractères';
      isValid = false;
    }

    // Validation nouveau mot de passe
    if (!this.nouveauMot) {
      this.formErrors.nouveauMot = 'Le nouveau mot de passe est requis';
      isValid = false;
    } else if (this.nouveauMot.length < 8) {
      this.formErrors.nouveauMot = 'Le nouveau mot de passe doit contenir au moins 8 caractères';
      isValid = false;
    } else if (!this.estMotDePasseSecurise(this.nouveauMot)) {
      this.formErrors.nouveauMot = 'Le mot de passe doit contenir des lettres majuscules, minuscules, chiffres et caractères spéciaux';
      isValid = false;
    }

    // Validation confirmation
    if (!this.confirmerMot) {
      this.formErrors.confirmerMot = 'La confirmation du mot de passe est requise';
      isValid = false;
    } else if (this.nouveauMot !== this.confirmerMot) {
      this.formErrors.confirmerMot = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    return isValid;
  }

  estMotDePasseSecurise(mot: string): boolean {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(mot);
  }

  evaluerForceMotDePasse(): number {
    if (!this.nouveauMot) return 0;
    
    let force = 0;
    
    // Longueur minimale
    if (this.nouveauMot.length >= 8) force += 1;
    
    // Contient des chiffres
    if (/\d/.test(this.nouveauMot)) force += 1;
    
    // Contient des lettres minuscules et majuscules
    if (/[a-z]/.test(this.nouveauMot) && /[A-Z]/.test(this.nouveauMot)) force += 1;
    
    // Contient des caractères spéciaux
    if (/[^A-Za-z0-9]/.test(this.nouveauMot)) force += 1;
    
    return force;
  }

  async changer() {
    if (this.isSubmitting) return;
    
    if (!this.validerFormulaire()) {
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Changement en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    this.utilisateurService.changerMotDePasse({ 
      motActuel: this.motActuel, 
      nouveauMot: this.nouveauMot 
    }).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isSubmitting = false;
        this.presentToast('Mot de passe changé avec succès', 'success');
        
        // Réinitialiser le formulaire
        this.motActuel = '';
        this.nouveauMot = '';
        this.confirmerMot = '';
        this.formErrors = {};
        
        // Rediriger après un court délai
        setTimeout(() => {
          this.router.navigate(['/profil']);
        }, 2000);
      },
      error: async (err) => {
        await loading.dismiss();
        this.isSubmitting = false;
        
        let errorMessage = err.error?.message || 'Erreur lors du changement de mot de passe';
        
        if (err.status === 401) {
          errorMessage = 'Mot de passe actuel incorrect';
          this.formErrors.motActuel = errorMessage;
        } else if (err.status === 400) {
          errorMessage = 'Le nouveau mot de passe doit être différent de l\'ancien';
          this.formErrors.nouveauMot = errorMessage;
        }
        
        this.presentToast(errorMessage, 'danger');
      }
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

  annuler() {
    this.router.navigate(['/profil']);
  }
}