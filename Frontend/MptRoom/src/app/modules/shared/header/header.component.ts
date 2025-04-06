import { Component, Input } from '@angular/core';
import { StudentService } from '../../../services/service.service';
import { StudentDTO } from '../../../models/DTO/student.dto';

@Component({
  selector: 'student-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() user!: StudentDTO;
  user_photo = 'assets/images/user_icon_not_found_100px.png';
  img = 'assets/images/MptLogo.png';
  user_name = 'Not Found';
  group_name = 'Not Found';

  constructor(private studentService: StudentService) {}

  async ngOnInit() {
    if (this.user) {
      await this.loadPersonalData();
      await this.loadGroupData();
    }
  }

  private async loadPersonalData() {
    if (!this.user.PersonalDataId) return;

    const user_data = await this.studentService.getPersonalData(
      this.user.PersonalDataId
    );
    if (user_data) {
      this.user_name = `${user_data.Name} ${user_data.Lastname} ${user_data.Patronymic}`;
    }
  }

  private async loadGroupData() {
    if (!this.user.GroupId) return;

    const group_data = await this.studentService.getGroupData(
      this.user.GroupId
    );
    if (group_data) {
      this.group_name = group_data.GroupName;
    }
  }
}
