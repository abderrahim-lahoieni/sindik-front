import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterLinkActive, RouterModule, RouterOutlet} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';

import {AuthService} from '../../core/auth/auth.service';
import {Role} from '../../core/auth/models/auth.model';
import ToastService from '../components/ui/toast/toast.service';

interface MenuItem {
  label: string;
  icon: string;
  link: string;
  roles?: Role[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);


  // État sidebar
  sidebarOpen = signal(true);

  // 🔐 rôle utilisateur courant
   readonly role = this.auth.getRole();
   readonly username =this.auth.getUsername();

  // 📚 menu complet avec rôles autorisés
   readonly menu: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', link: 'dashboard', roles: [Role.A, Role.S,Role.R] },
    { label: 'Résidences', icon: 'home_work', link: 'residences', roles: [Role.A]},
    { label: 'Batiments', icon: 'apartment', link: 'buildings', roles: [Role.A]},
    { label: 'Unités', icon: 'meeting_room', link: 'units', roles: [Role.A,Role.S]},
    { label: 'Residents', icon: 'people', link: 'residents', roles: [Role.A, Role.S]},
    { label: 'Contrats', icon: 'description', link: 'contracts', roles: [Role.S]},
    { label: 'Paiements', icon: 'payment', link: 'payments', roles: [Role.S]},
    { label: 'Paramètres', icon: 'settings', link: 'settings', roles: [Role.A,Role.S] },
  ];

  // 🎯 menu filtré automatiquement selon rôle
  filteredMenu = computed(() =>
    this.menu.filter(item =>
      !item.roles || (this.role && item.roles.includes(this.role))
    )
  );

  currentYear = new Date().getFullYear();

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout(): void {
   this.auth.logout();
   this.toast.success('Logged out');
  }
}
