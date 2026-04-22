import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FavorisService {
  private readonly favorisKey = 'mes_favoris';

  // Observable qui notifie les composants des changements
  private favorisSubject = new BehaviorSubject<Set<string>>(this.chargerDepuisStorage());
  favoris$ = this.favorisSubject.asObservable();

  constructor() {}

  /** Charger les favoris depuis localStorage */
  private chargerDepuisStorage(): Set<string> {
    try {
      const data = localStorage.getItem(this.favorisKey);
      return new Set(data ? JSON.parse(data) : []);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris :', error);
      return new Set();
    }
  }

  /** Sauvegarder les favoris dans localStorage */
  private sauvegarderDansStorage(favoris: Set<string>): void {
    try {
      localStorage.setItem(this.favorisKey, JSON.stringify([...favoris]));
      this.favorisSubject.next(favoris); // notifier les observateurs
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris :', error);
    }
  }

  /** Récupérer tous les favoris */
  getFavoris(): Set<string> {
  return this.chargerDepuisStorage();
}


  /** Ajouter ou retirer un favori */
  toggleFavori(id: string): void {
    const favoris = new Set(this.favorisSubject.value);
    if (favoris.has(id)) {
      favoris.delete(id);
    } else {
      favoris.add(id);
    }
    this.sauvegarderDansStorage(favoris);
  }

  /** Vérifier si un produit est en favori */
  estFavori(id: string): boolean {
    return this.favorisSubject.value.has(id);
  }

  /** Vider complètement les favoris */
  clearFavoris(): void {
    localStorage.removeItem(this.favorisKey);
    this.favorisSubject.next(new Set());
  }
}
