import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SplashGuard } from './guards/splash.guard'; // ← Nouvelle importation

// Auth
import { LoginPage } from './pages/auth/login/login.page';
import { RegisterPage } from './pages/auth/register/register.page';

// Utilisateur
import { ProfilPage } from './pages/utilisateur/profil/profil.page';
import { ModifierProfilPage } from './pages/utilisateur/modifier-profil.page';
import { ChangerMdpPage } from './pages/utilisateur/changer-mdp.page';
import { UploadPhotoPage } from './pages/utilisateur/upload-photo.page';

// Produits
import { ProduitsPage } from './pages/produits/produits/produits.page';
import { DetailProduitPage } from './pages/produits/details-produit.page';
import { AjouterProduitPage } from './pages/produits/ajouter-produit.page';
import { ModifierProduitPage } from './pages/produits/modifier-produit.page';

// Favoris
import { FavorisPage } from './pages/favoris/favoris.page';

// Commandes / Panier
import { PanierPage } from './pages/panier/panier.page';
import { MesCommandesPage } from './pages/panier/mes-commandes.page';

// Admin
import { AdminPage } from './pages/admin/admin.page';

export const routes: Routes = [
  // Splash Screen - UNIQUEMENT pour le premier lancement
   {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },

  // ✅ Splash Screen - Protégé par le guard de premier lancement
  {
    path: 'splash',
    loadComponent: () => import('./splash-screen.component').then(m => m.SplashScreenComponent),
    canActivate: [SplashGuard] // ← NOUVEAU GUARD
  },

  // Public
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },

  // ⚠️ CHANGEMENT CRITIQUE : La route racine devient la page produits (protégée)
  { 
    path: '',  // Route racine protégée
    component: ProduitsPage, 
    canActivate: [AuthGuard],
    data: { showTabs: true }
  },

  // Routes avec tabs (conserver leurs chemins spécifiques)
  { 
    path: 'produits',  // ⚠️ CONSERVER cette route en parallèle
    component: ProduitsPage, 
    canActivate: [AuthGuard],
    data: { showTabs: true }
  },
  { 
    path: 'favoris', 
    component: FavorisPage, 
    canActivate: [AuthGuard],
    data: { showTabs: true }
  },
  { 
    path: 'panier', 
    component: PanierPage, 
    canActivate: [AuthGuard],
    data: { showTabs: true }
  },
  { 
    path: 'profil', 
    component: ProfilPage, 
    canActivate: [AuthGuard],
    data: { showTabs: true }
  },

  // ⚠️ SUPPRIMER l'ancienne redirection par défaut
  // { path: '', redirectTo: 'splash', pathMatch: 'full' }, // ❌ SUPPRIMER

  // Utilisateur connecté (sans tabs)
  { path: 'modifier-profil', component: ModifierProfilPage, canActivate: [AuthGuard] },
  { path: 'changer-mot-de-passe', component: ChangerMdpPage, canActivate: [AuthGuard] },
  { path: 'upload-photo', component: UploadPhotoPage, canActivate: [AuthGuard] },

  { path: 'ajouter-produit', component: AjouterProduitPage, canActivate: [AuthGuard] },
  { path: 'produits/modifier/:id', component: ModifierProduitPage, canActivate: [AuthGuard] },
  { path: 'produits/:id', component: DetailProduitPage }, // ❗ Publique

  { path: 'mes-commandes', component: MesCommandesPage, canActivate: [AuthGuard] },

  // Admin uniquement
  { path: 'admin-utilisateurs', component: AdminPage, canActivate: [AdminGuard] },

  // ➕ Ajouts dynamiques (loadComponent)
  {
    path: 'valider-commande',
    loadComponent: () => import('./pages/valider-commande/valider-commande.page').then(m => m.ValiderCommandePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'confirmation-commande',
    loadComponent: () => import('./pages/confirmation-commande/confirmation-commande.page').then(m => m.ConfirmationPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'mes-ventes',
    loadComponent: () => import('./pages/mes-ventes/mes-ventes.page').then(m => m.MesVentesPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'mes-produits',
    loadComponent: () => import('./pages/produits/produits/mes-produits.page').then(m => m.MesProduitsPage),
    canActivate: [AuthGuard],
  },

  // ⚠️ CHANGEMENT : Catch-all redirige vers la page appropriée
  { 
    path: '**', 
    canActivate: [AuthGuard], // Le guard gère la redirection
    children: [] 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}