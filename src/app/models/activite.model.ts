// src/app/models/activite.model.ts
export interface Activite {
  id: string;
  type: 'vente' | 'utilisateur' | 'produit' | 'systeme';
  titre: string;
  description: string;
  date: string;
  utilisateur?: string;
  metadata?: any;
}

export interface ActiviteRecent {
  id: string;
  type: string;
  titre: string;
  description: string;
  date: string;
  icon?: string;
  color?: string;
}