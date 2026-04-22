import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import {
  IonicModule,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class RegisterPage {
  nom_utilisateur = '';
  email = '';
  telephone = '';
  mot_de_passe = '';
  confirmer_mot_de_passe = '';
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  apiUrl = environment.apiUrl;
  
  // Variables de validation
  nom_utilisateur_valide = true;
  email_valide = true;
  telephone_valide = true;
  mot_de_passe_valide = true;
  confirmation_valide = true;
  form_valide = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private http: HttpClient
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Vérification du type et de la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.presentToast('La taille de l\'image ne doit pas dépasser 5MB', 'danger');
        return;
      }
      
      if (!file.type.match('image.*')) {
        this.presentToast('Veuillez sélectionner une image valide', 'danger');
        return;
      }
      
      this.selectedFile = file;
      
      // Prévisualisation de l'image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  validerFormulaire() {
    // Validation du nom d'utilisateur
    this.nom_utilisateur_valide = this.nom_utilisateur.length >= 3;
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.email_valide = emailRegex.test(this.email);
    
    // Validation du téléphone (format Mali: 8 chiffres après l'indicatif)
    const phoneRegex = /^[0-9]{8}$/;
    this.telephone_valide = phoneRegex.test(this.telephone.replace(/\s/g, ''));
    
    // Validation du mot de passe
    this.mot_de_passe_valide = this.mot_de_passe.length >= 6;
    
    // Validation de la confirmation
    this.confirmation_valide = this.mot_de_passe === this.confirmer_mot_de_passe;
    
    // Le formulaire est valide si tous les champs sont valides
    this.form_valide = this.nom_utilisateur_valide && this.email_valide && 
                      this.telephone_valide && this.mot_de_passe_valide && 
                      this.confirmation_valide;
  }

  // Fonction pour formater le numéro de téléphone
  formaterTelephone() {
    if (this.telephone) {
      // Supprimer tous les caractères non numériques
      let numeros = this.telephone.replace(/\D/g, '');
      
      // Limiter à 8 chiffres (format Mali)
      if (numeros.length > 8) {
        numeros = numeros.substring(0, 8);
      }
      
      // Formater en groupes de 2 chiffres
      if (numeros.length > 0) {
        this.telephone = numeros.replace(/(\d{2})(?=\d)/g, '$1 ');
      }
    }
  }

  // Fonction pour basculer le menu déroulant des pays (pour extension future)
  toggleCountryDropdown() {
    // Pourrait être implémenté pour permettre le choix d'autres pays
    console.log('Menu déroulant pays cliqué');
  }

  evaluerForceMotDePasse(): number {
    if (!this.mot_de_passe) return 0;
    
    let force = 0;
    
    // Longueur minimale
    if (this.mot_de_passe.length >= 8) force += 1;
    
    // Contient des chiffres
    if (/\d/.test(this.mot_de_passe)) force += 1;
    
    // Contient des lettres minuscules et majuscules
    if (/[a-z]/.test(this.mot_de_passe) && /[A-Z]/.test(this.mot_de_passe)) force += 1;
    
    // Contient des caractères spéciaux
    if (/[^A-Za-z0-9]/.test(this.mot_de_passe)) force += 1;
    
    return force;
  }

  async register() {
    // Validation finale avant soumission
    this.validerFormulaire();
    
    if (!this.form_valide) {
      this.presentToast('Veuillez corriger les erreurs dans le formulaire', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Création du compte...',
    });
    await loading.present();

    const formData = new FormData();
    formData.append('nom_utilisateur', this.nom_utilisateur);
    formData.append('email', this.email);
    
    // Ajouter l'indicatif du Mali au numéro de téléphone
    const telephoneComplet = '+223 ' + this.telephone;
    formData.append('telephone', telephoneComplet);
    
    formData.append('mot_de_passe', this.mot_de_passe);

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile, this.selectedFile.name);
    }

    this.http
      .post(`${this.apiUrl}/auth/register`, formData)
      .subscribe({
        next: async () => {
          loading.dismiss();
          const toast = await this.toastCtrl.create({
            message: 'Inscription réussie. Connecte-toi maintenant.',
            duration: 3000,
            color: 'success',
          });
          toast.present();
          this.router.navigate(['/login']);
        },
        error: async (error: HttpErrorResponse) => {
          console.error('Erreur d\'inscription', error);
          loading.dismiss();
          
          let message = "Erreur d'inscription. Vérifie les données.";
          
          if (error.status === 409) {
            if (error.error.message.includes('email')) {
              message = 'Cet email est déjà utilisé.';
            } else if (error.error.message.includes('nom_utilisateur')) {
              message = 'Ce nom d\'utilisateur est déjà pris.';
            } else if (error.error.message.includes('telephone')) {
              message = 'Ce numéro de téléphone est déjà utilisé.';
            }
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
    });
    toast.present();
  }
}