import { Component } from '@angular/core';
import { StudentModel } from '../../../../../DTO/student.model';
@Component({
  selector: 'student-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  user!: StudentModel;
  group_name: string = '';
  user_name: string = '';
  user_photo = 'assets/images/user_icon_not_found_100px.png';
  ngOnInit() {
    const user_data = localStorage.getItem('user');
    this.user = JSON.parse(user_data!);

    this.group_name = this.user.group
    this.user_name = this.user.name
  }

  img = 'assets/images/MptLogo.png'

}
