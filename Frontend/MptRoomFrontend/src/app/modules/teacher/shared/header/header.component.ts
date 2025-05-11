import { Component, Input } from '@angular/core';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { ApiService } from '../../../../services/api.service';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'teacher-header',
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() user!: TeacherDTO;
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
      if (
        !this.user_photo ||
        this.user_photo === 'assets/images/user_icon_not_found_100px.png'
      ) {
        const user = await firstValueFrom(this.apiService.teacher$);
        if (user) {
          await this.apiService.saveAvatar(
            user.personalDataId!,
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
}
