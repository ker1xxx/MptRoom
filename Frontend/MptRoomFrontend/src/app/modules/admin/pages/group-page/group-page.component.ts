import { Component } from '@angular/core';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { CollegeYearEnum } from '../../../../models/enums/college-year.enum';
import { ApiService } from '../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { TableHeader } from '../../../../models/helpers/table-header.model';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminHeaderComponent } from '../../shared/header/header.component';
import { CollegeYearMap } from '../../../../models/helpers/college-year-map.model';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'admin-group-page',
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './group-page.component.html',
  styleUrl: './group-page.component.scss',
})
export class GroupPageComponent {
  groups: GroupDTO[] = [];
  headers = [
    { key: 'groupName', displayName: 'Название группы' },
    { key: 'courseNumber', displayName: 'Курс' },
  ];

  collegeYearMap: { [key: number]: string } = {
    [CollegeYearEnum.First]: 'Первый курс',
    [CollegeYearEnum.Second]: 'Второй курс',
    [CollegeYearEnum.Third]: 'Третий курс',
    [CollegeYearEnum.Fourth]: 'Четвертый курс',
  };

  collegeYears = Object.values(CollegeYearEnum).filter(
    (value) => typeof value === 'number'
  ) as number[];

  isModalOpen = false;
  isEditMode = false;
  selectedItem: GroupDTO = this.emptyGroup();

  constructor(
    private api: ApiService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.api.get<GroupDTO[]>('Group').subscribe((data) => (this.groups = data));
  }

  openModal(group?: GroupDTO) {
    this.isEditMode = !!group;
    this.selectedItem = group ? { ...group } : this.emptyGroup();
    this.isModalOpen = true;
  }

  openModalForCreate() {
    this.openModal();
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedItem = this.emptyGroup();
  }

  saveChanges() {
    this.api
      .put<GroupDTO>('Group', this.selectedItem!, this.selectedItem.groupId!)
      .subscribe(() => {
        this.groups = this.groups.map((item) =>
          item!.groupId === this.selectedItem!.groupId
            ? this.selectedItem!
            : item!
        );
        this.closeModal();
      });
  }

  async loadGroups() {
    this.api
      .get<GroupDTO[]>('Group')
      .subscribe((groups) => (this.groups = groups));
  }
  async handleSave() {
    try {
      // Преобразование в число (если нужно)
      const courseNumber = Number(this.selectedItem.courseNumber);

      // Проверка валидности значения
      if (!this.collegeYears.includes(courseNumber)) {
        throw new Error('Выбран некорректный курс');
      }

      // Обновляем значение
      this.selectedItem.courseNumber = courseNumber;

      if (this.isEditMode) {
        await this.api
          .put<GroupDTO>('Group', this.selectedItem, this.selectedItem.groupId!)
          .toPromise();
      } else {
        const newGroup = await this.api
          .post<GroupDTO>('Group', this.selectedItem)
          .toPromise();
        this.groups.push(newGroup!);
      }

      this.loadGroups();
      this.closeModal();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      this.notificationService.show('❌ Ошибка при сохранении группы', 'error');
    }
  }

  deleteGroup(group: GroupDTO) {
    if (confirm('Вы уверены, что хотите удалить группу?')) {
      this.api.delete('Group', group.groupId!).subscribe({
        next: () => {
          this.groups = this.groups.filter((g) => g.groupId !== group.groupId);
          this.closeModal();
        },
        error: (err) => console.error('Ошибка удаления:', err),
      });
    }
  }

  private emptyGroup(): GroupDTO {
    return {
      groupName: '',
      courseNumber: CollegeYearEnum.First,
    };
  }

  trackByGroupId(index: number, item: GroupDTO): number {
    return item.groupId!;
  }

  showStudents(groupId?: number) {
    this.router.navigate(['admin/students'], {
      queryParams: { group: groupId },
      queryParamsHandling: 'merge',
    });
  }
}
