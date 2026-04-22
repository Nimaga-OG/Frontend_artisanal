// src/app/models/alerte.model.ts
export interface Alerte {
  id: string;
  niveau: 'high' | 'medium' | 'low';
  titre: string;
  message: string;
  date: string;
  lue: boolean;
  type?: string;
  actionRequise?: boolean;
  metadata?: any;
}

export interface AlerteImportante {
  id: string;
  niveau: string;
  titre: string;
  message: string;
  date: string;
  lue: boolean;
  icon?: string;
}