import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  // 📄 Lister toutes les catégories
  getAll() {
    return this.http.get<any[]>(this.apiUrl);
  }

  // ➕ Ajouter une catégorie (admin uniquement)
  ajouter(nom: string) {
    return this.http.post(this.apiUrl, { nom });
  }

  // ❌ Supprimer une catégorie (admin uniquement)
  supprimer(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
