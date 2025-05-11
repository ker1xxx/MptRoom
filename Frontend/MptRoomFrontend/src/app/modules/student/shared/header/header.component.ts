import { Component, Input } from '@angular/core';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { ApiService } from '../../../../services/api.service';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'student-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() user!: StudentDTO;
  user_photo: SafeResourceUrl | string =
    'assets/images/user_icon_not_found_100px.png';
  img = 'assets/images/MptLogo.png';
  user_name = 'Not Found';
  group_name = 'Not Found';

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnChanges() {
    if (this.user) {
      await this.loadPersonalData();
      await this.loadGroupData();
      if (
        !this.user_photo ||
        this.user_photo === 'assets/images/user_icon_not_found_100px.png'
      ) {
        const student = await firstValueFrom(this.apiService.student$);
        if (student) {
          await this.apiService.saveAvatar(
            student.personalDataId!,
            this.sanitizer
          );
        }
      }

      this.apiService.avatarUrlCache.subscribe((url) => {
        this.user_photo = url;
      });
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
