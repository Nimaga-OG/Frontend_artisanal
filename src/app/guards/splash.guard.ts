import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class SplashGuard implements CanActivate {
  
  constructor(
    private storageService: StorageService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.storageService.isFirstLaunch()) {
      return true; // Autoriser le splash screen
    } else {
      // Rediriger directement vers l'application
      this.router.navigate(['/produits']);
      return false;
    }
  }
}