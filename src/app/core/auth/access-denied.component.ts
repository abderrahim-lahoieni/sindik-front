import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<main class="access-denied">
    <h1>Accès refusé</h1>
    <p>Votre compte n’a pas accès à cette page.</p>
    <a routerLink="/">Retour à l’accueil</a>
  </main>`,
  styles: [`.access-denied { max-width: 32rem; margin: 5rem auto; padding: 1rem; text-align: center; }`]
})
export class AccessDeniedComponent {}
