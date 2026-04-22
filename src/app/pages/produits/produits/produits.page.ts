import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProduitService } from 'src/app/services/produit.service';
import { PanierService } from 'src/app/services/panier.service';
import { CategorieService } from 'src/app/services/categorie.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TruncatePipe } from '../../truncate.pipe';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';
import { FavorisService } from 'src/app/services/favoris.service';

@Component({
  selector: 'app-produits',
  templateUrl: './produits.page.html',
  styleUrls: ['./produits.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TruncatePipe],
   animations: [
    trigger('cardAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ProduitsPage implements OnInit, OnDestroy {
  produits: any[] = [];
  produitsFiltres: any[] = [];
  categories: any[] = [];
  quantiteTotale: number = 0;
  categorieSelectionnee: string | null = null;
  panierSub!: Subscription;
  favoris: Set<string> = new Set();
  recherche: string = '';
  isLoading: boolean = true;
  erreurChargement: boolean = false;
  triActif: string = 'nom';

  constructor(
    private produitService: ProduitService,
    private panierService: PanierService,
    private categorieService: CategorieService,
    private router: Router,
    private favorisService: FavorisService
  ) {}

  ngOnInit() {
    this.chargerProduits();
    this.chargerCategories();
    this.favoris = new Set(this.favorisService.getFavoris());

    this.panierSub = this.panierService.panier$.subscribe(() => {
      this.quantiteTotale = this.panierService.getQuantiteTotale();
    });
  }

  ngOnDestroy() {
    if (this.panierSub) {
      this.panierSub.unsubscribe();
    }
  }

  chargerProduits() {
    this.isLoading = true;
    this.erreurChargement = false;
    
    this.produitService.getProduits().subscribe({
  next: (data: any[]) => {
    this.produits = data.map(produit => ({
      ...produit,
      imageUrl: this.produitService.formatImageUrl(produit.image),
      enStock: produit.stock > 0
    }));
    this.produitsFiltres = [...this.produits];
    this.trierProduits(this.triActif);
    this.isLoading = false;
  },
  error: (err) => {
    console.error('Erreur lors du chargement des produits', err);
    this.isLoading = false;
    this.erreurChargement = true;
  },
});

  }

  chargerCategories() {
    this.categorieService.getAll().subscribe({
      next: (data: any[]) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories', err);
      },
    });
  }

  filtrerParCategorie(categorieId: string) {
    this.categorieSelectionnee = categorieId;
    this.appliquerFiltres();
  }

  reinitialiserFiltre() {
    this.categorieSelectionnee = null;
    this.recherche = '';
    this.appliquerFiltres();
  }

  rechercherProduits() {
    this.appliquerFiltres();
  }

  appliquerFiltres() {
    this.produitsFiltres = this.produits.filter(produit => {
      // Filtre par catégorie
      const correspondCategorie = !this.categorieSelectionnee || 
        (typeof produit.categorie === 'string' ? 
         produit.categorie === this.categorieSelectionnee : 
         produit.categorie?._id === this.categorieSelectionnee);
      
      // Filtre par recherche
      const correspondRecherche = !this.recherche || 
        produit.nom.toLowerCase().includes(this.recherche.toLowerCase()) ||
        produit.description.toLowerCase().includes(this.recherche.toLowerCase());
      
      return correspondCategorie && correspondRecherche;
    });
    
    this.trierProduits(this.triActif);
  }

  trierProduits(critere: string) {
    this.triActif = critere;
    
    switch(critere) {
      case 'nom':
        this.produitsFiltres.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
      case 'prix-croissant':
        this.produitsFiltres.sort((a, b) => a.prix - b.prix);
        break;
      case 'prix-decroissant':
        this.produitsFiltres.sort((a, b) => b.prix - a.prix);
        break;
      case 'nouveautes':
        // Si vous avez une date de création, triez par date
        // this.produitsFiltres.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
        break;
      default:
        break;
    }
  }

  ajouterAuPanier(produit: any) {
    if (produit.enStock) {
      this.panierService.ajouterProduit(produit);
      
      // Animation feedback
      const button = document.getElementById(`add-to-cart-${produit._id}`);
      if (button) {
        button.classList.add('adding');
        setTimeout(() => button.classList.remove('adding'), 500);
      }
    }
  }

  toggleFavori(id: string, event: Event) {
    event.stopPropagation();
    this.favorisService.toggleFavori(id);
    this.favoris = new Set(this.favorisService.getFavoris());
  }

  voirDetails(id: string) {
    this.router.navigate(['/produits', id]);
  }

  ajouterProduit() {
    this.router.navigate(['/ajouter-produit']);
  }

  allerAuPanier() {
    this.router.navigate(['/panier']);
  }

  recharger() {
    this.chargerProduits();
    this.chargerCategories();
  }
  doRefresh(event: any) {
    this.chargerProduits();
    this.chargerCategories();
    event.target.complete();
  }
}