import { Component, OnInit } from '@angular/core';
import { ProduitService } from 'src/app/services/produit.service';
import { Router } from '@angular/router';
import { AlertController, IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TruncatePipe } from '../../truncate.pipe';



@Component({
  selector: 'app-mes-produits',
  templateUrl: './mes-produits.page.html',
  styleUrls: ['./mes-produits.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TruncatePipe],
})
export class MesProduitsPage implements OnInit {
  produits: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  filteredProduits: any[] = [];
  sortBy: string = 'dateDesc';

  constructor(
    private produitService: ProduitService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.chargerMesProduits();
  }

  ionViewWillEnter() {
    this.chargerMesProduits();
  }

  async chargerMesProduits() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Chargement de vos produits...',
      spinner: 'crescent'
    });
    await loading.present();

    this.produitService.getMesProduits().subscribe({
      next: (res) => {
        this.produits = res.map((p: any) => ({
          ...p,
          imageUrl: this.produitService.formatImageUrl(p.image),
          statut: this.getStatutProduit(p)
        }));
        this.filtrerProduits();
        this.isLoading = false;
        loading.dismiss();
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.isLoading = false;
        loading.dismiss();
        this.presentToast('Erreur lors du chargement des produits', 'danger');
      }
    });
  }

  getStatutProduit(produit: any): string {
    if (produit.stock === 0) return 'rupture';
    if (produit.stock < 5) return 'faible';
    return 'disponible';
  }

  filtrerProduits() {
    this.filteredProduits = this.produits.filter(produit =>
      produit.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      produit.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.trierProduits();
  }

  trierProduits() {
    switch (this.sortBy) {
      case 'nomAsc':
        this.filteredProduits.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
      case 'nomDesc':
        this.filteredProduits.sort((a, b) => b.nom.localeCompare(a.nom));
        break;
      case 'prixAsc':
        this.filteredProduits.sort((a, b) => a.prix - b.prix);
        break;
      case 'prixDesc':
        this.filteredProduits.sort((a, b) => b.prix - a.prix);
        break;
      case 'dateDesc':
        this.filteredProduits.sort((a, b) => new Date(b.dateCreation || b.createdAt).getTime() - new Date(a.dateCreation || a.createdAt).getTime());
        break;
      case 'dateAsc':
        this.filteredProduits.sort((a, b) => new Date(a.dateCreation || a.createdAt).getTime() - new Date(b.dateCreation || b.createdAt).getTime());
        break;
      default:
        break;
    }
  }

  modifierProduit(id: string) {
    this.router.navigate(['/produits/modifier', id]);
  }

  async supprimerProduit(id: string) {
    const produit = this.produits.find(p => p._id === id);
    
    const alert = await this.alertCtrl.create({
      header: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le produit "${produit?.nom}" ? Cette action est irréversible.`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Supprimer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Suppression en cours...',
              spinner: 'crescent'
            });
            await loading.present();

            this.produitService.supprimer(id).subscribe({
              next: () => {
                this.produits = this.produits.filter(p => p._id !== id);
                this.filtrerProduits();
                loading.dismiss();
                this.presentToast('Produit supprimé avec succès', 'success');
              },
              error: (err) => {
                console.error('Erreur suppression', err);
                loading.dismiss();
                this.presentToast('Erreur lors de la suppression', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async toggleStatutProduit(produit: any) {
    const nouveauStatut = produit.stock > 0 ? 0 : 10; // Basculer entre disponible et rupture
    
    const loading = await this.loadingCtrl.create({
      message: 'Mise à jour du statut...',
      spinner: 'crescent'
    });
    await loading.present();

    this.produitService.modifier(produit._id, { stock: nouveauStatut }).subscribe({
      next: () => {
        produit.stock = nouveauStatut;
        produit.statut = this.getStatutProduit(produit);
        loading.dismiss();
        this.presentToast('Statut du produit mis à jour', 'success');
      },
      error: (err) => {
        console.error('Erreur mise à jour statut', err);
        loading.dismiss();
        this.presentToast('Erreur lors de la mise à jour', 'danger');
      }
    });
  }

  voirDetails(id: string) {
    this.router.navigate(['/produits', id]);
  }

  ajouterProduit() {
    this.router.navigate(['/ajouter-produit']);
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

  getNombreProduits(): number {
    return this.filteredProduits.length;
  }

  getStatutCount(statut: string): number {
    return this.produits.filter(p => this.getStatutProduit(p) === statut).length;
  }
  retourner() {
    this.router.navigate(['/produits']);
  }
  doRefresh(event: any) {
    this.chargerMesProduits();
    event.target.complete();
  }
}