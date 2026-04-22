import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private base = 'https://bakend-artisanal.onrender.com/api/utilisateurs/me';

  constructor(private http: HttpClient) {}

  getMonProfil() {
    return this.http.get<any>(this.base);
  }

  modifierProfil(data: any) {
    return this.http.put<any>(this.base, data);
  }

  changerMotDePasse(data: { motActuel: string; nouveauMot: string }) {
    return this.http.put<any>(`${this.base}/mot-de-passe`, data);
  }

  uploadPhoto(formData: FormData) {
    return this.http.post<any>(`${this.base}/photo`, formData);
  }
   /** Nouvelle méthode : changer photo */
  changerPhoto(formData: FormData) {
    return this.http.post<any>(`${this.base}/photo`, formData);
  }

  /** Nouvelle méthode : supprimer compte */
  supprimerCompte() {
    return this.http.delete<any>(this.base);
  }
}
