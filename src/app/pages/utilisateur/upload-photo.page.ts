import { Component } from '@angular/core';
import { UtilisateurService } from 'src/app/services/utilisateur.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-upload-photo',
  templateUrl: './upload-photo.page.html',
  styleUrls: ['./upload-photo.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class UploadPhotoPage {
  selectedFile?: File;

  constructor(
    private utilisateurService: UtilisateurService,
    private router: Router
  ) {}

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (!this.selectedFile) {
      alert('Veuillez choisir une image');
      return;
    }
    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    this.utilisateurService.uploadPhoto(formData).subscribe(
      () => {
        alert('Photo mise à jour avec succès');
        this.router.navigate(['/profil']);
      },
      (err) => {
        alert(err.error.message || "Erreur lors de l'upload");
      }
    );
  }
}
