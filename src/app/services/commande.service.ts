import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private baseUrl = 'https://bakend-artisanal.onrender.com/api/commandes'; // 🔁 adapte si nécessaire

  constructor(private http: HttpClient) {}

  passerCommande(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, data);
  }

  getMesCommandes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/mes-commandes`);
  }

  getAllCommandes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  changerStatut(id: string, statut: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/statut`, { statut });
  }
  getToutesCommandes(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/admin`);
}
annulerCommande(id: string): Observable<any> {
  return this.http.delete(`${this.baseUrl}/${id}`);
}


}
