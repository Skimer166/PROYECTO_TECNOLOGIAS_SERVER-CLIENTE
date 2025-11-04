import { Component } from '@angular/core';
import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';
@Component({
  selector: 'app-landing-page',
  imports: [Header, Footer],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage {

}
