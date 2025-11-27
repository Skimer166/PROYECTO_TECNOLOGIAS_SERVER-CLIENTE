import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layouts/header/header';
import { Footer } from './layouts/footer/footer';
import { SupportWidgetComponent } from './pages/support-widget/support-widget';
@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, SupportWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Market-AI');
}
