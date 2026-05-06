import { Component } from '@angular/core';
import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';

import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule, Header, Footer],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage {

}
