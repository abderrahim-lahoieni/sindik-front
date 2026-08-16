// src/app/features/syndic/dashboard/syndic-dashboard.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SyndicBuildingService, SyndicBuilding } from '../access-data/syndic-building.service';
import { UnitService } from '../../admin/units/access-data/unit.service';
import { ResidentService } from '../../admin/residents/access-data/resident.service';
import {AuthService} from '../../../core/auth/auth.service';
import {ButtonComponent} from '../../components/ui/buttons/button.component';
import ToastService from '../../components/ui/toast/toast.service';

interface BuildingStats {
  buildingUuid: string;
  buildingName: string;
  residenceName: string;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  totalResidents: number;
  owners: number;
}

@Component({
  selector: 'app-syndic-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './syndic-dashboard.component.html',
  styleUrls: ['./syndic-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyndicDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly unitService = inject(UnitService);
  private readonly residentService = inject(ResidentService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  syndicBuildings = signal<SyndicBuilding[]>([]);
  buildingsStats = signal<BuildingStats[]>([]);

  // Stats globales
  totalBuildings = signal(0);
  totalUnits = signal(0);
  totalResidents = signal(0);
  occupancyRate = signal(0);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    const currentUserUuid = this.auth.getUsernameUUid();

    if (!currentUserUuid) {
      this.toast.error('Utilisateur non connecté');
      this.loading.set(false);
      return;
    }

    // Charger les bâtiments du syndic
    this.syndicBuildingService.getBuildingsBySyndic(currentUserUuid).subscribe({
      next: (buildings) => {
        this.syndicBuildings.set(buildings);
        this.totalBuildings.set(buildings.length);

        if (buildings.length === 0) {
          this.loading.set(false);
          return;
        }

        // Charger les stats pour chaque bâtiment
        this.loadBuildingsStats(buildings);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement du dashboard');
        this.loading.set(false);
      }
    });
  }

  private loadBuildingsStats(buildings: SyndicBuilding[]): void {
    const statsRequests = buildings.map(building => {
      return forkJoin({
        buildingUuid: [building.buildingUuid],
        buildingName: [building.buildingName],
        residenceName: [building.residenceName],
        units: this.unitService.getUnits({ buildingUuid: building.buildingUuid }),
        residents: this.residentService.getResidents({ buildingUuid: building.buildingUuid })
      });
    });

    forkJoin(statsRequests).subscribe({
      next: (results) => {
        const stats: BuildingStats[] = results.map(result => {
          const units = result.units;
          const residents = result.residents;

          return {
            buildingUuid: result.buildingUuid,
            buildingName: result.buildingName,
            residenceName: result.residenceName[0],
            totalUnits: units.length,
            occupiedUnits: units.filter(u => u.isOccupied).length,
            availableUnits: units.filter(u => !u.isOccupied).length,
            totalResidents: residents.length,
            owners: residents.filter(r => r.isOwner).length
          };
        });

        this.buildingsStats.set(stats);
        this.calculateGlobalStats(stats);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des statistiques');
        this.loading.set(false);
      }
    });
  }

  private calculateGlobalStats(stats: BuildingStats[]): void {
    const totalUnits = stats.reduce((sum, s) => sum + s.totalUnits, 0);
    const totalOccupied = stats.reduce((sum, s) => sum + s.occupiedUnits, 0);
    const totalResidents = stats.reduce((sum, s) => sum + s.totalResidents, 0);

    this.totalUnits.set(totalUnits);
    this.totalResidents.set(totalResidents);
    this.occupancyRate.set(totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0);
  }

  navigateToBuilding(buildingUuid: string): void {
    this.router.navigate(['/syndic/buildings', buildingUuid]);
  }

  navigateToUnits(buildingUuid: string): void {
    this.router.navigate(['/syndik/units'], {
      queryParams: { buildingUuid }
    });
  }

  navigateToResidents(buildingUuid: string): void {
    this.router.navigate(['/syndik/residents'], {
      queryParams: { buildingUuid }
    });
  }

  viewAllUnits(): void {
    this.router.navigate(['/syndik/units']);
  }

  viewAllResidents(): void {
    this.router.navigate(['/syndik/residents']);
  }

  protected readonly Math = Math;
}
