import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { timeout } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ResidentHomeSummary, ResidentPortalService } from './resident-portal.service';

@Component({
  selector: 'app-resident-home',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <a class="brand" href="/resident" aria-label="Sindik, accueil résident">
          <img class="brand-mark" src="sindik-mark.svg" alt="">
          <span>Sindik<small>ESPACE RÉSIDENT</small></span>
        </a>

        <div class="nav-label">MENU</div>
        <a class="nav-item active" href="/resident" aria-current="page">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/></svg>
          <span>Vue d’ensemble</span>
        </a>

        <div class="sidebar-bottom">
          <div class="help-card">
            <span class="help-icon">?</span>
            <strong>Besoin d’aide ?</strong>
            <p>Votre syndic est votre interlocuteur pour toute question sur votre logement.</p>
          </div>
          <button class="logout" type="button" (click)="logout()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main class="main-area">
        <header class="topbar">
          <div class="breadcrumb">Espace résident <span>/</span> <strong>Vue d’ensemble</strong></div>
          <div class="account-chip">
            <span class="avatar">{{ initials }}</span>
            <span class="account-name">{{ resident?.fullName || auth.getUsername() || 'Résident' }}</span>
          </div>
        </header>

        <div class="page-content">
          <section class="welcome-row">
            <div>
              <p class="eyebrow">VOTRE ESPACE PERSONNEL</p>
              <h1>Bonjour, {{ firstName }} <mat-icon class="wave" aria-hidden="true">waving_hand</mat-icon></h1>
              <p class="subtitle">Retrouvez en un coup d’œil les informations liées à votre logement.</p>
            </div>
            <button class="refresh-button" type="button" (click)="loadHome()" [disabled]="loading" aria-label="Actualiser les informations">
              <svg [class.spinning]="loading" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/></svg>
              Actualiser
            </button>
          </section>

          <div *ngIf="loading" class="loading-card" aria-live="polite">
            <span class="loader"></span><span>Chargement de votre espace…</span>
          </div>

          <section *ngIf="error && !loading" class="error-card" role="alert">
            <span class="error-mark">!</span>
            <div><strong>Informations indisponibles</strong><p>{{ error }}</p></div>
            <button type="button" (click)="loadHome()">Réessayer</button>
          </section>

          <ng-container *ngIf="resident && !loading">
            <section class="summary-banner">
              <div class="summary-copy">
                <span class="summary-kicker">MON LOGEMENT</span>
                <h2>{{ resident.residenceName || 'Résidence' }}</h2>
                <p>{{ resident.buildingName || 'Bâtiment non renseigné' }} <span class="dot">•</span> Unité {{ resident.unitNumber || '—' }}</p>
              </div>
              <div class="home-illustration" aria-hidden="true">
                <svg viewBox="0 0 160 130"><path class="sun" d="M130 28a13 13 0 1 0 0 26 13 13 0 0 0 0-26Z"/><path class="building-back" d="M18 62h45v56H18z"/><path class="building-main" d="M54 42h75v76H54z"/><path class="roof" d="m45 43 46-31 47 31"/><path class="window" d="M67 56h13v13H67zm33 0h13v13h-13zM67 81h13v13H67zm33 0h13v13h-13z"/><path class="door" d="M88 91h15v27H88z"/><path class="ground" d="M8 119h144"/></svg>
              </div>
            </section>

            <section class="stats-grid" aria-label="Résumé de votre logement">
              <article class="stat-card">
                <div class="stat-icon green"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/></svg></div>
                <div><span class="stat-label">Mon unité</span><strong>{{ resident.unitNumber || '—' }}</strong><small>{{ resident.buildingName || 'Bâtiment non renseigné' }}</small></div>
              </article>
              <article class="stat-card">
                <div class="stat-icon blue"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2m-5 6v-4h4v4"/></svg></div>
                <div><span class="stat-label">Résidence</span><strong>{{ resident.residenceName || '—' }}</strong><small>Votre lieu de résidence</small></div>
              </article>
              <article class="stat-card">
                <div class="stat-icon amber"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                <div><span class="stat-label">Depuis le</span><strong>{{ resident.moveInDate ? (resident.moveInDate | date:'dd MMM yyyy') : 'Non renseigné' }}</strong><small>Date d’entrée dans le logement</small></div>
              </article>
              <article class="stat-card">
                <div class="stat-icon violet"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>
                <div><span class="stat-label">Mon profil</span><strong>{{ resident.isOwner ? 'Propriétaire' : 'Résident' }}</strong><small>{{ resident.isPrimaryResident ? 'Résident principal' : 'Profil résident' }}</small></div>
              </article>
            </section>

            <div class="details-grid">
              <section class="panel">
                <div class="panel-heading"><div><p class="eyebrow">DÉTAILS</p><h2>Mon logement</h2></div><span class="status" [class.inactive]="resident.isActive === false"><i></i>{{ resident.isActive === false ? 'Inactif' : 'Actif' }}</span></div>
                <div class="detail-list">
                  <div class="detail-row"><mat-icon class="detail-icon" aria-hidden="true">location_city</mat-icon><div><small>Résidence</small><strong>{{ resident.residenceName || 'Non renseignée' }}</strong></div></div>
                  <div class="detail-row"><mat-icon class="detail-icon" aria-hidden="true">apartment</mat-icon><div><small>Bâtiment</small><strong>{{ resident.buildingName || 'Non renseigné' }}</strong></div></div>
                  <div class="detail-row"><mat-icon class="detail-icon" aria-hidden="true">home_work</mat-icon><div><small>Numéro d’unité</small><strong>{{ resident.unitNumber || 'Non renseigné' }}</strong></div></div>
                  <div class="detail-row"><mat-icon class="detail-icon" aria-hidden="true">event</mat-icon><div><small>Date d’entrée</small><strong>{{ resident.moveInDate ? (resident.moveInDate | date:'dd MMMM yyyy') : 'Non renseignée' }}</strong></div></div>
                </div>
              </section>

              <section class="panel profile-panel">
                <div class="panel-heading"><div><p class="eyebrow">VOS COORDONNÉES</p><h2>Mon profil</h2></div><span class="profile-avatar">{{ initials }}</span></div>
                <div class="profile-name">{{ resident.fullName }}</div>
                <div class="contact-row"><mat-icon class="contact-icon" aria-hidden="true">mail</mat-icon><div><small>Adresse e-mail</small><strong>{{ auth.getUsername() || 'Non renseignée' }}</strong></div></div>
                <div class="contact-row"><mat-icon class="contact-icon" aria-hidden="true">call</mat-icon><div><small>Téléphone</small><strong>{{ resident.phoneNumber || 'Non renseigné' }}</strong></div></div>
                <p class="profile-note">Pour mettre à jour vos coordonnées, contactez votre syndic.</p>
              </section>
            </div>
            <footer class="footer-note">Sindik <span>•</span> Votre résidence, en toute simplicité</footer>
          </ng-container>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:#182230; font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing:border-box; }
    .dashboard-shell { min-height:100vh; background:#f5f7fa; }
    .sidebar { position:fixed; inset:0 auto 0 0; z-index:2; display:flex; flex-direction:column; width:252px; padding:27px 18px 20px; background:#fff; border-right:1px solid #e8edf2; }
    .brand { display:flex; align-items:center; gap:11px; margin:0 7px 55px; color:#173b35; text-decoration:none; font-size:19px; font-weight:800; letter-spacing:-.5px; }
    .brand-mark { display:block; flex:0 0 auto; width:40px; height:40px; border-radius:12px; }
    .brand small { display:block; margin-top:3px; color:#93a19e; font-size:8px; font-weight:700; letter-spacing:1.45px; }
    .nav-label { padding:0 12px; margin-bottom:10px; color:#a0aab5; font-size:10px; font-weight:700; letter-spacing:1.2px; }
    .nav-item { display:flex; align-items:center; gap:12px; padding:12px; border-radius:9px; color:#65717e; text-decoration:none; font-size:13px; font-weight:600; }
    .nav-item svg,.logout svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
    .nav-item.active { background:#eaf5f1; color:#176b57; }
    .sidebar-bottom { margin-top:auto; }
    .help-card { padding:15px; border:1px solid #e9eef2; border-radius:11px; background:#f9fbfc; }
    .help-icon { display:grid; place-items:center; width:24px; height:24px; margin-bottom:11px; border-radius:50%; background:#e5f1ed; color:#24745f; font-weight:700; }
    .help-card strong { font-size:12px; }
    .help-card p { margin:6px 0 0; color:#7b8793; font-size:11px; line-height:1.55; }
    .logout { display:flex; align-items:center; gap:11px; width:100%; margin-top:14px; padding:12px; border:0; border-top:1px solid #edf0f3; background:transparent; color:#66727f; text-align:left; font-size:13px; cursor:pointer; }
    .logout:hover { color:#b42318; }
    .main-area { min-height:100vh; margin-left:252px; }
    .topbar { position:sticky; top:0; z-index:1; display:flex; align-items:center; justify-content:space-between; height:70px; padding:0 4.5vw; border-bottom:1px solid #e8edf2; background:rgba(255,255,255,.94); backdrop-filter:blur(10px); }
    .breadcrumb { color:#8994a0; font-size:12px; }.breadcrumb span { padding:0 9px; color:#c4cbd2; }.breadcrumb strong { color:#344054; font-weight:600; }
    .account-chip { display:flex; align-items:center; gap:10px; color:#344054; font-size:12px; font-weight:600; }.avatar,.profile-avatar { display:grid; place-items:center; flex:0 0 auto; width:34px; height:34px; border-radius:50%; background:#e5f2ed; color:#176b57; font-size:11px; font-weight:700; }
    .page-content { width:min(1160px, 91%); margin:0 auto; padding:40px 0 30px; }
    .welcome-row { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:25px; }
    .eyebrow { margin:0 0 8px; color:#21806a; font-size:9px; font-weight:800; letter-spacing:1.35px; }
    h1 { margin:0; color:#172b27; font-size:clamp(25px,3vw,32px); font-weight:700; letter-spacing:-1px; }.wave { color:#e9a83b; font-size:25px; }
    .subtitle { margin:8px 0 0; color:#7d8995; font-size:13px; }.refresh-button { display:flex; align-items:center; gap:8px; padding:9px 12px; border:1px solid #e0e7e9; border-radius:8px; background:#fff; color:#596873; font-size:11px; font-weight:600; cursor:pointer; }.refresh-button:disabled { opacity:.55; cursor:wait; }.refresh-button svg { width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }.spinning { animation:spin 1.1s linear infinite; }@keyframes spin { to { transform:rotate(360deg); } }
    .summary-banner { position:relative; display:flex; align-items:center; justify-content:space-between; min-height:178px; overflow:hidden; padding:27px 36px; border-radius:13px; background:linear-gradient(110deg,#145c4c 0%,#16745d 65%,#21846a 100%); color:white; box-shadow:0 12px 25px #125a4c20; }
    .summary-banner:after { position:absolute; top:-105px; right:145px; width:280px; height:280px; border:1px solid #ffffff15; border-radius:50%; content:""; }.summary-copy { position:relative; z-index:1; }.summary-kicker { color:#bce1d4; font-size:9px; font-weight:700; letter-spacing:1.4px; }.summary-banner h2 { margin:11px 0 7px; font-size:25px; font-weight:650; letter-spacing:-.5px; }.summary-banner p { margin:0; color:#d2e9e1; font-size:12px; }.dot { padding:0 7px; color:#9ccbbb; }
    .home-illustration { position:absolute; right:4%; bottom:0; width:180px; height:142px; opacity:.92; }.home-illustration svg { width:100%; height:100%; }.building-back { fill:#ffffff22; stroke:#b7dfd0; stroke-width:2; }.building-main { fill:#ffffff31; stroke:#d5eee5; stroke-width:2; }.roof { fill:none; stroke:#e4f5ee; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }.window { fill:#c4e6db; }.door { fill:#f2cb83; }.sun { fill:#f4cc7b; }.ground { stroke:#ffffff88; stroke-width:2; stroke-linecap:round; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin:17px 0; }.stat-card { display:flex; align-items:flex-start; gap:12px; min-width:0; padding:17px 15px; border:1px solid #e9edf0; border-radius:11px; background:#fff; box-shadow:0 2px 5px #10182805; }.stat-icon { display:grid; place-items:center; flex:0 0 auto; width:34px; height:34px; border-radius:9px; }.stat-icon svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }.green { background:#e8f5ef; color:#218060; }.blue { background:#eaf1fb; color:#4778b8; }.amber { background:#fcf2df; color:#ba8730; }.violet { background:#f1edfa; color:#8468bb; }.stat-card > div:last-child { display:flex; flex-direction:column; min-width:0; }.stat-label { margin-bottom:6px; color:#89939e; font-size:10px; }.stat-card strong { overflow:hidden; color:#25343d; font-size:13px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }.stat-card small { overflow:hidden; margin-top:5px; color:#99a2ac; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
    .details-grid { display:grid; grid-template-columns:1.15fr .85fr; gap:16px; }.panel { padding:21px 23px; border:1px solid #e9edf0; border-radius:11px; background:#fff; box-shadow:0 2px 5px #10182805; }.panel-heading { display:flex; align-items:center; justify-content:space-between; gap:15px; padding-bottom:15px; border-bottom:1px solid #f0f2f4; }.panel-heading .eyebrow { margin-bottom:5px; }.panel h2 { margin:0; color:#25343d; font-size:16px; font-weight:700; }.status { display:flex; align-items:center; gap:6px; padding:6px 9px; border-radius:20px; background:#e9f6ef; color:#24784f; font-size:10px; font-weight:700; }.status i { width:6px; height:6px; border-radius:50%; background:#35a66b; }.status.inactive { background:#fef0ef; color:#b42318; }.status.inactive i { background:#d92d20; }
    .detail-list { display:grid; grid-template-columns:1fr 1fr; column-gap:15px; }.detail-row { display:flex; align-items:center; gap:11px; min-width:0; padding:14px 0; border-bottom:1px solid #f2f4f6; }.detail-icon,.contact-icon { display:grid; place-items:center; flex:0 0 auto; width:31px; height:31px; border-radius:8px; background:#f2f7f5; color:#32806b; font-size:16px; }.detail-row div,.contact-row div { display:flex; flex-direction:column; min-width:0; }.detail-row small,.contact-row small { margin-bottom:4px; color:#929ca6; font-size:10px; }.detail-row strong,.contact-row strong { overflow:hidden; color:#34434c; font-size:11px; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }
    .profile-avatar { width:38px; height:38px; font-size:12px; }.profile-name { margin:17px 0 13px; color:#25343d; font-size:14px; font-weight:700; }.contact-row { display:flex; align-items:center; gap:11px; padding:11px 0; border-top:1px solid #f2f4f6; }.contact-icon { background:#f7f5fb; color:#7b68a7; }.profile-note { margin:12px 0 0; padding:10px 11px; border-radius:7px; background:#f7f9fa; color:#7d8993; font-size:10px; line-height:1.5; }
    .loading-card,.error-card { display:flex; align-items:center; gap:12px; padding:20px; border:1px solid #e8edf0; border-radius:11px; background:#fff; color:#74818b; font-size:12px; }.loader { width:17px; height:17px; border:2px solid #dcebe5; border-top-color:#1d785f; border-radius:50%; animation:spin .8s linear infinite; }.error-card { align-items:flex-start; border-color:#f2d5d2; color:#7c3e39; }.error-card p { margin:5px 0 0; font-size:11px; }.error-mark { display:grid; place-items:center; width:22px; height:22px; border-radius:50%; background:#fdebea; color:#b42318; font-weight:700; }.error-card button { margin-left:auto; padding:7px 10px; border:1px solid #e5c3c0; border-radius:7px; background:#fff; color:#8e3c35; font-size:10px; cursor:pointer; }.footer-note { padding-top:22px; color:#a1aab2; text-align:center; font-size:10px; }.footer-note span { padding:0 5px; color:#c1c8ce; }
    @media (max-width:1100px) { .sidebar { width:218px; }.main-area { margin-left:218px; }.stats-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media (max-width:760px) { .sidebar { position:static; width:auto; height:auto; padding:13px 18px; border-right:0; border-bottom:1px solid #e8edf2; }.brand { margin:0; }.nav-label,.nav-item,.sidebar-bottom { display:none; }.main-area { margin-left:0; }.topbar { height:58px; padding:0 5%; }.account-name { display:none; }.page-content { width:90%; padding-top:28px; }.welcome-row { align-items:flex-start; }.subtitle { max-width:330px; line-height:1.5; }.refresh-button { padding:8px; font-size:0; }.refresh-button svg { width:17px; height:17px; }.summary-banner { min-height:155px; padding:23px; }.summary-banner h2 { max-width:210px; font-size:21px; }.summary-banner p { max-width:205px; line-height:1.5; }.home-illustration { right:-20px; width:140px; height:112px; opacity:.62; }.stats-grid { gap:9px; }.stat-card { gap:9px; padding:13px 10px; }.stat-icon { width:29px; height:29px; }.stat-card strong { font-size:11px; }.stat-card small { font-size:9px; }.details-grid { grid-template-columns:1fr; }.panel { padding:18px; } }
    @media (max-width:390px) { .stats-grid { grid-template-columns:1fr; }.detail-list { grid-template-columns:1fr; }.welcome-row h1 { font-size:24px; }.summary-banner h2 { max-width:180px; font-size:18px; } }
  `]
})
export class ResidentHomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly residentService = inject(ResidentPortalService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  resident?: ResidentHomeSummary;
  loading = true;
  error = '';

  get firstName(): string {
    const name = this.resident?.fullName || this.auth.getUsername() || 'Résident';
    return name.includes('@') ? 'Résident' : name.trim().split(/\s+/)[0];
  }

  get initials(): string {
    const name = this.resident?.fullName || this.auth.getUsername() || 'R';
    const parts = name.includes('@') ? [name[0]] : name.trim().split(/\s+/).slice(0, 2);
    return parts.map(part => part[0]?.toUpperCase() || '').join('') || 'R';
  }

  ngOnInit(): void {
    this.loadHome();
  }

  loadHome(): void {
    this.loading = true;
    this.error = '';
    this.residentService.getMyHome().pipe(timeout({ first: 10000 })).subscribe({
      next: resident => {
        this.resident = resident;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = this.getLoadErrorMessage(error);
        this.changeDetector.markForCheck();
      }
    });
  }

  private getLoadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return 'Votre session a expiré. Déconnectez-vous puis reconnectez-vous.';
      }
      if (error.status === 404) {
        return 'Aucune fiche de logement n’est liée à ce compte. Contactez votre syndic.';
      }
      if (error.status === 0) {
        return 'Le serveur est momentanément inaccessible. Vérifiez votre connexion puis réessayez.';
      }
    }
    return 'Impossible de charger les informations de votre logement. Réessayez dans quelques instants.';
  }

  logout(): void {
    this.auth.logout();
  }
}
