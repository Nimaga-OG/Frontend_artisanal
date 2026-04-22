import { Component, OnInit } from '@angular/core';
import { ProduitService } from 'src/app/services/produit.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { PanierService } from 'src/app/services/panier.service';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TruncatePipe } from '../truncate.pipe';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-favoris',
  templateUrl: './favoris.page.html',
  styleUrls: ['./favoris.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,RouterModule ,TruncatePipe],
})
export class FavorisPage implements OnInit {
  favoris: any[] = [];
  isLoading = true;
  filteredFavoris: any[] = [];
  searchTerm: string = '';
  sortBy: string = 'dateAdded';
  favorisIds: Set<string> = new Set();

  constructor(
    private produitService: ProduitService,
    private favorisService: FavorisService,
    private panierService: PanierService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private location: Location
  ) {}
  retour() {
    this.location.back();
  }

  ngOnInit() {
    this.chargerFavoris();
  }

  ionViewWillEnter() {
    this.chargerFavoris();
  }

  /** Charger les favoris depuis le service */
  async chargerFavoris() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Chargement de vos favoris...',
      spinner: 'crescent'
    });
    await loading.present();

    // Récupère les IDs de favoris
    this.favorisIds = new Set(this.favorisService.getFavoris());

    // Récupère les produits complets
    this.produitService.getProduits().subscribe({
      next: (produits) => {
        this.favoris = produits
          .filter(p => this.favorisIds.has(p._id))
          .map(p => ({
            ...p,
            imageUrl: this.getImageUrl(p.image),
            dateAdded: p.dateAdded || new Date()
          }));
        this.applyFilters();
        this.isLoading = false;
        loading.dismiss();
      },
      error: (err) => {
        console.error('Erreur chargement favoris', err);
        this.isLoading = false;
        loading.dismiss();
        this.presentToast('Erreur lors du chargement des favoris', 'danger');
      }
    });
  }

  /** Appliquer la recherche et le tri */
  applyFilters() {
    this.filteredFavoris = this.favoris.filter(produit =>
      produit.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      produit.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      produit.categorie?.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.sortFavoris();
  }

  sortFavoris() {
    switch (this.sortBy) {
      case 'nomAsc':
        this.filteredFavoris.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
      case 'nomDesc':
        this.filteredFavoris.sort((a, b) => b.nom.localeCompare(a.nom));
        break;
      case 'prixAsc':
        this.filteredFavoris.sort((a, b) => a.prix - b.prix);
        break;
      case 'prixDesc':
        this.filteredFavoris.sort((a, b) => b.prix - a.prix);
        break;
      case 'dateAdded':
      default:
        this.filteredFavoris.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
    }
  }

  /** Ajouter ou retirer un produit des favoris */
  toggleFavori(produitId: string) {
    this.favorisService.toggleFavori(produitId);
    if (this.favorisIds.has(produitId)) {
      this.favorisIds.delete(produitId);
      this.favoris = this.favoris.filter(p => p._id !== produitId);
    } else {
      this.favorisIds.add(produitId);
    }
    this.applyFilters();
  }

  /** Vérifier si un produit est favori */
  estFavori(produitId: string): boolean {
    return this.favorisIds.has(produitId);
  }

  /** Ajouter au panier */
  async ajouterAuPanier(produit: any) {
    this.panierService.ajouterProduit(produit);
    const button = document.getElementById(`add-to-cart-${produit._id}`);
    if (button) {
      button.classList.add('adding');
      setTimeout(() => button.classList.remove('adding'), 500);
    }
    this.presentToast('Produit ajouté au panier', 'success');
  }

  /** Voir détails produit */
  voirDetails(produitId: string) {
    this.router.navigate(['/produits', produitId]);
  }

  /** Vider tous les favoris */
  async viderFavoris() {
    const alert = await this.alertCtrl.create({
      header: 'Vider les favoris',
      message: 'Êtes-vous sûr de vouloir vider tous vos favoris ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Vider',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Suppression en cours...',
              spinner: 'crescent'
            });
            await loading.present();
            this.favorisIds.forEach(id => this.favorisService.toggleFavori(id));
            this.favoris = [];
            this.filteredFavoris = [];
            loading.dismiss();
            this.presentToast('Favoris vidés', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  /** Obtenir l’URL de l’image */
  getImageUrl(imagePath: string): string {
  if (!imagePath) return 'assets/images/placeholder-product.jpg'; // reste local

  if (imagePath.startsWith('http')) return imagePath;

  // Nettoyer le chemin pour éviter le double 'uploads/'
  const cleanPath = imagePath.replace(/^\/?uploads[\/\\]?/, '');

  return `http://localhost:5000/uploads/${cleanPath}`;
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

  getNombreFavoris(): number {
    return this.filteredFavoris.length;
  }

  trackByProduitId(index: number, item: any): string {
    return item._id;
  }
  doRefresh(event: any) {
    this.chargerFavoris().then(() => {
      event.target.complete();
    });
  }
  
}
