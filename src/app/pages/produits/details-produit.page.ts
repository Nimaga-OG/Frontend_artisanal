import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from 'src/app/services/produit.service';
import { PanierService } from 'src/app/services/panier.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, LoadingController, ModalController} from '@ionic/angular';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-detail-produit',
  templateUrl: './details-produit.page.html',
  styleUrls: ['./details-produit.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
})
export class DetailProduitPage implements OnInit {
  public produit: any;
  public favoris: Set<string> = new Set();
  public isLoading = true;
  public quantite = 1;
  public produitsSimilaires: any[] = [];
  public imagePrincipale: string = '';
  public images: string[] = []; // ✅ Toutes les images (principale + supplémentaires)
  public currentImageIndex: number = 0;
  public isPleinEcran: boolean = false;
  private touchStartX: number = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public produitService: ProduitService,
    private panierService: PanierService,
    private favorisService: FavorisService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.chargerProduit(id);
      this.favoris = this.favorisService.getFavoris();
    }
  }

  async chargerProduit(id: string) {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Chargement du produit...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const data = await this.produitService.getProduitById(id).toPromise();
      this.produit = data;

      // ✅ Configurer toutes les images (principale + supplémentaires)
      this.configurerImages();

      this.chargerProduitsSimilaires();
      this.isLoading = false;
    } catch (err) {
      console.error('Erreur lors de la récupération du produit', err);
      this.presentToast('Erreur lors du chargement du produit', 'danger');
      this.router.navigate(['/produits']);
    } finally {
      loading.dismiss();
    }
  }

  // ✅ Nouvelle méthode : configuration des images
  configurerImages() {
    this.images = [];

    // Image principale
    if (this.produit.image) {
      this.imagePrincipale = this.getImageUrl(this.produit.image);
      this.images.push(this.imagePrincipale);
    }

    // Images supplémentaires
    if (this.produit.imagesSupplementaires && Array.isArray(this.produit.imagesSupplementaires)) {
      this.produit.imagesSupplementaires.forEach((img: string) => {
        const url = this.getImageUrl(img);
        this.images.push(url);
      });
    }

    // Si pas d'image principale mais des images supp, utiliser la première comme principale
    if (!this.imagePrincipale && this.images.length > 0) {
      this.imagePrincipale = this.images[0];
    }

    this.currentImageIndex = 0;
  }

  async chargerProduitsSimilaires() {
    if (!this.produit?.categorie) return;
    try {
      const produits = (await this.produitService.getProduitsParCategorie(
        this.produit.categorie._id || this.produit.categorie
      ).toPromise()) || [];
      this.produitsSimilaires = produits
        .filter((p: any) => p._id !== this.produit._id)
        .slice(0, 4)
        .map((p: any) => ({
          ...p,
          imageUrl: this.getImageUrl(p.image)
        }));
    } catch (err) {
      console.error('Erreur lors du chargement des produits similaires', err);
    }
  }

  async ajouterAuPanier() {
    if (!this.produit) return;
    if (this.produit.stock !== undefined && this.produit.stock < this.quantite) {
      this.presentToast('Stock insuffisant', 'warning');
      return;
    }
    for (let i = 0; i < this.quantite; i++) {
      this.panierService.ajouterProduit(this.produit);
    }
    this.presentToast(`${this.quantite} produit(s) ajouté(s) au panier`, 'success');
    const button = document.getElementById('add-to-cart-btn');
    if (button) {
      button.classList.add('adding');
      setTimeout(() => button.classList.remove('adding'), 500);
    }
  }

  async toggleFavori() {
    if (!this.produit) return;
    this.favorisService.toggleFavori(this.produit._id);
    this.favoris = this.favorisService.getFavoris();
    const message = this.estFavori() ? 'Ajouté aux favoris' : 'Retiré des favoris';
    this.presentToast(message, 'success');
  }

  estFavori(): boolean {
    return this.produit && this.favoris.has(this.produit._id);
  }

  getImageUrl(relativePath: string): string {
    return this.produitService.formatImageUrl(relativePath);
  }

  modifierQuantite(change: number) {
    const nouvelleQuantite = this.quantite + change;
    if (nouvelleQuantite < 1) return;
    if (this.produit.stock !== undefined && nouvelleQuantite > this.produit.stock) {
      this.presentToast('Quantité maximale atteinte', 'warning');
      return;
    }
    this.quantite = nouvelleQuantite;
  }

  async partagerProduit() {
    if (!this.produit) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: this.produit.nom,
          text: this.produit.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      this.presentToast('Fonction de partage non disponible', 'warning');
    }
  }

  // Gestion plein écran et navigation images
  ouvrirPleinEcran() {
    this.isPleinEcran = true;
    document.body.style.overflow = 'hidden';
  }

  fermerPleinEcran() {
    this.isPleinEcran = false;
    document.body.style.overflow = '';
  }

  selectionnerImage(index: number) {
    this.currentImageIndex = index;
    this.imagePrincipale = this.images[this.currentImageIndex];
  }

  onTouchStart(event: TouchEvent) {
    if (!this.isPleinEcran) return;
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isPleinEcran) return;
    const touchEndX = event.changedTouches[0].clientX;
    const diffX = this.touchStartX - touchEndX;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        this.changerImage(1); // Swipe gauche
      } else {
        this.changerImage(-1); // Swipe droite
      }
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isPleinEcran) return;
    switch (event.key) {
      case 'ArrowLeft':
        this.changerImage(-1);
        break;
      case 'ArrowRight':
        this.changerImage(1);
        break;
      case 'Escape':
        this.fermerPleinEcran();
        break;
    }
  }

  changerImage(direction: number) {
    if (this.images.length <= 1) return;
    this.currentImageIndex = (this.currentImageIndex + direction + this.images.length) % this.images.length;
    this.imagePrincipale = this.images[this.currentImageIndex];
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

  get estEnStock(): boolean {
    return this.produit?.stock === undefined || this.produit.stock > 0;
  }

  get stockMessage(): string {
    if (this.produit?.stock === undefined) return 'Disponible';
    if (this.produit.stock === 0) return 'Rupture de stock';
    if (this.produit.stock < 5) return `Seulement ${this.produit.stock} disponible(s)`;
    return 'En stock';
  }

  get stockColor(): string {
    if (this.produit?.stock === 0) return 'danger';
    if (this.produit?.stock < 5) return 'warning';
    return 'success';
  }

  allerVersProduitSimilaire(id: string) {
    this.router.navigate(['/produits', id]);
  }

  // ✅ Méthode utilitaire pour le template
  get nombreTotalImages(): number {
    return this.images.length;
  }

  get aImagesSupplementaires(): boolean {
    return this.images.length > 1;
  }
}