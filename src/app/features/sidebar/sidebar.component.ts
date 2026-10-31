import {Component, computed, ElementRef, HostListener, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet} from '@angular/router';
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
  keywords?: string[];
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef<HTMLElement>);


  // État sidebar
  sidebarOpen = signal(true);
  searchQuery = signal('');
  searchOpen = signal(false);
  activeSearchIndex = signal(-1);

  // 🔐 rôle utilisateur courant
   readonly role = this.auth.getRole();
   readonly username =this.auth.getUsername();

  // 📚 menu complet avec rôles autorisés
   readonly menu: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', link: 'dashboard', keywords: ['accueil', 'tableau de bord', 'vue générale'], roles: [Role.A, Role.S,Role.R] },
    { label: 'Résidences', icon: 'home_work', link: 'residences', keywords: ['logements', 'copropriété'], roles: [Role.A]},
    { label: 'Bâtiments', icon: 'apartment', link: 'buildings', keywords: ['immeubles', 'blocs'], roles: [Role.A]},
    { label: 'Unités', icon: 'meeting_room', link: 'units', keywords: ['appartements', 'logements'], roles: [Role.S]},
    { label: 'Résidents', icon: 'people', link: 'residents', keywords: ['occupants', 'locataires', 'propriétaires'], roles: [Role.A, Role.S]},
    { label: 'Contrats', icon: 'description', link: 'contracts', keywords: ['baux', 'location'], roles: [Role.S]},
    { label: 'Paiements', icon: 'payment', link: 'payments', keywords: ['loyers', 'règlements', 'factures'], roles: [Role.S]},
    { label: 'Utilisateurs', icon: 'settings', link: 'settings', keywords: ['comptes', 'gestion des utilisateurs'], roles: [Role.A,Role.S] },
  ];

  // 🎯 menu filtré automatiquement selon rôle
  filteredMenu = computed(() =>
    this.menu.filter(item =>
      !item.roles || (this.role && item.roles.includes(this.role))
    )
  );

  searchResults = computed(() => {
    const query = this.normalize(this.searchQuery().trim());
    if (!query) return [];
    return this.filteredMenu()
      .filter(item => [item.label, item.link, ...(item.keywords || [])]
        .some(value => this.normalize(value).includes(query)))
      .slice(0, 6);
  });

  currentYear = new Date().getFullYear();

  get displayUsername(): string {
    const localName = (this.username || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
    return localName
      ? localName.split(' ').map(part => part ? part.charAt(0).toLocaleUpperCase('fr') + part.slice(1) : '').join(' ')
      : 'Mon compte';
  }

  get roleLabel(): string {
    const labels: Record<Role, string> = {
      [Role.A]: 'Administrateur',
      [Role.S]: 'Syndic',
      [Role.R]: 'Résident',
      [Role.F]: 'Gestionnaire financier'
    };
    return this.role ? labels[this.role] || this.role : 'Utilisateur';
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchOpen.set(true);
    this.activeSearchIndex.set(-1);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const results = this.searchResults();
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      this.searchOpen.set(true);
      this.activeSearchIndex.update(index => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      this.searchOpen.set(true);
      this.activeSearchIndex.update(index => index <= 0 ? results.length - 1 : index - 1);
    } else if (event.key === 'Enter' && results.length) {
      event.preventDefault();
      const index = this.activeSearchIndex() < 0 ? 0 : this.activeSearchIndex();
      this.navigateTo(results[index]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSearch();
    }
  }

  navigateTo(item: MenuItem): void {
    this.router.navigate([item.link], { relativeTo: this.route });
    this.closeSearch();
  }

  clearSearch(input: HTMLInputElement): void {
    this.searchQuery.set('');
    this.activeSearchIndex.set(-1);
    this.searchOpen.set(false);
    input.focus();
  }

  @HostListener('document:click', ['$event'])
  closeSearchWhenClickingOutside(event: MouseEvent): void {
    const searchContainer = this.elementRef.nativeElement.querySelector('.search-container');
    if (!searchContainer?.contains(event.target as Node)) this.searchOpen.set(false);
  }

  private closeSearch(): void {
    this.searchQuery.set('');
    this.searchOpen.set(false);
    this.activeSearchIndex.set(-1);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  }

  logout(): void {
   this.auth.logout();
   this.toast.success('Logged out');
  }
}
