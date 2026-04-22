import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PanierService {
  private panierParUtilisateur: { [email: string]: any[] } = {};
  private panierSubject = new BehaviorSubject<any[]>([]);
  public panier$ = this.panierSubject.asObservable();

  constructor(private authService: AuthService) {
  }

  private getEmailUtilisateur(): string {
    const utilisateur = this.authService.utilisateurActuel;
    return utilisateur?.email ?? 'invité';
  }

  private chargerPanierUtilisateur() {
    const email = this.getEmailUtilisateur();
    const panierLocal = localStorage.getItem(`panier_${email}`);
    if (panierLocal) {
      try {
        const panier = JSON.parse(panierLocal);
        // Validez les données ici (par exemple, vérifiez que c'est bien un tableau)
        if (Array.isArray(panier)) {
          this.panierParUtilisateur[email] = panier;
        } else {
          console.error('Données du panier invalides dans le localStorage');
          this.panierParUtilisateur[email] = [];
        }
      } catch (error) {
        console.error('Erreur lors de la désérialisation du panier depuis le localStorage', error);
        this.panierParUtilisateur[email] = [];
      }
    } else {
      this.panierParUtilisateur[email] = [];
    }
    this.panierSubject.next([...this.panierParUtilisateur[email]]);
  }

  private enregistrerPanier(email: string) {
    localStorage.setItem(`panier_${email}`, JSON.stringify(this.panierParUtilisateur[email]));
    this.panierSubject.next([...this.panierParUtilisateur[email]]);
  }

  public ajouterProduit(produit: any) {
    const email = this.getEmailUtilisateur();
    const panier = this.panierParUtilisateur[email] || [];

    const index = panier.findIndex(p => p._id === produit._id);
    if (index !== -1) {
      panier[index].quantite += 1;
    } else {
      panier.push({ ...produit, quantite: 1 });
    }

    this.panierParUtilisateur[email] = panier;
    this.enregistrerPanier(email);
  }

  public supprimerProduit(produitId: string) {
    const email = this.getEmailUtilisateur();
    const panier = this.panierParUtilisateur[email] || [];

    this.panierParUtilisateur[email] = panier.filter(p => p._id !== produitId);
    this.enregistrerPanier(email);
  }

  public supprimerDuPanier(produitId: string) {
    const email = this.getEmailUtilisateur();
    const panier = this.panierParUtilisateur[email] || [];
    const index = panier.findIndex(p => p._id === produitId);

    if (index !== -1) {
      panier[index].quantite -= 1;
      if (panier[index].quantite <= 0) {
        panier.splice(index, 1);
      }
      this.panierParUtilisateur[email] = panier;
      this.enregistrerPanier(email);
    }
  }

  public viderPanier() {
    const email = this.getEmailUtilisateur();
    this.panierParUtilisateur[email] = [];
    this.enregistrerPanier(email);
  }

  public getPanier(): any[] {
    const email = this.getEmailUtilisateur();
    return this.panierParUtilisateur[email] || [];
  }

  public getPanierObservable() {
    return this.panier$;
  }

  /** ✅ Fournit la liste des produits du panier */
  public getProduits(): any[] {
  const email = this.getEmailUtilisateur();
  console.log('Panier pour', email, ':', this.panierParUtilisateur[email]);
  return this.panierParUtilisateur[email] || [];
}

  /** ✅ Fournit la quantité totale de tous les articles du panier */
  public getQuantiteTotale(): number {
    return this.getPanier().reduce((total, item) => total + item.quantite, 0);
  }

  /** ✅ Fournit le total en FCFA de tous les articles du panier */
  public getTotal(): number {
    return this.getPanier().reduce((total, item) => total + item.prix * item.quantite, 0);
  }

  public reinitialiserPanierPourNouvelUtilisateur() {
    this.chargerPanierUtilisateur();
  }

  public initialiser() {
    this.chargerPanierUtilisateur();
  }
}
