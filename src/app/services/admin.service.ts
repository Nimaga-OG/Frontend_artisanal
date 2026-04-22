import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Alerte } from '../models/alerte.model';
import { Activite } from '../models/activite.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ==================== UTILISATEURS ====================
  
  /**
   * Récupérer tous les utilisateurs (avec pagination et filtres)
   */
  getUtilisateurs(page: number = 1, limit: number = 50, filters?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<any>(`${this.apiUrl}/utilisateurs`, { params });
  }

  /**
   * Récupérer les utilisateurs récents
   */
  getUtilisateursRecents(limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/utilisateurs/recentes?limit=${limit}`);
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  getUtilisateurById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/utilisateurs/${id}`);
  }

  /**
   * Mettre à jour le statut d'un utilisateur
   */
  updateUtilisateurStatut(id: string, actif: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/utilisateurs/${id}/statut`, { actif });
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  updateUtilisateurRole(id: string, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/utilisateurs/${id}/role`, { role });
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUtilisateur(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/utilisateurs/${id}`);
  }

  // ==================== PRODUITS ====================

  /**
   * Récupérer tous les produits (avec pagination et filtres)
   */
  getProduits(page: number = 1, limit: number = 50, filters?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<any>(`${this.apiUrl}/produits`, { params });
  }

  /**
   * Récupérer les produits récents
   */
  getProduitsRecents(limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/produits/recentes?limit=${limit}`);
  }

  /**
   * Mettre à jour le statut d'un produit
   */
  updateProduitStatut(id: string, actif: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/produits/${id}/statut`, { actif });
  }

  /**
   * Supprimer définitivement un produit
   */
  deleteProduit(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/produits/${id}`);
  }
  /**
   * Récupère les produits les plus populaires
   */
  getProduitsPopulaires(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/produits/populaires`);
  }



  // ==================== COMMANDES ====================

  /**
   * Récupérer toutes les commandes
   */
  getCommandes(page: number = 1, limit: number = 50, filters?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<any>(`${this.apiUrl}/commandes`, { params });
  }

  /**
   * Récupérer les commandes récentes
   */
  getCommandesRecentes(limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/commandes/recentes?limit=${limit}`);
  }

  /**
   * Récupérer une commande par son ID
   */
  getCommandeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/commandes/${id}`);
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  updateCommandeStatut(id: string, statut: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/commandes/${id}/statut`, { statut });
  }

  /**
   * Annuler une commande
   */
  annulerCommande(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/commandes/${id}/annuler`, {});
  }

  // ==================== STATISTIQUES ====================

  /**
   * Récupérer les statistiques générales
   */
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  /**
   * Récupérer les statistiques des ventes
   */
  getStatsVentes(debut?: string, fin?: string): Observable<any> {
    let params = new HttpParams();
    
    if (debut) params = params.set('debut', debut);
    if (fin) params = params.set('fin', fin);

    return this.http.get<any>(`${this.apiUrl}/stats/ventes`, { params });
  }

  /**
   * Récupérer les statistiques des utilisateurs
   */
  getStatsUtilisateurs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/utilisateurs`);
  }

  /**
   * Récupérer les statistiques des produits
   */
  getStatsProduits(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/produits`);
  }
  getRecentUtilisateurs(limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/utilisateurs/recentes?limit=${limit}`);
  }
  getRecentProduits(limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/produits/recentes?limit=${limit}`);
  }
  getRecentVentes(limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ventes/recentes?limit=${limit}`);
  }

  // ==================== RAPPORTS ====================

  /**
   * Générer un rapport des ventes
   */
  genererRapportVentes(debut: string, fin: string, format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    const params = new HttpParams()
      .set('debut', debut)
      .set('fin', fin)
      .set('format', format);

    return this.http.get(`${this.apiUrl}/rapports/ventes`, { 
      params, 
      responseType: 'blob' 
    });
  }

  /**
   * Générer un rapport des utilisateurs
   */
  genererRapportUtilisateurs(format: 'csv' | 'pdf' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/rapports/utilisateurs`, { 
      params: { format },
      responseType: 'blob' 
    });
  }

  // ==================== CATÉGORIES ====================

  /**
   * Récupérer toutes les catégories
   */
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Créer une nouvelle catégorie
   */
  createCategorie(nom: string, description?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, { nom, description });
  }

  /**
   * Mettre à jour une catégorie
   */
  updateCategorie(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/categories/${id}`, data);
  }

  /**
   * Supprimer une catégorie
   */
  deleteCategorie(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  // ==================== DASHBOARD ====================

  /**
   * Récupérer les données du dashboard
   */
  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  // ==================== LOGS ====================

  /**
   * Récupérer les logs d'activité
   */
  getLogs(page: number = 1, limit: number = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/logs`, { params });
  }

  // ==================== PARAMÈTRES ====================

  /**
   * Récupérer les paramètres de l'application
   */
  getParametres(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/parametres`);
  }

  /**
   * Mettre à jour les paramètres de l'application
   */
  updateParametres(parametres: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/parametres`, parametres);
  }

  // ==================== UTILITAIRES ====================

  /**
   * Vérifier si l'utilisateur a les droits d'administration
   */
  checkAdminAccess(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check-access`);
  }

  /**
   * Nettoyer les anciennes données
   */
  nettoyerDonnees(jours: number = 365): Observable<any> {
    return this.http.post(`${this.apiUrl}/nettoyage`, { jours });
  }

  /**
   * Sauvegarder la base de données
   */
  sauvegarderBDD(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sauvegarde`, { 
      responseType: 'blob' 
    });
  }

  // ==================== GESTION DES ERREURS ====================

  /**
   * Intercepter et logger les erreurs
   */
  private handleError(error: any): Observable<never> {
    console.error('Erreur AdminService:', error);
    throw error;
  }
  /**
   * Récupère les alertes importantes
   */
  getAlertes(): Observable<Alerte[]> {
    return this.http.get<Alerte[]>(`${this.apiUrl}/alertes`);
  }
   /**
   * Récupère les activités récentes
   */
  getActivitesRecentes(): Observable<Activite[]> {
    return this.http.get<Activite[]>(`${this.apiUrl}/activites/recentes`);
  }
}