import { Component, OnInit, OnDestroy } from '@angular/core';
import { PanierService } from 'src/app/services/panier.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-valider-commande',
  templateUrl: './valider-commande.page.html',
  styleUrls: ['./valider-commande.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ValiderCommandePage implements OnInit, OnDestroy {
  adresse = '';
  telephone = '';
  modePaiement = '';
  mobileMoneyNumero = '';
  mobileMoneyNom = '';
  mobileMoneyOperateur = 'orange';
  carteNumero = '';
  carteExpiration = '';
  carteCVV = '';
  nomComplet = '';

  produits: any[] = [];
  total: number = 0;
  fraisLivraison: number = 0;
  totalGeneral: number = 0;
  isLoading = false;
  isSubmitting = false;

  private panierSubscription!: Subscription;

  operateursMobileMoney = [
    { value: 'orange', label: 'Orange Money', icon: 'logo-android' },
    { value: 'mtn', label: 'MTN Money', icon: 'logo-apple' },
    { value: 'moov', label: 'Moov Money', icon: 'logo-no-smoking' }
  ];

  constructor(
    private panierService: PanierService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.panierSubscription = this.panierService.getPanierObservable().subscribe(panier => {
      this.produits = panier;
      this.calculerTotaux();
    });

    this.chargerInfosUtilisateur();
  }

  ngOnDestroy() {
    if (this.panierSubscription) {
      this.panierSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.produits = this.panierService.getProduits();
    this.calculerTotaux();
  }

  // 🔥 SOLUTION : Charger les infos uniquement pour l'utilisateur actuel
  async chargerInfosUtilisateur() {
    const userId = localStorage.getItem('userId');
    const currentUserInfo = localStorage.getItem('currentUserInfo');
    
    if (userId && currentUserInfo) {
      try {
        const userInfo = JSON.parse(currentUserInfo);
        // Vérifier que les infos correspondent à l'utilisateur actuel
        if (userInfo.userId === userId) {
          this.nomComplet = userInfo.nom || '';
          this.telephone = userInfo.telephone || '';
          this.adresse = userInfo.adresse || '';
        } else {
          // Nettoyer si ce n'est pas le bon utilisateur
          this.nettoyerInfosUtilisateur();
        }
      } catch (e) {
        console.error('Erreur lors du parsing des infos utilisateur', e);
        this.nettoyerInfosUtilisateur();
      }
    } else {
      this.nettoyerInfosUtilisateur();
    }
  }

  // 🔥 NOUVELLE MÉTHODE : Nettoyer les informations
  nettoyerInfosUtilisateur() {
    this.nomComplet = '';
    this.telephone = '';
    this.adresse = '';
  }

  calculerTotaux() {
    this.total = this.panierService.getTotal();
    this.fraisLivraison = this.calculerFraisLivraison();
    this.totalGeneral = this.total + this.fraisLivraison;
  }

  calculerFraisLivraison(): number {
    return this.total > 25000 ? 0 : 1500;
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  validerNumeroTelephone(numero: string): boolean {
    const regex = /^(77|76|70|75|78)[0-8]{7}$/;
    return regex.test(numero.replace(/\s/g, ''));
  }

  validerNumeroCarte(numero: string): boolean {
    const cleaned = numero.replace(/\s/g, '');
    return /^[0-9]{16}$/.test(cleaned);
  }

  validerDateExpiration(date: string): boolean {
    return /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(date);
  }

  validerCVV(cvv: string): boolean {
    return /^[0-9]{3,4}$/.test(cvv);
  }

  async validerCommande() {
    if (this.isSubmitting) return;
    
    if (!this.nomComplet.trim() || !this.adresse.trim() || !this.telephone.trim() || !this.modePaiement) {
      await this.showToast('Veuillez remplir tous les champs requis');
      return;
    }

    if (!this.validerNumeroTelephone(this.telephone)) {
      await this.showToast('Veuillez entrer un numéro de téléphone valide (format MALI)');
      return;
    }

    let infosPaiement: any = {};

    if (this.modePaiement === 'mobile_money') {
      if (!this.mobileMoneyNumero.trim() || !this.mobileMoneyNom.trim()) {
        await this.showToast('Veuillez renseigner les informations Mobile Money');
        return;
      }
      
      if (!this.validerNumeroTelephone(this.mobileMoneyNumero)) {
        await this.showToast('Veuillez entrer un numéro Mobile Money valide');
        return;
      }

      infosPaiement = {
        type: 'mobile_money',
        operateur: this.mobileMoneyOperateur,
        numero: this.mobileMoneyNumero,
        nom: this.mobileMoneyNom,
      };
    } else if (this.modePaiement === 'carte_bancaire') {
      if (!this.carteNumero.trim() || !this.carteExpiration.trim() || !this.carteCVV.trim()) {
        await this.showToast('Veuillez renseigner les informations de la carte bancaire');
        return;
      }

      if (!this.validerNumeroCarte(this.carteNumero)) {
        await this.showToast('Numéro de carte invalide (16 chiffres requis)');
        return;
      }

      if (!this.validerDateExpiration(this.carteExpiration)) {
        await this.showToast('Date d\'expiration invalide (format MM/AA)');
        return;
      }

      if (!this.validerCVV(this.carteCVV)) {
        await this.showToast('CVV invalide (3 ou 4 chiffres requis)');
        return;
      }

      infosPaiement = {
        type: 'carte_bancaire',
        numero: this.carteNumero.replace(/\s/g, ''),
        expiration: this.carteExpiration,
        cvv: this.carteCVV,
      };
    }

    const commande = {
      utilisateur: localStorage.getItem('userId'),
      produits: this.produits.map(p => ({
        produit: p._id,
        quantite: p.quantite,
        prixUnitaire: p.prix,
        nomProduit: p.nom
      })),
      total: this.total,
      adresseLivraison: this.adresse,
      modePaiement: this.modePaiement,
      infosPaiement: this.modePaiement !== 'especes' ? {
        numero: this.telephone,
        transactionId: 'tx-' + Date.now()
      } : null,
      nomComplet: this.nomComplet,
      telephone: this.telephone
    };

    this.isSubmitting = true;
    const loading = await this.loadingController.create({
      message: 'Validation de la commande...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non disponible');
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response: any = await this.http
        .post('https://bakend-artisanal.onrender.com/api/commandes', commande, { headers })
        .toPromise();

      await loading.dismiss();
      this.isSubmitting = false;

      // 🔥 SOLUTION : Sauvegarder avec l'ID utilisateur
      this.sauvegarderInfosUtilisateur();

      await this.showSuccessAlert(response.commandeId);
      this.panierService.viderPanier();
      this.router.navigate(['/mes-commandes'], { 
        queryParams: { commandeSuccess: true } 
      });
    } catch (error: any) {
      await loading.dismiss();
      this.isSubmitting = false;
      
      console.error('Erreur lors de la commande:', error);
      let errorMessage = "Erreur lors de l'envoi de la commande";
      
      if (error.status === 401) {
        errorMessage = "Veuillez vous reconnecter";
        this.router.navigate(['/login']);
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      await this.showToast(errorMessage, 'danger');
    }
  }

  // 🔥 SOLUTION : Sauvegarder avec l'ID utilisateur
  sauvegarderInfosUtilisateur() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const userInfo = {
      userId: userId, // 🔥 Associer à l'utilisateur actuel
      nom: this.nomComplet,
      telephone: this.telephone,
      adresse: this.adresse,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('currentUserInfo', JSON.stringify(userInfo));
  }

  async showSuccessAlert(commandeId?: string) {
    const message = commandeId 
      ? `Votre commande #${commandeId} a été validée avec succès !`
      : 'Votre commande a été validée avec succès !';

    const alert = await this.alertController.create({
      header: 'Commande Validée ✅',
      message,
      buttons: [
        {
          text: 'Voir mes commandes',
          handler: () => {
            this.router.navigate(['/mes-commandes']);
          }
        }
      ]
    });
    await alert.present();
  }

  formaterNumeroCarte(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    if (value.length > 16) {
      value = value.substring(0, 16);
    }
    
    this.carteNumero = value.replace(/(\d{4})/g, '$1 ').trim();
  }

  formaterDateExpiration(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    
    if (value.length > 2) {
      this.carteExpiration = value.substring(0, 2) + '/' + value.substring(2);
    } else {
      this.carteExpiration = value;
    }
  }

  annulerCommande() {
    this.router.navigate(['/panier']);
  }

  get livraisonGratuite(): boolean {
    return this.fraisLivraison === 0;
  }
}
