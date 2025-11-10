import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { User as userService} from '../../shared/services/user';


@Component({
  selector: 'app-header',
  imports: [MatToolbar, MatIcon],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit{

  isLogueado = false

  constructor(private userService: userService) {}

  ngOnInit() {  }


}
