// src/app/features/admin/dashboard/admin-dashboard.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, ViewChild, type ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { BuildingService } from '../buildings/access-data/building.service';
import { UnitService } from '../units/access-data/unit.service';
import { ResidentService } from '../residents/access-data/resident.service';
import { UserService } from '../users/access-data/user.service';
import { ButtonComponent } from '../../components/ui/buttons/button.component';
import { ResidenceService } from '../residences/ access-data/residence.service';
import ToastService from '../../components/ui/toast/toast.service';
import { Chart, registerables } from 'chart.js';
import { CreateResidenceModalComponent } from '../residences/modals/create-residence.component';
import type { Residence } from '../residences/ access-data/residence.model';
import { MatDialog } from '@angular/material/dialog';
import { CreateBuildingModalComponent } from '../buildings/modals/create-building.component';
import { CreateUnitModalComponent } from '../units/modals/create-unit.component';
import { CreateUserModalComponent } from '../users/modals/create-user.component';
import { Role } from '../../../core/auth/models/auth.model';



interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  action?: () => void;
  color: string;
  gradient: string;
}

interface RecentActivity {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'danger';
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ButtonComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
Math: any;
  static {
    Chart.register(...registerables);
  }
  private readonly residenceService = inject(ResidenceService);
  private readonly buildingService = inject(BuildingService);
  private readonly unitService = inject(UnitService);
  private readonly residentService = inject(ResidentService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(MatDialog);
  loading = signal(true);
  
  // Stats principales
  totalResidences = signal(0);
  totalBuildings = signal(0);
  totalUnits = signal(0);
  totalResidents = signal(0);
  totalUsers = signal(0);
  occupancyRate = signal(0);
  availableUnits = signal(0);
  ownersCount = signal(0);

  // Graphiques
  unitsByType = signal<ChartData[]>([]);
  residentsByType = signal<ChartData[]>([]);
  buildingsByResidence = signal<ChartData[]>([]);

  // Actions rapides
  quickActions: QuickAction[] = [
    {
      title: 'Nouvelle Résidence',
      description: 'Créer une nouvelle résidence',
      icon: 'apartment',
      action: () => this.openCreateModal(),
      route: '/admin/residences',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Nouveau Bâtiment',
      description: 'Ajouter un bâtiment',
      icon: 'domain',
      action: () => this.openCreateBuildingModal(), // 🔥 ici on appelle la fonction
      route: '/admin/buildings',
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Nouvelle Unité',
      description: 'Créer une unité',
      icon: 'meeting_room',
      action: () => this.openCreateUnitModal(), // 🔥 ici on appelle la fonction
      route: '/admin/units',
      color: '#4facfe',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Nouvel Utilisateur',
      description: 'Créer un utilisateur',
      action: () => this.openCreateUserModal(), // 🔥 ici on appelle la fonction
      icon: 'group_add',
      route: '/admin/users',
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Gérer Syndics',
      description: 'Assigner des bâtiments',
      icon: 'business',
      action: () => this.router.navigate(['/admin/settings'], {
       queryParams: { role: Role.S }
        }),
      route: '/admin/settings',
      color: '#30cfd0',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    }
  ];

  // Activités récentes (simulées)
  recentActivities = signal<RecentActivity[]>([
    {
      icon: 'apartment',
      title: 'Nouvelle résidence créée',
      description: 'Résidence "Les Jardins" ajoutée avec succès',
      time: 'Il y a 2 heures',
      type: 'success'
    },
    {
      icon: 'person',
      title: 'Nouveau résident ajouté',
      description: 'Ahmed Alami assigné à l\'unité A101',
      time: 'Il y a 5 heures',
      type: 'info'
    },
    {
      icon: 'warning',
      title: 'Bâtiment nécessite attention',
      description: 'Bâtiment B a 3 unités vacantes',
      time: 'Il y a 1 jour',
      type: 'warning'
    },
    {
      icon: 'check_circle',
      title: 'Syndic assigné',
      description: 'Mohamed Benali assigné à 2 bâtiments',
      time: 'Il y a 2 jours',
      type: 'success'
    }
  ]);


handleQuickAction(action: QuickAction): void {
  if (action.action) {
    action.action(); // 🔥 exécute la fonction
  } else if (action.route) {
    this.router.navigate([action.route]);
  }
}
openCreateModal(): void {
  this.modal.open(CreateResidenceModalComponent, {
    width: '700px',
    data: { mode: 'create' }
  }).afterClosed().subscribe((result: Residence) => {
    if (result) {
      this.router.navigate(['/admin/residences']);
      this.toast.success('Résidence créée avec succès');
    }
  });
}
openCreateBuildingModal(): void {
  this.modal.open(CreateBuildingModalComponent, {
    width: '700px',
    data: { mode: 'create' }
  }).afterClosed().subscribe((result: Residence) => {
    if (result) {
      this.router.navigate(['/admin/buildings']);
      this.toast.success('Bâtiment créé avec succès');
    }
  });
}
openCreateUnitModal(): void {
  this.modal.open(CreateUnitModalComponent, {
    width: '700px',
    data: { mode: 'create' }
  }).afterClosed().subscribe((result: Residence) => {
    if (result) {
      this.router.navigate(['/admin/units']);
      this.toast.success('Unité créée avec succès');
    }
  });
}
openCreateUserModal(): void {
  this.modal.open(CreateUserModalComponent, {
    width: '700px',
    data: { mode: 'create' }
  }).afterClosed().subscribe((result: Residence) => {
    if (result) {
      this.router.navigate(['/admin/settings']);
      this.toast.success('Utilisateur créé avec succès');
    }
  });
}
  // Statistiques calculées
  occupancyPercentage = computed(() => {
    const total = this.totalUnits();
    const occupied = total - this.availableUnits();
    return total > 0 ? Math.round((occupied / total) * 100) : 0;
  });

ownersPercentage = computed(() => {
  const total = this.totalResidents();
  const owners = this.ownersCount();
  return total > 0 ? Math.round((owners / total) * 100) : 0;
});

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    forkJoin({
      residences: this.residenceService.getResidences(),
      buildings: this.buildingService.getBuildings({}),
      units: this.unitService.getUnits({}),
      residents: this.residentService.getResidents({}),
      users: this.userService.getUsers({})
    }).subscribe({
      next: (data) => {
        // Stats principales
        this.totalResidences.set(data.residences.length);
        this.totalBuildings.set(data.buildings.length);
        this.totalUnits.set(data.units.length);
        this.totalResidents.set(data.residents.length);
        this.totalUsers.set(data.users.length);

        // Unités disponibles
        const available = data.units.filter(u => !u.isOccupied && u.isActive).length;
        this.availableUnits.set(available);

        // Propriétaires
        const owners = data.residents.filter(r => r.isOwner).length;
        this.ownersCount.set(owners);

        // Taux d'occupation
        const occupied = data.units.filter(u => u.isOccupied).length;
        const rate = data.units.length > 0 ? Math.round((occupied / data.units.length) * 100) : 0;
        this.occupancyRate.set(rate);

        // Graphiques
        this.calculateUnitsByType(data.units);
        this.calculateResidentsByType(data.residents);
        this.calculateBuildingsByResidence(data.buildings);

        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement du dashboard');
        this.loading.set(false);
      }
    });
  }

