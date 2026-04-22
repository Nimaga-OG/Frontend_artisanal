import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController, InfiniteScrollCustomEvent, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';

// Services
import { AdminService } from 'src/app/services/admin.service';
import { ProduitService } from 'src/app/services/produit.service';

// Chart.js
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
  animations: [
    // Animation des cartes
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    
    // Animation des compteurs
    trigger('countAnimation', [
      transition(':increment', [
        animate('0.5s ease-out', keyframes([
          style({ transform: 'scale(1.2)', offset: 0.3 }),
          style({ transform: 'scale(1)', offset: 1.0 })
        ]))
      ])
    ]),
    
    // Animation des barres de progression
    trigger('progressAnimation', [
      transition(':enter', [
        style({ width: '0%' }),
        animate('1s ease-out', style({ width: '*' }))
      ])
    ]),
    
    // Animation slide in
    trigger('slideInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    
    // Animation fade in
    trigger('fadeInAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.8s ease-out', style({ opacity: 1 }))
      ])
    ]),
    
    // Animation stagger pour les listes
    trigger('staggerAnimation', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger('100ms', [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    
    // Animation des alertes
    trigger('alertAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class AdminPage implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  
  // Références aux canvas des graphiques
  @ViewChild('salesChartCanvas') salesChartCanvas!: ElementRef;
  @ViewChild('ordersChartCanvas') ordersChartCanvas!: ElementRef;
  @ViewChild('categoriesChartCanvas') categoriesChartCanvas!: ElementRef;
  @ViewChild('performanceChartCanvas') performanceChartCanvas!: ElementRef;

  // Instances des graphiques
  private salesChart!: Chart;
  private ordersChart!: Chart;
  private categoriesChart!: Chart;
  private performanceChart!: Chart;

  // Données pour les graphiques
  chartPeriod = '30j';
  chartData: any = {};

  // Nouvelles données pour le dashboard
  produitsPopulaires: any[] = [];
  activitesRecentes: any[] = [];
  alertesImportantes: any[] = [];
  alertesNonLues = 0;
  indicateursKPI: any[] = [];
  statutsCommandes = [
    { label: 'En attente', value: 'en_attente' },
    { label: 'Payé', value: 'paye' },
    { label: 'Livré', value: 'livre' },
    { label: 'Annulé', value: 'annule' }
  ];

  // Variables existantes
  currentSection = 'dashboard';
  stats: any = {};
  produits: any[] = [];
  ventes: any[] = [];
  utilisateurs: any[] = [];
  categories: any[] = [];
  filteredProduits: any[] = [];
  filteredVentes: any[] = [];
  filteredUtilisateurs: any[] = [];
  filteredCategories: any[] = [];

  isLoading = true;
  searchTerm = '';
  
  // Pagination
  currentPage = {
    produits: 1,
    ventes: 1,
    utilisateurs: 1,
    categories: 1
  };
  hasMoreData = {
    produits: true,
    ventes: true,
    utilisateurs: true,
    categories: true
  };

  // Filtres
  filters = {
    produits: {},
    ventes: {},
    utilisateurs: {}
  };

  constructor(
    private adminService: AdminService,
    private produitService: ProduitService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    // Vérifier les droits d'administration
    try {
      const hasAccess = await this.adminService.checkAdminAccess().toPromise();
      if (!hasAccess) {
        this.presentToast('Accès administrateur requis', 'danger');
        this.router.navigate(['/']);
        return;
      }
      await this.loadDashboardData();
    } catch (error) {
      this.presentToast('Erreur de vérification des droits administrateur', 'danger');
      this.router.navigate(['/']);
    }
  }

  async ngAfterViewInit() {
    // Initialiser les graphiques après le chargement des données
    setTimeout(() => {
      if (this.currentSection === 'dashboard') {
        this.initializeCharts();
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Détruire les graphiques
    if (this.salesChart) this.salesChart.destroy();
    if (this.ordersChart) this.ordersChart.destroy();
    if (this.categoriesChart) this.categoriesChart.destroy();
    if (this.performanceChart) this.performanceChart.destroy();
  }

  async loadDashboardData() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Chargement du dashboard...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Essayer d'abord de charger les données du dashboard en une seule requête
      try {
        const dashboardData = await this.adminService.getDashboardData()
          .pipe(takeUntil(this.destroy$))
          .toPromise();
        
        if (dashboardData) {
          this.stats = dashboardData.stats || {};
          
          // Produits récents
          if (dashboardData.recentProducts?.length) {
            this.produits = dashboardData.recentProducts.map((p: any) => ({
              ...p,
              imageUrl: this.produitService.formatImageUrl(p.image || p.imageUrl),
              stock: p.stock || 0
            }));
          } else {
            await this.loadProduitsRecents();
          }

          // Commandes récentes
          if (dashboardData.recentOrders?.length) {
            this.ventes = dashboardData.recentOrders;
          } else {
            await this.loadVentesRecentes();
          }

          // Utilisateurs récents
          if (dashboardData.recentUsers?.length) {
            this.utilisateurs = dashboardData.recentUsers;
          } else {
            await this.loadUtilisateursRecents();
          }

          await this.loadCategories();
          this.calculateStats();
          
          // Initialiser les tableaux filtrés
          this.filteredProduits = [...this.produits];
          this.filteredVentes = [...this.ventes];
          this.filteredUtilisateurs = [...this.utilisateurs];
          this.filteredCategories = [...this.categories];
          
          // Charger les données supplémentaires pour le dashboard amélioré
          await this.loadDashboardAdditionalData();
          
          this.isLoading = false;
          loading.dismiss();
          return;
        }
      } catch (dashboardError) {
        console.warn('Endpoint dashboard non disponible, chargement séparé...', dashboardError);
      }
      
      // Fallback: charger les données séparément
      await Promise.all([
        this.loadProduitsRecents(),
        this.loadVentesRecentes(),
        this.loadUtilisateursRecents(),
        this.loadCategories(),
        this.loadStats()
      ]);
      
      // Charger les données supplémentaires
      await this.loadDashboardAdditionalData();
      
      this.isLoading = false;
    } catch (error) {
      console.error('Erreur chargement dashboard admin', error);
      this.presentToast('Erreur lors du chargement des données', 'danger');
      this.isLoading = false;
    } finally {
      loading.dismiss();
    }
  }

  // Nouvelles méthodes pour le dashboard amélioré
  async loadDashboardAdditionalData() {
    try {
      // Charger les produits populaires
      this.produitsPopulaires = await this.adminService.getProduitsPopulaires()
        .pipe(takeUntil(this.destroy$))
        .toPromise() || [];

      // Charger les activités récentes
      this.activitesRecentes = await this.adminService.getActivitesRecentes()
        .pipe(takeUntil(this.destroy$))
        .toPromise() || [];

      // Charger les alertes
      this.alertesImportantes = await this.adminService.getAlertes()
        .pipe(takeUntil(this.destroy$))
        .toPromise() || [];
      this.alertesNonLues = this.alertesImportantes.filter(a => !a.lue).length;

      // Initialiser les KPI
      this.initializeKPI();

      // Initialiser les graphiques si on est sur le dashboard
      if (this.currentSection === 'dashboard') {
        setTimeout(() => this.initializeCharts(), 500);
      }
    } catch (error) {
      console.error('Erreur chargement données supplémentaires dashboard', error);
    }
  }

  initializeKPI() {
    this.indicateursKPI = [
      {
        icon: 'trending-up',
        label: 'Taux de Conversion',
        valeur: '12.5%',
        tendance: 5.2
      },
      {
        icon: 'time',
        label: 'Temps Moyen de Réponse',
        valeur: '2.3h',
        tendance: -8.1
      },
      {
        icon: 'star',
        label: 'Satisfaction Client',
        valeur: '4.7/5',
        tendance: 2.3
      },
      {
        icon: 'cart',
        label: 'Panier Moyen',
        valeur: '45,200 FCFA',
        tendance: 12.7
      }
    ];
  }

  initializeCharts() {
    if (this.currentSection !== 'dashboard') return;

    try {
      if (this.salesChartCanvas?.nativeElement) this.initializeSalesChart();
      if (this.ordersChartCanvas?.nativeElement) this.initializeOrdersChart();
      if (this.categoriesChartCanvas?.nativeElement) this.initializeCategoriesChart();
      if (this.performanceChartCanvas?.nativeElement) this.initializePerformanceChart();
    } catch (error) {
      console.error('Erreur initialisation graphiques', error);
    }
  }

  initializeSalesChart() {
    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    
    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.generateDateLabels(),
        datasets: [
          {
            label: 'Ventes',
            data: this.generateSalesData(),
            borderColor: '#8B4513',
            backgroundColor: 'rgba(139, 69, 19, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Objectif',
            data: this.generateTargetData(),
            borderColor: '#E67E22',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  initializeOrdersChart() {
    const ctx = this.ordersChartCanvas.nativeElement.getContext('2d');
    const statusData = this.statutsCommandes.map(statut => 
      this.compterVentesParStatut(statut.value)
    );

    this.ordersChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.statutsCommandes.map(s => s.label),
        datasets: [{
          data: statusData,
          backgroundColor: [
            '#FF6384', // en_attente
            '#36A2EB', // paye
            '#4BC0C0', // livre
            '#FFCE56'  // annule
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        cutout: '60%'
      }
    });
  }

  initializeCategoriesChart() {
    const ctx = this.categoriesChartCanvas.nativeElement.getContext('2d');
    
    this.categoriesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.categories.map(c => c.nom),
        datasets: [{
          label: 'Produits par catégorie',
          data: this.categories.map(c => c.nombreProduits || 0),
          backgroundColor: '#E67E22',
          borderColor: '#8B4513',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  initializePerformanceChart() {
    const ctx = this.performanceChartCanvas.nativeElement.getContext('2d');
    
    this.performanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Objectif', 'Réalisé'],
        datasets: [{
          data: [
            this.stats.objectifMensuel || 0,
            this.stats.caMois || 0
          ],
          backgroundColor: [
            'rgba(139, 69, 19, 0.3)',
            this.getAchievementRate() >= 100 ? 'rgba(46, 139, 87, 0.7)' : 'rgba(230, 126, 34, 0.7)'
          ],
          borderColor: [
            '#8B4513',
            this.getAchievementRate() >= 100 ? '#2E8B57' : '#E67E22'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Méthodes utilitaires pour les graphiques
  generateDateLabels(): string[] {
    const days = this.chartPeriod === '30j' ? 30 : this.chartPeriod === '90j' ? 90 : 12;
    const labels = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      if (this.chartPeriod === '1an') {
        labels.push(date.toLocaleDateString('fr-FR', { month: 'short' }));
      } else {
        labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
      }
    }
    
    return labels;
  }

  generateSalesData(): number[] {
    const days = this.chartPeriod === '30j' ? 30 : this.chartPeriod === '90j' ? 90 : 12;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      // Données simulées - à remplacer par des données réelles
      data.push(Math.floor(Math.random() * 100) + 50);
    }
    
    return data;
  }

  generateTargetData(): number[] {
    const days = this.chartPeriod === '30j' ? 30 : this.chartPeriod === '90j' ? 90 : 12;
    const baseTarget = 80;
    
    return Array(days).fill(baseTarget);
  }

  // Méthodes pour les calculs et indicateurs
  getStockPercentage(): number {
    const total = this.stats.totalProduits || 1;
    const enStock = this.stats.produitsEnStock || 0;
    return (enStock / total) * 100;
  }

  getRupturePercentage(): number {
    const total = this.stats.totalProduits || 1;
    const rupture = this.stats.produitsRupture || 0;
    return (rupture / total) * 100;
  }

  getSalesTrend(): number {
    // Simulation de tendance - à remplacer par calcul réel
    return Math.floor(Math.random() * 41) - 20; // -20% à +20%
  }

  getRevenueGrowth(): number {
    const caMois = this.stats.caMois || 0;
    const caMoisPrecedent = this.stats.caMoisPrecedent || 1;
    return Math.round(((caMois - caMoisPrecedent) / caMoisPrecedent) * 100);
  }

  getAchievementRate(): number {
    const objectif = this.stats.objectifMensuel || 1;
    const realise = this.stats.caMois || 0;
    return Math.round((realise / objectif) * 100);
  }

  getStatusColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'en_attente': '#FF6384',
      'paye': '#36A2EB',
      'livre': '#4BC0C0',
      'annule': '#FFCE56'
    };
    return colors[statut] || '#999';
  }

  // Méthodes pour les activités et alertes
  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'vente': 'cart',
      'utilisateur': 'person',
      'produit': 'cube',
      'systeme': 'cog'
    };
    return icons[type] || 'notifications';
  }

  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'vente': 'success',
      'utilisateur': 'primary',
      'produit': 'warning',
      'systeme': 'medium'
    };
    return colors[type] || 'medium';
  }

  getAlertIcon(niveau: string): string {
    const icons: { [key: string]: string } = {
      'high': 'warning',
      'medium': 'alert-circle',
      'low': 'information-circle'
    };
    return icons[niveau] || 'notifications';
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR');
  }

  // Gestion des périodes des graphiques
  changeChartPeriod(period: string) {
    this.chartPeriod = period;
    
    // Mettre à jour les données des graphiques
    if (this.salesChart) {
      this.salesChart.data.labels = this.generateDateLabels();
      this.salesChart.data.datasets[0].data = this.generateSalesData();
      this.salesChart.update();
    }
  }

  // Méthode pour résoudre les alertes
  async resoudreAlerte(alerte: any) {
    this.alertesImportantes = this.alertesImportantes.filter(a => a.id !== alerte.id);
    this.alertesNonLues = Math.max(0, this.alertesNonLues - 1);
    this.presentToast('Alerte résolue', 'success');
  }

  // Mise à jour de la méthode changerSection pour gérer les graphiques
  async changerSection(section: string) {
    this.currentSection = section;
    this.searchTerm = ''; // Réinitialiser la recherche
    
    // Recharger les données spécifiques à la section si nécessaire
    if (section === 'produits' && this.produits.length === 0) {
      await this.loadProduitsRecents();
    } else if (section === 'ventes' && this.ventes.length === 0) {
      await this.loadVentesRecentes();
    } else if (section === 'utilisateurs' && this.utilisateurs.length === 0) {
      await this.loadUtilisateursRecents();
    } else if (section === 'categories' && this.categories.length === 0) {
      await this.loadCategories();
    } else if (section === 'dashboard') {
      // Réinitialiser les graphiques quand on revient sur le dashboard
      setTimeout(() => this.initializeCharts(), 300);
    }
  }

  // Méthodes existantes (conservées de votre version originale)
  async loadProduitsRecents() {
    try {
      this.produits =
        (await this.adminService
          .getRecentProduits(10)
          .pipe(takeUntil(this.destroy$))
          .toPromise()) || [];
      this.filteredProduits = [...this.produits];
    } catch (error) {
      console.error('Erreur chargement produits récents', error);
      this.produits = [];
      this.filteredProduits = [];
    }
  }

  async loadVentesRecentes() {
    try {
      this.ventes =
        (await this.adminService
          .getRecentVentes(10)
          .pipe(takeUntil(this.destroy$))
          .toPromise()) || [];
      this.filteredVentes = [...this.ventes];
    } catch (error) {
      console.error('Erreur chargement ventes récentes', error);
      this.ventes = [];
      this.filteredVentes = [];
    }
  }

  async loadUtilisateursRecents() {
    try {
      this.utilisateurs =
        (await this.adminService
          .getRecentUtilisateurs(10)
          .pipe(takeUntil(this.destroy$))
          .toPromise()) || [];
      this.filteredUtilisateurs = [...this.utilisateurs];
    } catch (error) {
      console.error('Erreur chargement utilisateurs récents', error);
      this.utilisateurs = [];
      this.filteredUtilisateurs = [];
    }
  }

  async loadStats() {
    try {
      this.stats = await this.adminService.getStats()
        .pipe(takeUntil(this.destroy$))
        .toPromise() || {};
    } catch (error) {
      console.error('Erreur chargement stats', error);
      this.stats = {};
    }
  }

  async loadCategories() {
    try {
      this.categories = await this.adminService.getCategories()
        .pipe(takeUntil(this.destroy$))
        .toPromise() || [];
      this.filteredCategories = [...this.categories];
    } catch (error) {
      console.error('Erreur chargement catégories', error);
      this.categories = [];
      this.filteredCategories = [];
    }
  }

  // Méthode de recherche universelle
  onSearchChange(event: any) {
    this.searchTerm = event?.detail?.value?.toLowerCase() || '';
    
    this.filteredProduits = this.produits.filter(p =>
      p.nom?.toLowerCase().includes(this.searchTerm) ||
      p.description?.toLowerCase().includes(this.searchTerm)
    );
    
    this.filteredVentes = this.ventes.filter(v =>
      v._id?.toLowerCase().includes(this.searchTerm) ||
      v.statut?.toLowerCase().includes(this.searchTerm) ||
      (v.utilisateur?.nom_utilisateur || '').toLowerCase().includes(this.searchTerm)
    );
    
    this.filteredUtilisateurs = this.utilisateurs.filter(u =>
      u.nom_utilisateur?.toLowerCase().includes(this.searchTerm) ||
      u.email?.toLowerCase().includes(this.searchTerm)
    );
    
    this.filteredCategories = this.categories.filter(c =>
      c.nom?.toLowerCase().includes(this.searchTerm)
    );
  }

  async loadProduits(page: number = 1, append: boolean = false) {
    try {
      const response = await this.adminService.getProduits(page, 20, this.filters.produits)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (response) {
        const produitsAvecImages = (response.produits || response).map((p: any) => ({
          ...p,
          imageUrl: this.produitService.formatImageUrl(p.image || p.imageUrl),
          stock: p.stock || 0
        }));

        if (append) {
          this.produits = [...this.produits, ...produitsAvecImages];
        } else {
          this.produits = produitsAvecImages;
        }

        this.filteredProduits = [...this.produits];
        this.hasMoreData.produits = response.totalPages > page;
        this.currentPage.produits = page;
      }
    } catch (error) {
      console.error('Erreur chargement produits', error);
      if (!append) {
        this.produits = [];
        this.filteredProduits = [];
      }
      throw error;
    }
  }

  async loadVentes(page: number = 1, append: boolean = false) {
    try {
      const response = await this.adminService.getCommandes(page, 20, this.filters.ventes)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (response) {
        const ventesData = response.commandes || response;
        if (append) {
          this.ventes = [...this.ventes, ...ventesData];
        } else {
          this.ventes = ventesData;
        }
        
        this.filteredVentes = [...this.ventes];
        this.hasMoreData.ventes = response.totalPages > page;
        this.currentPage.ventes = page;
      }
    } catch (error) {
      console.error('Erreur chargement ventes', error);
      if (!append) {
        this.ventes = [];
        this.filteredVentes = [];
      }
      throw error;
    }
  }

  async loadUtilisateurs(page: number = 1, append: boolean = false) {
    try {
      const response = await this.adminService.getUtilisateurs(page, 20, this.filters.utilisateurs)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (response && response.utilisateurs) {
        const usersData = response.utilisateurs;
        if (append) {
          this.utilisateurs = [...this.utilisateurs, ...usersData];
        } else {
          this.utilisateurs = usersData;
        }
        
        this.filteredUtilisateurs = [...this.utilisateurs];
        this.hasMoreData.utilisateurs = response.totalPages > page;
        this.currentPage.utilisateurs = page;
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs', error);
      if (!append) {
        this.utilisateurs = [];
        this.filteredUtilisateurs = [];
      }
      throw error;
    }
  }

  calculateStats() {
    this.stats = {
      totalProduits: this.produits.length,
      totalVentes: this.ventes.length,
      totalUtilisateurs: this.utilisateurs.length,
      totalCategories: this.categories.length,
      chiffreAffaires: this.ventes.reduce((sum, v) => sum + (v.total || 0), 0),
      produitsEnStock: this.produits.filter(p => (p.stock || 0) > 0).length,
      produitsRupture: this.produits.filter(p => (p.stock || 0) === 0).length,
      ventesMois: this.getVentesThisMonth(),
      caMois: this.getChiffreAffairesMois(),
      objectifMensuel: 1000000, // Exemple d'objectif
      caMoisPrecedent: 750000, // Exemple de CA du mois précédent
      commandesEnAttente: this.compterVentesParStatut('en_attente'),
      utilisateursAdmin: this.utilisateurs.filter(u => u.role === 'admin').length,
      utilisateursVendeur: this.utilisateurs.filter(u => u.role === 'vendeur').length,
      utilisateursClient: this.utilisateurs.filter(u => u.role === 'client').length
    };
  }

  async supprimerProduit(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer définitivement ce produit ?',
      buttons: [
        { text: 'Annuler', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Supprimer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Suppression en cours...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              await this.adminService.deleteProduit(id).toPromise();
              this.produits = this.produits.filter(p => p._id !== id);
              this.filteredProduits = this.filteredProduits.filter(p => p._id !== id);
              this.calculateStats();
              this.presentToast('Produit supprimé avec succès', 'success');
            } catch (error) {
              this.presentToast('Erreur lors de la suppression du produit', 'danger');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async modifierStatutVente(vente: any, nouveauStatut: string) {
    const alert = await this.alertCtrl.create({
      header: 'Changer le statut',
      message: `Changer le statut de la commande #${vente._id?.slice(-6) || 'N/A'} en "${nouveauStatut}" ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Mise à jour en cours...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              await this.adminService.updateCommandeStatut(vente._id, nouveauStatut).toPromise();
              vente.statut = nouveauStatut;
              this.presentToast('Statut de commande mis à jour avec succès', 'success');
            } catch (error) {
              this.presentToast('Erreur lors de la mise à jour du statut', 'danger');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async modifierStatutUtilisateur(utilisateur: any, actif: boolean) {
    const alert = await this.alertCtrl.create({
      header: 'Modifier le statut',
      message: `${actif ? 'Activer' : 'Désactiver'} le compte de ${utilisateur.email} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Mise à jour en cours...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              await this.adminService.updateUtilisateurStatut(utilisateur._id, actif).toPromise();
              utilisateur.actif = actif;
              this.presentToast('Statut utilisateur mis à jour avec succès', 'success');
            } catch (error) {
              this.presentToast('Erreur lors de la mise à jour du statut', 'danger');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Gestion du scroll infini
  async onInfiniteScroll(event: any, section: string) {
    try {
      const nextPage = this.currentPage[section as keyof typeof this.currentPage] + 1;
      
      switch (section) {
        case 'produits':
          if (this.hasMoreData.produits) {
            await this.loadProduits(nextPage, true);
          }
          break;
        case 'ventes':
          if (this.hasMoreData.ventes) {
            await this.loadVentes(nextPage, true);
          }
          break;
        case 'utilisateurs':
          if (this.hasMoreData.utilisateurs) {
            await this.loadUtilisateurs(nextPage, true);
          }
          break;
      }

      (event as InfiniteScrollCustomEvent).target.complete();
      
      // Désactiver le scroll infini si plus de données
      if (!this.hasMoreData[section as keyof typeof this.hasMoreData]) {
        (event as InfiniteScrollCustomEvent).target.disabled = true;
      }
    } catch (error) {
      (event as InfiniteScrollCustomEvent).target.complete();
      console.error(`Erreur lors du chargement supplémentaire pour ${section}:`, error);
    }
  }

  // Export des données
  async exporterDonnees() {
    const alert = await this.alertCtrl.create({
      header: 'Exporter les données',
      message: 'Choisissez le format d\'export',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'CSV', handler: () => this.genererExport('csv') },
        { text: 'PDF', handler: () => this.genererExport('pdf') }
      ]
    });
    await alert.present();
  }

  async genererExport(format: 'csv' | 'pdf') {
    const loading = await this.loadingCtrl.create({
      message: `Génération du ${format.toUpperCase()}...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const aujourdHui = new Date().toISOString().split('T')[0];
      const ilY30Jours = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const blob = await this.adminService.genererRapportVentes(ilY30Jours, aujourdHui, format).toPromise();
      
      if (blob) {
        this.downloadBlob(blob, `rapport-ventes-${aujourdHui}.${format}`);
        this.presentToast(`Rapport ${format} généré avec succès`, 'success');
      }
    } catch (error) {
      this.presentToast('Erreur lors de la génération du rapport', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  // Nombre de ventes du mois en cours
  getVentesThisMonth(): number {
    const now = new Date();
    return this.ventes.filter(v => {
      const date = new Date(v.createdAt);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }

  // Chiffre d'affaires du mois en cours
  getChiffreAffairesMois(): number {
    const now = new Date();
    return this.ventes
      .filter(v => {
        const date = new Date(v.createdAt);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, v) => sum + (v.total || 0), 0);
  }

  // Rafraîchir toutes les données (Pull-to-Refresh)
  async rafraichir(event?: any) {
    try {
      await this.loadDashboardData();
      if (event) event.target.complete();
      this.presentToast('Données rafraîchies', 'success');
    } catch (error) {
      if (event) event.target.complete();
      this.presentToast('Erreur lors du rafraîchissement', 'danger');
    }
  }

  // Compter le nombre de ventes par statut
  compterVentesParStatut(statut: string): number {
    return this.ventes.filter(v => v.statut === statut).length;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getStatutColor(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'en attente': return 'warning';
      case 'validé': return 'success';
      case 'annulé': return 'danger';
      default: return 'medium';
    }
  }

  getRoleColor(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin': return 'danger';
      case 'vendeur': return 'primary';
      case 'client': return 'success';
      default: return 'medium';
    }
  }
}