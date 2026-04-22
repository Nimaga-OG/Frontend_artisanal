import { Component } from '@angular/core'; 
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from 'src/app/services/produit.service';
import { CategorieService } from 'src/app/services/categorie.service';
import { IonicModule, Platform, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-modifier-produit',
  templateUrl: './modifier-produit.page.html',
  styleUrls: ['./modifier-produit.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ModifierProduitPage {
  produitId = '';
  produit: any = {
    nom: '',
    description: '',
    prix: null,
    categorie: '',
    ville: '',
    image: '',
    stock: 1
  };
  
  categories: any[] = [];
  motsInterdits = ['voiture', 'téléphone', 'ordinateur', 'batterie', 'électroménager', 'appareil', 'portable'];
  isSubmitting = false;
  formErrors: any = {};
  imageChanged = false;
  originalImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitService,
    private categorieService: CategorieService,
    private router: Router,
    private platform: Platform,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  // 🔹 Charger le produit avant affichage
  async ionViewWillEnter() {
    this.produitId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.produitId) {
      const loading = await this.loadingCtrl.create({
        message: 'Chargement du produit...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const produit = await this.produitService.getById(this.produitId).toPromise();
        this.produit = { 
          ...produit,
          categorie: produit.categorie?._id || produit.categorie,
          image: this.produitService.formatImageUrl(produit.image) // ✅ Corrigé ici
        };
        this.originalImage = this.produit.image;
      } catch (err) {
        console.error('Erreur lors du chargement du produit', err);
        this.presentToast('Erreur lors du chargement du produit', 'danger');
        this.router.navigate(['/produits']);
      } finally {
        loading.dismiss();
      }
    }

    this.chargerCategories();
  }

  // 🔹 Charger les catégories
  chargerCategories() {
    this.categorieService.getAll().subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => {
        console.error('Erreur lors du chargement des catégories', err);
        this.presentToast('Erreur lors du chargement des catégories', 'danger');
      }
    });
  }

  // 🔹 Choisir une nouvelle image
  async choisirImage() {
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
      this.imageChanged = true;
      this.formErrors.image = null;
    } catch (err) {
      console.error('❌ Image annulée ou erreur :', err);
    }
  }

  // 🔹 Validation du formulaire
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

    return isValid;
  }

  // 🔹 Modifier le produit
  async modifier() {
    if (this.isSubmitting) return;
    
    if (!this.validerFormulaire()) return;

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Modification en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      let formData: FormData | any;

      if (this.imageChanged && this.produit.image.startsWith('data:')) {
        formData = new FormData();
        formData.append('nom', this.produit.nom.trim());
        formData.append('description', this.produit.description.trim());
        formData.append('prix', this.produit.prix.toString());
        formData.append('categorie', this.produit.categorie);
        formData.append('ville', this.produit.ville.trim() || '');
        formData.append('stock', this.produit.stock.toString());
        formData.append('type', 'artisanal');

        const blob = this.dataURItoBlob(this.produit.image);
        formData.append('image', blob, 'produit.jpg');
      } else {
        formData = {
          nom: this.produit.nom.trim(),
          description: this.produit.description.trim(),
          prix: this.produit.prix,
          categorie: this.produit.categorie,
          ville: this.produit.ville.trim() || '',
          stock: this.produit.stock,
          type: 'artisanal'
        };
      }

      await this.produitService.modifier(this.produitId, formData).toPromise();
      
      loading.dismiss();
      this.isSubmitting = false;
      this.presentToast('✅ Produit modifié avec succès', 'success');
      this.router.navigate(['/produits', this.produitId]);
    } catch (err: any) {
      loading.dismiss();
      this.isSubmitting = false;

      let errorMessage = err.error?.message || 'Erreur lors de la modification';
      if (err.status === 413) errorMessage = "L'image est trop volumineuse";
      if (err.status === 415) errorMessage = "Format d'image non supporté";
      
      this.presentToast(errorMessage, 'danger');
    }
  }

  supprimerImage() {
    this.produit.image = '';
    this.imageChanged = true;
    this.formErrors.image = null;
  }

  restaurerImageOriginale() {
    this.produit.image = this.originalImage;
    this.imageChanged = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.presentToast('L\'image ne doit pas dépasser 5MB', 'danger');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.presentToast('Veuillez sélectionner une image valide', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.produit.image = reader.result as string;
      this.imageChanged = true;
      this.formErrors.image = null;
    };
    reader.readAsDataURL(file);
  }

  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeString });
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
    this.router.navigate(['/produits', this.produitId]);
  }

  ouvrirInputImage() {
    document.getElementById('fileInput')?.click();
  }
}
