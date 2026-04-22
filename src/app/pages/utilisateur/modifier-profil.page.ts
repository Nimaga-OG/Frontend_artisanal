import { Component } from '@angular/core';
import { UtilisateurService } from 'src/app/services/utilisateur.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modifier-profil',
  templateUrl: './modifier-profil.page.html',
  styleUrls: ['./modifier-profil.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule],
})
export class ModifierProfilPage {
  user = {
    nom_utilisateur: '',
    email: '',
    ville: '',
    biographie: ''
  };

  constructor(private utilisateurService: UtilisateurService, private router: Router) {}

  ionViewWillEnter() {
    this.utilisateurService.getMonProfil().subscribe(res => {
      this.user = res;
    });
  }

  modifier() {
    this.utilisateurService.modifierProfil(this.user).subscribe(() => {
      alert('Profil modifié avec succès');
      this.router.navigate(['/profil']);
    }, err => {
      alert(err.error.message || 'Erreur lors de la modification');
    });
  }
}
