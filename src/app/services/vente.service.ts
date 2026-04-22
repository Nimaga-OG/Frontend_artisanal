import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VenteService {
  private apiUrl = `${environment.apiUrl}/commandes`;

  constructor(private http: HttpClient) {}

  getMesVentes(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/mes-ventes/${userId}`);
  }
  // Ajoutez à vente.service.ts
getAllVentes(): Observable<any> {
  return this.http.get(`${this.apiUrl}/ventes`);
}

updateStatut(venteId: string, statut: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${venteId}/statut`, { statut });
}
}
