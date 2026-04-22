import { Component } from '@angular/core';
import { ProduitService } from 'src/app/services/produit.service';
import { CategorieService } from 'src/app/services/categorie.service';
import { Router } from '@angular/router';
import { IonicModule, Platform, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-ajouter-produit',
  templateUrl: './ajouter-produit.page.html',
  styleUrls: ['./ajouter-produit.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AjouterProduitPage {
  produit = {
    nom: '',
    description: '',
    prix: null as number | null,
    categorie: '',
    ville: '',
    image: '', // Image principale
    imagesSupplementaires: [] as string[], // ✅ Tableau d'images supplémentaires
    stock: 1
  };

  categories: any[] = [];
  motsInterdits = ['voiture', 'téléphone', 'ordinateur', 'batterie', 'électroménager', 'appareil', 'portable'];
  isSubmitting = false;
  formErrors: any = {};

  constructor(
    private produitService: ProduitService,
    private categorieService: CategorieService,
    private router: Router,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {}

  ionViewWillEnter() {
    this.chargerCategories();
  }

  chargerCategories() {
    this.categorieService.getAll().subscribe({
      next: (res) => {
        this.categories = res;
      },
      error: (err) => {
        this.presentToast('Erreur lors du chargement des catégories', 'danger');
      }
    });
  }

  // ✅ Ajouter une image supplémentaire
  async ajouterImageSupplementaire() {
    if (this.produit.imagesSupplementaires.length >= 3) {
      this.presentToast('Maximum 3 images supplémentaires autorisées', 'warning');
      return;
    }
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: this.platform.is('capacitor') ? CameraSource.Prompt : CameraSource.Photos,
        allowEditing: true,
        width: 800,
        height: 800
      });
      this.produit.imagesSupplementaires.push(image.dataUrl!);
    } catch (err) {
      // Image annulée ou erreur
    }
  }

  // ✅ Supprimer une image supplémentaire
  supprimerImageSupplementaire(index: number) {
    this.produit.imagesSupplementaires.splice(index, 1);
  }

  // ✅ Choisir l'image principale
  async choisirImagePrincipale() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: this.platform.is('capacitor') ? CameraSource.Prompt : CameraSource.Photos,
        allowEditing: true,
        width: 800,
        height: 800
      });
      this.produit.image = image.dataUrl!;
    } catch (err) {
      // Image annulée ou erreur
    }
  }

  validerFormulaire(): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!this.produit.nom || this.produit.nom.trim().length < 3) {
      this.formErrors.nom = 'Le nom doit contenir au moins 3 caractères';
      isValid = false;
    } else if (this.motsInterdits.some(mot => this.produit.nom.toLowerCase().includes(mot))) {
      this.formErrors.nom = 'Ce produit ne semble pas être artisanal';
      isValid = false;
    }
    if (!this.produit.description || this.produit.description.trim().length < 10) {
      this.formErrors.description = 'La description doit contenir au moins 10 caractères';
      isValid = false;
    }
    if (!this.produit.prix || this.produit.prix <= 0) {
      this.formErrors.prix = 'Le prix doit être supérieur à 0';
      isValid = false;
    }
    if (!this.produit.categorie) {
      this.formErrors.categorie = 'Veuillez sélectionner une catégorie';
      isValid = false;
    }
    if (!this.produit.image) {
      this.formErrors.image = 'Veuillez ajouter une image principale';
      isValid = false;
    }
    return isValid;
  }

  async ajouter() {
    if (this.isSubmitting) return;
    if (!this.validerFormulaire()) return;

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Ajout en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    const formData = new FormData();
    formData.append('nom', this.produit.nom.trim());
    formData.append('description', this.produit.description.trim());
    formData.append('prix', this.produit.prix!.toString());
    formData.append('categorie', this.produit.categorie);
    formData.append('ville', this.produit.ville.trim() || 'Non spécifiée');
    formData.append('stock', this.produit.stock.toString());
    formData.append('type', 'artisanal');

    // Image principale
    const blobPrincipal = this.dataURItoBlob(this.produit.image);
    formData.append('image', blobPrincipal, 'image-principale.jpg');

    // Images supplémentaires
    this.produit.imagesSupplementaires.forEach((imageDataUrl, index) => {
      const blob = this.dataURItoBlob(imageDataUrl);
      formData.append('imagesSupplementaires', blob, `image-supplementaire-${index}.jpg`);
    });

    this.produitService.ajouterProduitAvecImagesMultiples(formData).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isSubmitting = false;
        this.presentToast('✅ Produit ajouté avec succès', 'success');
        this.router.navigate(['/produits']);
      },
      error: async (err) => {
        await loading.dismiss();
        this.isSubmitting = false;
        let errorMessage = err.error?.message || "Erreur lors de l'ajout";
        if (err.status === 413) {
          errorMessage = "L'image est trop volumineuse";
        } else if (err.status === 415) {
          errorMessage = "Format d'image non supporté";
        }
        this.presentToast(errorMessage, 'danger');
      }
    });
  }

  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  supprimerImagePrincipale() {
    this.produit.image = '';
    delete this.formErrors.image;
  }

  retourner() {
    this.router.navigate(['/produits']);
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

  reinitialiserFormulaire() {
    this.produit = {
      nom: '',
      description: '',
      prix: null,
      categorie: '',
      ville: '',
      image: '',
      imagesSupplementaires: [],
      stock: 1
    };
    this.formErrors = {};
  }

  ouvrirInputImage(type: 'principale' | 'supplementaire' = 'principale') {
    const inputId = type === 'principale' ? 'fileInputPrincipal' : 'fileInputSupplementaire';
    document.getElementById(inputId)?.click();
  }

  onFileSelected(event: any, type: 'principale' | 'supplementaire' = 'principale') {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.presentToast('L\'image ne doit pas dépasser 5MB', 'danger');
        return;
      }
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.presentToast('Veuillez sélectionner une image valide', 'danger');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'principale') {
          this.produit.image = reader.result as string;
          delete this.formErrors.image;
        } else {
          if (this.produit.imagesSupplementaires.length < 3) {
            this.produit.imagesSupplementaires.push(reader.result as string);
          } else {
            this.presentToast('Maximum 3 images supplémentaires atteint', 'warning');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }
}