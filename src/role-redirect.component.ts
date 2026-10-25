// src/app/core/auth/role-redirect.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import  { AuthService } from './app/core/auth/auth.service';
import { Role } from './app/core/auth/models/auth.model';

@Component({
  selector: 'app-role-redirect',
  template: '' 
   })
export class RoleRedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const role = this.auth.getRole(); // récupère le rôle connecté
    if (role === Role.A) {
      this.router.navigate(['/admin']);
    } else if (role === Role.S) {
      this.router.navigate(['/syndik']);
    } else if (role === Role.R) {
      this.router.navigate(['/resident']);
    } else if (role === Role.F) {
      this.router.navigate(['/access-denied']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
