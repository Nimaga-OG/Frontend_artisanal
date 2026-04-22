import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { Platform } from '@ionic/angular'; // ✅ Ajoute ceci en haut
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanierService } from './services/panier.service';
import { RouterModule } from '@angular/router';
import { NotificationService } from './services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class AppComponent implements OnInit {
  currentRoute: string = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    public panierService: PanierService,
    private notificationService: NotificationService,
    private menuCtrl: MenuController, // ✅ Pour contrôler le menu
    private platform: Platform // ✅ Injecte la plateforme
  ) {
    // 🔥 Fermer automatiquement le menu à chaque navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(async (event: any) => {
        this.currentRoute = event.url;
        await this.menuCtrl.close(); // ✅ Ferme le menu après navigation
      });
  }

    async ngOnInit() {
    await this.platform.ready(); // ✅ Assure-toi que tout est prêt avant d’exécuter ton code

    this.authService.utilisateurObservable.subscribe((user) => {
      if (user) {
        this.panierService.initialiser();
      }
    });
  }
  async logout() {
    await this.menuCtrl.close(); // ✅ Ferme le menu avant logout
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Déterminer si les tabs doivent être affichées
  showTabs(): boolean {
    const estConnecte = this.authService.isLoggedIn();
    if (!estConnecte) return false;

    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data && route.data['showTabs'] === true;
  }
}
