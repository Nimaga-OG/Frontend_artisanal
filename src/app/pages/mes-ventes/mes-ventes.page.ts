import { Component, OnInit, OnDestroy } from '@angular/core';
import { VenteService } from 'src/app/services/vente.service';
import { AuthService } from 'src/app/services/auth.service';
import { CommonModule, Location } from '@angular/common';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ProduitService } from 'src/app/services/produit.service'; // Ajout de ProduitService

@Component({
  selector: 'app-mes-ventes',
  templateUrl: './mes-ventes.page.html',
  styleUrls: ['./mes-ventes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class MesVentesPage implements OnInit, OnDestroy {
  ventes: any[] = [];
  filteredVentes: any[] = [];
  loading = true;
  stats: any = {};
  filters = {
    statut: 'tous',
    searchTerm: '',
    dateRange: '30j'
  };
  private userSubscription!: Subscription;

  constructor(
    private venteService: VenteService,
    private authService: AuthService,
    private produitService: ProduitService, // Ajout de ProduitService
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
    this.loadVentes();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async loadVentes() {
    this.loading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Chargement de vos ventes...',
      spinner: 'crescent'
    });
    await loading.present();

    const user = this.authService.getUser();
    if (user?._id) {
      this.venteService.getMesVentes(user._id).subscribe({
        next: (data) => {
          this.ventes = data.map(vente => ({
            ...vente,
            date: new Date(vente.date || vente.createdAt),
            statutColor: this.getStatutColor(vente.statut),
            // Assurer que les infos de paiement existent
            infosPaiement: vente.infosPaiement || {}
          }));
          this.calculateStats();
          this.applyFilters();
          this.loading = false;
          loading.dismiss();
        },
        error: (err) => {
          console.error('Erreur chargement ventes', err);
          this.loading = false;
          loading.dismiss();
          this.presentToast('Erreur lors du chargement des ventes', 'danger');
        }
      });
    } else {
      this.loading = false;
      loading.dismiss();
    }
  }

  calculateStats() {
    this.stats = {
      total: this.ventes.length,
      totalAmount: this.ventes.reduce((sum, vente) => sum + vente.total, 0),
      enAttente: this.ventes.filter(v => v.statut === 'en_attente').length,
      paye: this.ventes.filter(v => v.statut === 'paye').length,
      livre: this.ventes.filter(v => v.statut === 'livre').length,
      annule: this.ventes.filter(v => v.statut === 'annule').length
    };
  }

  applyFilters() {
    this.filteredVentes = this.ventes.filter(vente => {
      // Filtre par statut
      const matchesStatut = this.filters.statut === 'tous' || vente.statut === this.filters.statut;
      
      // Filtre par recherche (étendu aux numéros et infos de paiement)
      const matchesSearch = !this.filters.searchTerm || 
        vente.acheteur.nom_utilisateur?.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
        vente.acheteur.email?.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
        vente.acheteur.telephone?.includes(this.filters.searchTerm) ||
        (vente.infosPaiement?.numero && vente.infosPaiement.numero.includes(this.filters.searchTerm)) ||
        (vente.infosPaiement?.transactionId && vente.infosPaiement.transactionId.includes(this.filters.searchTerm)) ||
        vente.produits.some((p: any) => 
          p.produit.nom.toLowerCase().includes(this.filters.searchTerm.toLowerCase())
        );

      // Filtre par date
      const matchesDate = this.filterByDate(vente.date);

      return matchesStatut && matchesSearch && matchesDate;
    });

    // Trier par date décroissante
    this.filteredVentes.sort((a, b) => b.date - a.date);
  }

  filterByDate(date: Date): boolean {
    const now = new Date();
    const ventDate = new Date(date);

    switch (this.filters.dateRange) {
      case '7j':
        return ventDate >= new Date(now.setDate(now.getDate() - 7));
      case '30j':
        return ventDate >= new Date(now.setDate(now.getDate() - 30));
      case '90j':
        return ventDate >= new Date(now.setDate(now.getDate() - 90));
      case 'annee':
        return ventDate >= new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return true;
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'paye':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'livre':
        return 'primary';
      case 'annule':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'paye':
        return 'checkmark-circle';
      case 'en_attente':
        return 'time';
      case 'livre':
        return 'car';
      case 'annule':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  }

  getModePaiementLabel(mode: string): string {
    switch (mode) {
      case 'orange':
        return 'Orange Money';
      case 'moov':
        return 'Moov Money';
      case 'especes':
        return 'Espèces';
      default:
        return mode;
    }
  }

  getImageUrl(imagePath: string): string {
    return this.produitService.formatImageUrl(imagePath);
  }

  async updateStatut(vente: any, nouveauStatut: string) {
    const alert = await this.alertCtrl.create({
      header: 'Changer le statut',
      message: `Êtes-vous sûr de vouloir changer le statut de cette vente en "${nouveauStatut}" ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Mise à jour du statut...',
              spinner: 'crescent'
            });
            await loading.present();

            this.venteService.updateStatut(vente._id, nouveauStatut).subscribe({
              next: () => {
                vente.statut = nouveauStatut;
                vente.statutColor = this.getStatutColor(nouveauStatut);
                loading.dismiss();
                this.presentToast('Statut mis à jour avec succès', 'success');
              },
              error: (err) => {
                console.error('Erreur mise à jour statut', err);
                loading.dismiss();
                this.presentToast('Erreur lors de la mise à jour', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  contacterClient(telephone: string) {
    window.open(`tel:${telephone}`, '_system');
  }

  voirProduit(id: string) {
    this.router.navigate(['/produits', id]);
  }

  voirDetailsVente(vente: any) {
    this.router.navigate(['/ventes', vente._id]);
  }

  exporterVentes() {
    this.presentToast('Fonctionnalité d\'export à implémenter', 'warning');
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

  getNombreArticles(vente: any): number {
    return vente.produits.reduce((sum: number, item: any) => sum + item.quantite, 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getVentesThisMonth(): number {
    const now = new Date();
    return this.ventes.filter(v => 
      new Date(v.date).getMonth() === now.getMonth() && 
      new Date(v.date).getFullYear() === now.getFullYear()
    ).length;
  }

  getChiffreAffairesMois(): number {
    const now = new Date();
    return this.ventes
      .filter(v => 
        new Date(v.date).getMonth() === now.getMonth() && 
        new Date(v.date).getFullYear() === now.getFullYear() &&
        v.statut !== 'annule'
      )
      .reduce((sum, v) => sum + v.total, 0);
  }

  doRefresh(event: any) {
    this.loadVentes().then(() => {
      event.target.complete();
    });
  }
}