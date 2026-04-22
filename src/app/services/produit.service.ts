import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = `${environment.apiUrl}/produits`;
  

  constructor(private http: HttpClient) {}

  // ✅ NOUVELLE MÉTHODE : Ajouter un produit avec images multiples
  ajouterProduitAvecImagesMultiples(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/avec-images-multiples`, formData);
  }

  // ✅ MODIFIER la méthode existante pour supporter multiple images
  ajouter(produit: FormData): Observable<any> {
    return this.http.post(this.apiUrl, produit);
  }

  // 🔍 Lister avec filtres optionnels (ville, catégorie)
  getAll(filters?: any) {
    let params = new HttpParams();
    if (filters?.ville) params = params.set('ville', filters.ville);
    if (filters?.categorie) params = params.set('categorie', filters.categorie);
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // 📄 Obtenir un produit par ID (avec formatage des images)
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((produit: any) => this.formatImageUrls(produit))
    );
  }

  // ✅ MÉTHODE POUR FORMATER LES URLS DES IMAGES SUPPLÉMENTAIRES
  formatImageUrls(produit: any): any {
    if (!produit) return produit;

    // Formater l'image principale
    if (produit.image) {
      produit.imageUrl = this.formatImageUrl(produit.image);
    }

    // Formater les images supplémentaires
    if (produit.imagesSupplementaires && Array.isArray(produit.imagesSupplementaires)) {
      produit.imagesSupplementairesUrls = produit.imagesSupplementaires.map((img: string) => 
        this.formatImageUrl(img)
      );
    } else {
      produit.imagesSupplementairesUrls = [];
    }

    return produit;
  }

  // ✅ SURCHARGER les méthodes existantes pour formater les images
  getProduits(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const produits = this.extractProduitsArray(response);
        return produits.map(produit => this.formatImageUrls(produit));
      })
    );
  }

  getProduitById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      map((produit: any) => this.formatImageUrls(produit))
    );
  }

  getMesProduits(): Observable<any[]> {
    return this.http.get<any>('http://localhost:5000/api/produits/mes-produits').pipe(
      map(response => {
        const produits = this.extractProduitsArray(response);
        return produits.map(produit => this.formatImageUrls(produit));
      })
    );
  }

  // ❤️ Ajouter ou retirer des favoris
  toggleFavori(id: string) {
    return this.http.put(`${this.apiUrl}/${id}/favori`, {});
  }

  // ❤️ Récupérer mes favoris
  getFavoris() {
    return this.http.get<any[]>(`${this.apiUrl}/favoris/mes`);
  }

  // produit.service.ts
  formatImageUrl(relativePath: string): string {
    if (!relativePath) return 'assets/images/default-product.png';
    if (relativePath.startsWith('http')) return relativePath;

    // Supprimer tout préfixe "uploads/" pour éviter le double
    relativePath = relativePath.replace(/^\/?uploads[\\/]/, '');
    
    return `http://localhost:5000/uploads/${relativePath}`;
  }

  getProduitsParCategorie(categorieId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/categorie/${categorieId}`).pipe(
      map(response => this.extractProduitsArray(response).map(produit => this.formatImageUrls(produit))),
      catchError(error => {
        console.error('Erreur dans getProduitsParCategorie', error);
        return [];
      })
    );
  }

  modifier(id: string, formData: FormData | any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }

  supprimer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  private extractProduitsArray(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.produits)) {
      return response.produits;
    } else if (response && Array.isArray(response.docs)) {
      return response.docs;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('Format de réponse inattendu:', response);
      return [];
    }
  }

}
