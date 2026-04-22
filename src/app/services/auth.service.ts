import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap ,catchError} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs';

export interface Utilisateur {
  _id: string;
  nom_utilisateur: string;
  email: string;
  role: 'utilisateur' | 'admin';
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'https://bakend-artisanal.onrender.com/api/auth'; // 🔧 S'assurer que /auth est inclus
  private apiUrl = 'https://bakend-artisanal.onrender.com/api'; // ⚠️ Ajout de la propriété manquante

  private userSubject = new BehaviorSubject<Utilisateur | null>(this.getLocalUser());
  public user$ = this.userSubject.asObservable();

  public utilisateurObservable = this.user$;

  constructor(private http: HttpClient) {}

  // 🔐 Connexion
   login(email: string, mot_de_passe: string): Observable<any> {
    return this.http.post<any>(`${this.base}/login`, { email, mot_de_passe }).pipe(
      tap(res => {
        if (res.token && res.user) {
          // Stocker les informations
          localStorage.setItem('token', res.token);
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          this.userSubject.next(res.user);
        }
      }),
      catchError(error => {
        console.error('Erreur de connexion:', error);
        return throwError(() => error);
      })
    );
  }

  // 🆕 Inscription avec upload de photo
  register(nom_utilisateur: string, email: string, mot_de_passe: string, photo?: File): Observable<any> {
    const formData = new FormData();
    formData.append('nom_utilisateur', nom_utilisateur);
    formData.append('email', email);
    formData.append('mot_de_passe', mot_de_passe);
    if (photo) {
      formData.append('photo', photo);
    }

    return this.http.post(`${this.base}/register`, formData);
  }

  // 🔓 Déconnexion
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.userSubject.next(null);
  }

  // 🔐 Token JWT
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ✅ Est connecté
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // 👤 Utilisateur courant
  getCurrentUser(): Utilisateur | null {
    return this.userSubject.value;
  }

  get utilisateurActuel(): Utilisateur | null {
    return this.getCurrentUser();
  }

  get currentUserRole(): string | null {
    return this.utilisateurActuel?.role || null;
  }

  private getLocalUser(): Utilisateur | null {
    const u = localStorage.getItem('currentUser');
    return u ? JSON.parse(u) : null;
  }

  // Compatibilité ancienne méthode
  getUser(): Utilisateur | null {
    return this.utilisateurActuel;
  }

  // Ajoutez à auth.service.ts
  getAllUtilisateurs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/utilisateurs`);
  }

  updateUtilisateur(userId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/utilisateurs/${userId}`, data);
  }

  // Alias pour compatibilité
  updateUser(userId: string, data: any): Observable<any> {
    return this.updateUtilisateur(userId, data);
  }
}
