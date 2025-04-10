import { Component, Input } from '@angular/core';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { ApiService } from '../../../../services/api.service';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'student-header',
  imports: [RouterModule],
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
    if (this.user) {
      await this.loadPersonalData();
      await this.loadGroupData();
    }
  }

  private async loadPersonalData() {
    if (!this.user.personalDataId) return;

    this.apiService
      .getById<PersonalDataDTO>('PersonalData', this.user.personalDataId)
      .subscribe(
        (user_data) =>
          (this.user_name = `${user_data.name} ${user_data.lastname} ${user_data.patronymic}`)
      );
  }

  private async loadGroupData() {
    if (!this.user.groupId) return;

    this.apiService
      .getById<GroupDTO>('Group', this.user.groupId)
      .subscribe((group_data) => (this.group_name = group_data.groupName));
  }
}
