// src/app/components/splash-screen/splash-screen.component.ts
import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationController, IonicModule } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service'; // ← Nouvelle importation

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class SplashScreenComponent implements AfterViewInit {
  
  constructor(
    private router: Router,
    private animationCtrl: AnimationController,
    private authService: AuthService,
    private storageService: StorageService // ← Nouveau service injecté
  ) { }

  ngAfterViewInit() {
    this.playAnimations();
  }

  async playAnimations() {
    // Animation du logo
    const logo = document.querySelector('.logo');
    const logoAnimation = this.animationCtrl.create()
      .addElement(logo!)
      .duration(1200)
      .fromTo('transform', 'scale(0) rotate(-180deg)', 'scale(1) rotate(0deg)')
      .fromTo('opacity', '0', '1')
      .easing('cubic-bezier(0.68, -0.55, 0.265, 1.55)');

    // Animation du titre
    const title = document.querySelector('.title');
    const titleAnimation = this.animationCtrl.create()
      .addElement(title!)
      .duration(1000)
      .delay(400)
      .fromTo('transform', 'translateY(60px)', 'translateY(0)')
      .fromTo('opacity', '0', '1')
      .easing('cubic-bezier(0.25, 0.46, 0.45, 0.94)');

    // Animation du sous-titre
    const subtitle = document.querySelector('.subtitle');
    const subtitleAnimation = this.animationCtrl.create()
      .addElement(subtitle!)
      .duration(800)
      .delay(600)
      .fromTo('transform', 'translateY(40px)', 'translateY(0)')
      .fromTo('opacity', '0', '1')
      .easing('cubic-bezier(0.25, 0.46, 0.45, 0.94)');

    // Animation de la barre de progression
    const progressBar = document.querySelector('.progress-bar');
    const progressAnimation = this.animationCtrl.create()
      .addElement(progressBar!)
      .duration(2500)
      .delay(800)
      .fromTo('width', '0%', '100%')
      .easing('cubic-bezier(0.39, 0.575, 0.565, 1)');

    // Jouer les animations
    await logoAnimation.play();
    await titleAnimation.play();
    await subtitleAnimation.play();
    await progressAnimation.play();

    // ✅ MARQUER LE PREMIER LANCEMENT COMME TERMINÉ
    this.storageService.setFirstLaunchCompleted();

    // Redirection VERS LOGIN après les animations
    setTimeout(() => {
      this.redirectToLogin();
    }, 500);
  }

  private redirectToLogin() {
    // TOUJOURS rediriger vers login (comme demandé)
    this.router.navigate(['/login']);
  }
}