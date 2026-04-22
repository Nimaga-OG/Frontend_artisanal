import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation-commande.page.html',
  styleUrls: ['./confirmation-commande.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ConfirmationPage implements OnInit {
  success = false;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.success = params['success'] === 'true';
      if (this.success) {
        setTimeout(() => {
          this.router.navigate(['/produits']); // Redirection automatique
        }, 4000); // ⏳ Redirige après 4 secondes
      }
    });
  }
}
