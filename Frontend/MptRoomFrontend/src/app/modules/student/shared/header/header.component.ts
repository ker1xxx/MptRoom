import { Component, Input } from '@angular/core';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'student-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() user!: StudentDTO;
  user_photo = 'assets/images/user_icon_not_found_100px.png';
  img = 'assets/images/MptLogo.png';
  user_name = 'Not Found';
  group_name = 'Not Found';

  constructor(private apiService: ApiService) {}

  async ngOnChanges() {
    console.log('user: ', this.user);
    if (this.user) {
      await this.loadPersonalData();
      await this.loadGroupData();
    }
  }

  private async loadPersonalData() {
    if (!this.user.personalDataId) return;

    const user_data = await this.apiService.getPersonalData(
      this.user.personalDataId
    );
    if (user_data) {
      this.user_name = `${user_data.name} ${user_data.lastname} ${user_data.patronymic}`;
    }
  }

  private async loadGroupData() {
    if (!this.user.groupId) return;

    const group_data = await this.apiService.getGroupData(this.user.groupId);
    if (group_data) {
      this.group_name = group_data.groupName;
    }
  }
}