  private calculateUnitsByType(units: any[]): void {
    const types = units.reduce((acc: any, unit) => {
      acc[unit.type] = (acc[unit.type] || 0) + 1;
      return acc;
    }, {});

    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#ffc312'];
    const total = units.length;

    const chartData: ChartData[] = Object.entries(types).map(([key, value]: any, index) => ({
      label: this.getUnitTypeLabel(key),
      value: value,
      color: colors[index % colors.length],
      percentage: Math.round((value / total) * 100)
    }));

    this.unitsByType.set(chartData);
  }

  private calculateResidentsByType(residents: any[]): void {
    const owners = residents.filter(r => r.isOwner).length;
    const tenants = residents.length - owners;
    const total = residents.length;

    this.residentsByType.set([
      {
        label: 'Propriétaires',
        value: owners,
        color: '#43e97b',
        percentage: total > 0 ? Math.round((owners / total) * 100) : 0
      },
      {
        label: 'Locataires',
        value: tenants,
        color: '#4facfe',
        percentage: total > 0 ? Math.round((tenants / total) * 100) : 0
      }
    ]);
  }

  private calculateBuildingsByResidence(buildings: any[]): void {
    const byResidence = buildings.reduce((acc: any, building) => {
      const name = building.residenceName;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
    const total = buildings.length;

    const chartData: ChartData[] = Object.entries(byResidence)
      .map(([key, value]: any, index) => ({
        label: key,
        value: value,
        color: colors[index % colors.length],
        percentage: Math.round((value / total) * 100)
      }))
      .slice(0, 5); // Top 5

    this.buildingsByResidence.set(chartData);
  }

  private getUnitTypeLabel(type: string): string {
    const labels: any = {
      'APARTMENT': 'Appartements',
      'STUDIO': 'Studios',
      'DUPLEX': 'Duplex',
      'PENTHOUSE': 'Penthouses',
      'COMMERCIAL': 'Commerciaux',
      'PARKING': 'Parkings',
      'STORAGE': 'Stockages'
    };
    return labels[type] || type;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

   

  @ViewChild('occupancyChart') occupancyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart') monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;

  private occupancyChart: Chart | null = null;
  private monthlyChart: Chart | null = null;

  // Données pour le graphique mensuel (simulées)
  monthlyData = signal({
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    newResidents: [12, 19, 15, 25, 22, 30, 28, 35, 32, 38, 42, 45],
    newUnits: [8, 12, 10, 15, 18, 20, 22, 25, 28, 30, 35, 38],
    occupancyRate: [65, 68, 70, 72, 75, 78, 80, 82, 83, 85, 87, 89]
  });

  ngAfterViewInit(): void {
    // Attendre que les données soient chargées
    setTimeout(() => {
      this.createOccupancyChart();
      this.createMonthlyChart();
    }, 500);
  }

  ngOnDestroy(): void {
    // Nettoyer les graphiques
    if (this.occupancyChart) {
      this.occupancyChart.destroy();
    }
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
  }

  private createOccupancyChart(): void {
    if (!this.occupancyChartCanvas) return;

    const ctx = this.occupancyChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Données pour le graphique circulaire d'occupation
    const occupied = this.totalUnits() - this.availableUnits();
    const available = this.availableUnits();

    this.occupancyChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Occupées', 'Disponibles'],
        datasets: [{
          data: [occupied, available],
          backgroundColor: [
            'rgba(67, 233, 123, 0.8)',
            'rgba(79, 172, 254, 0.8)'
          ],
          borderColor: [
            'rgba(67, 233, 123, 1)',
            'rgba(79, 172, 254, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: 'Poppins',
                size: 13,
              },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              family: 'Poppins',
              size: 14,
            },
            bodyFont: {
              family: 'Poppins',
              size: 13
            },
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  private createMonthlyChart(): void {
    if (!this.monthlyChartCanvas) return;

    const ctx = this.monthlyChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.monthlyData();

    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Nouveaux Résidents',
            data: data.newResidents,
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 20
          },
          {
            label: 'Nouvelles Unités',
            data: data.newUnits,
            backgroundColor: 'rgba(240, 147, 251, 0.8)',
            borderColor: 'rgba(240, 147, 251, 1)',
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 20
          },
          {
            label: 'Taux d\'Occupation (%)',
            data: data.occupancyRate,
            type: 'line',
            backgroundColor: 'rgba(67, 233, 123, 0.1)',
            borderColor: 'rgba(67, 233, 123, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgba(67, 233, 123, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              font: {
                family: 'Poppins',
                size: 13,
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 10,
              boxHeight: 10
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: 15,
            titleFont: {
              family: 'Poppins',
              size: 14,
            },
            bodyFont: {
              family: 'Poppins',
              size: 13
            },
            bodySpacing: 8,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(context) {
                return `Mois: ${context[0].label}`;
              },
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (context.dataset.yAxisID === 'y1') {
                    label += context.parsed.y + '%';
                  } else {
                    label += context.parsed.y;
                  }
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Poppins',
                size: 12,
              },
              color: '#64748b'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                family: 'Poppins',
                size: 12,
              },
              color: '#64748b',
              precision: 0
            },
            title: {
              display: true,
              text: 'Nombre',
              font: {
                family: 'Poppins',
                size: 13,
              },
              color: '#0f172a'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            max: 100,
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              font: {
                family: 'Poppins',
                size: 12,
              },
              color: '#64748b',
              callback: function(value) {
                return value + '%';
              }
            },
            title: {
              display: true,
              text: 'Taux (%)',
              font: {
                family: 'Poppins',
                size: 13,
              },
              color: '#0f172a'
            }
          }
        }
      }
    });
  }
 refreshDashboard(): void {
  this.loadDashboardData();

  // Attendre que les données soient chargées puis rafraîchir les graphiques
  setTimeout(() => {
    // Refresh Occupancy Chart
    if (this.occupancyChart) {
      const occupied = this.totalUnits() - this.availableUnits();
      const available = this.availableUnits();
      this.occupancyChart.data.datasets[0].data = [occupied, available];
      this.occupancyChart.update();
    }

    // Refresh Monthly Chart
    if (this.monthlyChart) {
      const data = this.monthlyData(); // récupérer les dernières données

      this.monthlyChart.data.labels = data.labels;
      this.monthlyChart.data.datasets[0].data = data.newResidents;
      this.monthlyChart.data.datasets[1].data = data.newUnits;
      this.monthlyChart.data.datasets[2].data = data.occupancyRate;

      this.monthlyChart.update();
    }
  }, 100);

  this.toast.success('Dashboard actualisé');
}
}