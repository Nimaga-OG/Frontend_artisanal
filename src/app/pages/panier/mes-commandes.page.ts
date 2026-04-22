import { Component, OnInit } from '@angular/core';
import { CommandeService } from 'src/app/services/commande.service';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mes-commandes',
  templateUrl: './mes-commandes.page.html',
  styleUrls: ['./mes-commandes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule],
})
export class MesCommandesPage implements OnInit {
  commandes: any[] = [];
  filteredCommandes: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  statutFiltre: string = 'tous';
  triFiltre: string = 'dateDesc';

  // Couleurs et icônes pour les statuts
  statutConfig: { [key: string]: { color: string, icon: string, text: string } } = {
    'en_attente': { color: 'warning', icon: 'time-outline', text: 'En attente' },
    'confirme': { color: 'primary', icon: 'checkmark-circle-outline', text: 'Confirmée' },
    'en_cours': { color: 'tertiary', icon: 'bicycle-outline', text: 'En cours' },
    'livre': { color: 'success', icon: 'checkmark-done-outline', text: 'Livrée' },
    'annule': { color: 'danger', icon: 'close-circle-outline', text: 'Annulée' },
    'refunde': { color: 'medium', icon: 'arrow-undo-outline', text: 'Remboursée' }
  };

  constructor(
    private commandeService: CommandeService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private location: Location
  ) {}

  ngOnInit() {
    this.getCommandes();
  }
  retour() {
    this.location.back();
  }

  async getCommandes() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Chargement de vos commandes...',
      spinner: 'crescent'
    });
    await loading.present();

    this.commandeService.getMesCommandes().subscribe({
      next: (res) => {
        this.commandes = res.map(commande => ({
          ...commande,
          produits: commande.produits || [],
          statutConfig: this.statutConfig[commande.statut] || this.statutConfig['en_attente']
        }));
        this.filtrerCommandes();
        this.isLoading = false;
        loading.dismiss();
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des commandes :', err);
        this.isLoading = false;
        loading.dismiss();
        this.presentToast('Erreur lors du chargement des commandes', 'danger');
      },
    });
  }

  filtrerCommandes() {
    this.filteredCommandes = this.commandes.filter(commande => {
      const correspondRecherche = !this.searchTerm || 
        commande._id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        commande.produits.some((p: any) => 
          p.produit?.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      
      const correspondStatut = this.statutFiltre === 'tous' || commande.statut === this.statutFiltre;
      
      return correspondRecherche && correspondStatut;
    });

    this.trierCommandes();
  }

  trierCommandes() {
    switch (this.triFiltre) {
      case 'dateDesc':
        this.filteredCommandes.sort((a, b) => 
          new Date(b.createdAt || b.dateCommande).getTime() - new Date(a.createdAt || a.dateCommande).getTime()
        );
        break;
      case 'dateAsc':
        this.filteredCommandes.sort((a, b) => 
          new Date(a.createdAt || a.dateCommande).getTime() - new Date(b.createdAt || b.dateCommande).getTime()
        );
        break;
      case 'totalDesc':
        this.filteredCommandes.sort((a, b) => b.total - a.total);
        break;
      case 'totalAsc':
        this.filteredCommandes.sort((a, b) => a.total - b.total);
        break;
      default:
        break;
    }
  }

 getImageUrl(imagePath: string): string {
  if (!imagePath) return 'assets/images/placeholder-product.jpg'; // local Angular

  if (imagePath.startsWith('http')) return imagePath;

  // Nettoyer le chemin pour éviter le double 'uploads/'
  const cleanPath = imagePath.replace(/^\/?uploads[\/\\]?/, '');

  return `https://bakend-artisanal.onrender.com/uploads/${cleanPath}`;
}
async doRefresh(event: any) {
  await this.getCommandes();
  event.target.complete();
}

  getNombreProduits(commande: any): number {
    return commande.produits.reduce((total: number, item: any) => total + (item.quantite || 1), 0);
  }

  async annulerCommande(commande: any) {
    if (commande.statut !== 'en_attente') {
      this.presentToast('Seules les commandes en attente peuvent être annulées', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmer l\'annulation',
      message: `Êtes-vous sûr de vouloir annuler la commande #${commande._id} ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Annulation en cours...',
              spinner: 'crescent'
            });
            await loading.present();

            this.commandeService.annulerCommande(commande._id).subscribe({
              next: () => {
                commande.statut = 'annule';
                commande.statutConfig = this.statutConfig['annule'];
                loading.dismiss();
                this.presentToast('Commande annulée avec succès', 'success');
              },
              error: (err) => {
                console.error('Erreur lors de l\'annulation', err);
                loading.dismiss();
                this.presentToast('Erreur lors de l\'annulation', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  suivreCommande(commande: any) {
    // Implémentation du suivi de commande
    this.presentToast('Fonctionnalité de suivi à venir', 'info');
  }

  recommander(commande: any) {
    // Implémentation de la recommander
    this.presentToast('Fonctionnalité de recommander à venir', 'info');
  }

  getStatutCount(statut: string): number {
    return this.commandes.filter(c => c.statut === statut).length;
  }

  getTotalCommandes(): number {
    return this.commandes.length;
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

  trackByCommandeId(index: number, commande: any): string {
    return commande._id;
  }
}
