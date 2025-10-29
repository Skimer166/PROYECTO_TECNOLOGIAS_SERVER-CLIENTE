import { Component } from '@angular/core';
import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';
@Component({
  selector: 'app-home-page',
  imports: [Header, Footer],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {

}
