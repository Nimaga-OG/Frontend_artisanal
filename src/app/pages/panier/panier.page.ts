import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { PanierService } from 'src/app/services/panier.service';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.page.html',
  styleUrls: ['./panier.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class PanierPage implements OnInit, OnDestroy {
  panier: any[] = [];
  isLoading = false;
  private panierSubscription!: Subscription;

  constructor(
    private panierService: PanierService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private cdr: ChangeDetectorRef // Ajouté pour forcer la détection si nécessaire
  ) {}

  ngOnInit() {
    this.panierSubscription = this.panierService.getPanierObservable().subscribe((data: any[]) => {
      this.panier = data;
      this.cdr.detectChanges(); // Force la mise à jour du DOM si les changements ne sont pas détectés
    });
  }

  ngOnDestroy() {
    if (this.panierSubscription) {
      this.panierSubscription.unsubscribe();
    }
  }

  augmenterQuantite(produitId: string) {
    const produit = this.panier.find(p => p._id === produitId);
    if (produit) {
      // Correction : Vérifier si le stock est défini avant de comparer
      if (produit.stock !== undefined && produit.quantite >= produit.stock) {
        this.presentToast('Stock insuffisant', 'warning');
        return;
      }
      this.panierService.ajouterProduit(produit);
      this.presentToast('Quantité augmentée', 'success');
    }
  }

  diminuerQuantite(produitId: string) {
    const produit = this.panier.find(p => p._id === produitId);
    if (produit && produit.quantite > 1) {
      this.panierService.supprimerDuPanier(produitId);
      this.presentToast('Quantité diminuée', 'success');
    }
  }

  async supprimerProduit(produitId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer ce produit du panier ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          handler: () => {
            this.panierService.supprimerProduit(produitId);
            this.presentToast('Produit supprimé du panier', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  getTotal(): number {
    return this.panier.reduce((total, item) => total + item.prix * item.quantite, 0);
  }

  getTotalArticles(): number {
    return this.panier.reduce((total, item) => total + item.quantite, 0);
  }

  getFraisLivraison(): number {
    // Exemple: frais de livraison fixes ou calculés
    return this.getTotal() > 10000 ? 0 : 1500; // Livraison gratuite au-dessus de 10 000 FCFA
  }

  getTotalGeneral(): number {
    return this.getTotal() + this.getFraisLivraison();
  }

  async passerCommande() {
    const token = localStorage.getItem('token');

    if (!token) {
      const alert = await this.alertCtrl.create({
        header: 'Connexion requise',
        message: 'Veuillez vous connecter pour finaliser votre commande',
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel'
          },
          {
            text: 'Se connecter',
            handler: () => {
              this.router.navigate(['/login'], { 
                queryParams: { returnUrl: '/panier' } 
              });
            }
          }
        ]
      });

      await alert.present();
      return;
    }

    // Vérification supplémentaire : panier non vide
    if (this.panier.length === 0) {
      this.presentToast('Votre panier est vide', 'warning');
      return;
    }

    // Vérifier le stock avant de passer commande
    const produitsHorsStock = this.panier.filter(item => 
      item.stock !== undefined && item.quantite > item.stock
    );

    if (produitsHorsStock.length > 0) {
      const nomsProduits = produitsHorsStock.map(p => p.nom).join(', ');
      this.presentToast(`Stock insuffisant pour: ${nomsProduits}`, 'danger');
      return;
    }

    // Afficher un loader pendant le traitement
    const loading = await this.loadingCtrl.create({
      message: 'Préparation de votre commande...',
    });
    await loading.present();

    try {
      const commande = {
        produits: this.panier,
        total: this.getTotal(),
        fraisLivraison: this.getFraisLivraison(),
        totalGeneral: this.getTotalGeneral(),
        date: new Date().toISOString()
      };

      // Simulation d'un délai (remplacez par un appel API réel)
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.router.navigate(['/valider-commande'], {
        queryParams: {
          commande: JSON.stringify(commande)
        }
      });
    } catch (error) {
      this.presentToast('Erreur lors de la préparation de la commande', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  viderPanier() {
    this.panierService.viderPanier();
    this.presentToast('Panier vidé', 'success');
  }

  continuerAchats() {
    this.router.navigate(['/produits']);
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

 getImageUrl(imagePath: string): string {
  if (!imagePath) return 'assets/images/placeholder-product.jpg'; // Image par défaut locale
  if (imagePath.startsWith('http')) return imagePath;

  // Nettoyer le chemin pour éviter le double 'uploads/'
  const cleanPath = imagePath.replace(/^\/?uploads[\/\\]?/, ''); // ✅ Regex corrigée

  return `https://bakend-artisanal.onrender.com/uploads/${cleanPath}`;
}


  onImageError(item: any) {
    item.image = 'assets/images/placeholder-product.jpg';
  }

  trackByProduitId(index: number, item: any): string {
    return item._id;
  }
}
