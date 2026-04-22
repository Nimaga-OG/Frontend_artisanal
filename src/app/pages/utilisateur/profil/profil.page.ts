import { Component, OnInit } from '@angular/core';
import { UtilisateurService } from 'src/app/services/utilisateur.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProduitService } from 'src/app/services/produit.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class ProfilPage implements OnInit {
  user: any = null;
  isLoading = true;
  stats: any = {
    produits: 0,
    ventes: 0,
    favoris: 0
  };
  isEditing = false;
  editData: any = {};
  currentYear: number = new Date().getFullYear(); // Ajout de la propriété manquante

  constructor(
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private produitService: ProduitService,
    private favorisService: FavorisService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private location: Location
  ) {}
  /** Retour arrière */
  retour() {
    this.location.back();
  }

  async ngOnInit() {
    await this.chargerProfil();
  }

  async ionViewWillEnter() {
    await this.chargerProfil();
  }

  async chargerProfil() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Chargement du profil...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const userData = await this.utilisateurService.getMonProfil().toPromise();
      this.user = userData;
      this.editData = { ...userData };
      await this.chargerStatistiques();
      this.isLoading = false;
    } catch (error) {
      console.error('Erreur chargement profil', error);
      this.presentToast('Erreur lors du chargement du profil', 'danger');
      this.isLoading = false;
    } finally {
      loading.dismiss();
    }
  }

  async chargerStatistiques() {
    // Nombre de produits
    try {
      if (this.produitService && this.produitService.getMesProduits) {
        const produits = await this.produitService.getMesProduits().toPromise();
        if (produits) {
          this.stats.produits = produits.length;
        } else {
          this.stats.produits = 0;
        }
      }
    } catch (e) {
      this.stats.produits = 0;
    }

    // Nombre de favoris (localStorage)
    if (this.favorisService && this.favorisService.getFavoris) {
      this.stats.favoris = this.favorisService.getFavoris().size;
    }
    // À compléter pour les ventes si besoin
    // this.stats.ventes = ...
  }

  async prendrePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        await this.changerPhotoProfil(image.dataUrl);
      }
    } catch (error) {
      console.error('Erreur prise de photo', error);
    }
  }

  async selectionnerPhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        await this.changerPhotoProfil(image.dataUrl);
      }
    } catch (error) {
      console.error('Erreur sélection photo', error);
    }
  }

  async changerPhotoProfil(imageDataUrl: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Changement de photo...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Convertir DataUrl en Blob pour l'envoi
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('photo', blob, 'profile.jpg');

      const updatedUser = await this.utilisateurService.changerPhoto(formData).toPromise();
      this.user = updatedUser;
      this.authService.updateUser(this.user._id, updatedUser); // Correction: ajout du userId et data
      
      this.presentToast('Photo de profil mise à jour', 'success');
    } catch (error) {
      console.error('Erreur changement photo', error);
      this.presentToast('Erreur lors du changement de photo', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  /** Corriger l’URL des images de profil */
getImageUrl(imagePath: string): string {
  if (!imagePath) return 'assets/images/default-avatar.png'; // image par défaut locale
  if (imagePath.startsWith('http')) return imagePath;

  // Nettoyer le chemin pour éviter "uploads/uploads"
  const cleanPath = imagePath.replace(/^\/?uploads[\/\\]?/, '');

  return `http://localhost:5000/uploads/${cleanPath}`;
}



  async modifierProfil() {
    const loading = await this.loadingCtrl.create({
      message: 'Modification du profil...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const updatedUser = await this.utilisateurService.modifierProfil(this.editData).toPromise();
      this.user = updatedUser;
      this.authService.updateUser(this.user._id, updatedUser); // Correction: ajout du userId et data
      this.isEditing = false;
      this.presentToast('Profil mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Erreur modification profil', error);
      this.presentToast('Erreur lors de la modification du profil', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  annulerModification() {
    this.editData = { ...this.user };
    this.isEditing = false;
  }

  async deconnexion() {
    const alert = await this.alertCtrl.create({
      header: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Déconnecter',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
            this.presentToast('Déconnexion réussie', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  async doRefresh(event: any) {
  await this.chargerProfil();
  event.target.complete();
}

  async supprimerCompte() {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer le compte',
      message: 'Cette action est irréversible. Toutes vos données seront perdues. Êtes-vous absolument sûr ?',
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: 'Tapez "SUPPRIMER" pour confirmer'
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          handler: async (data) => {
  if (data.confirmation !== 'SUPPRIMER') {
    this.presentToast('Confirmation incorrecte', 'danger');
    return false; // Maintenant ça retourne bien de la fonction
  }
  
  const loading = await this.loadingCtrl.create({
    message: 'Suppression du compte...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    await this.utilisateurService.supprimerCompte().toPromise();
    this.authService.logout();
    this.router.navigate(['/login']);
    this.presentToast('Compte supprimé avec succès', 'success');
    return true; // Ajoutez un return success
  } catch (error) {
    console.error('Erreur suppression compte', error);
    this.presentToast('Erreur lors de la suppression du compte', 'danger');
    return false; // Ajoutez un return error
  } finally {
    loading.dismiss();
  }
}
        }
      ]
    });

    await alert.present();
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(nom: string): string {
    return nom ? nom.charAt(0).toUpperCase() : 'U';
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

  naviguerVers(route: string) {
    this.router.navigate([route]);
  }
}