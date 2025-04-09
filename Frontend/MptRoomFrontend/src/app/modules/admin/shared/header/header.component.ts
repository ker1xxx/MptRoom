import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'admin-header',
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class AdminHeaderComponent {
  img = 'assets/images/MptLogo.png';
}
