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

  collegeYear: { [key: number]: string } = {
    [CollegeYearEnum.First]: 'Первый курс',
    [CollegeYearEnum.Second]: 'Второй курс',
    [CollegeYearEnum.Third]: 'Третий курс',
    [CollegeYearEnum.Fourth]: 'Четвертый курс',
  };
  collegeYears = Object.values(CollegeYearEnum).filter(
    (value) => typeof value === 'number'
  );

  isModalOpen = false;
  isEditMode = false;
  selectedItem: GroupDTO = this.emptyGroup();

  constructor(private api: ApiService, private router: Router) {}

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
    console.log(this.selectedItem);
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
    const courseNumberMapping: { [key: string]: CollegeYearEnum } = {
      First: CollegeYearEnum.First,
      Second: CollegeYearEnum.Second,
      Third: CollegeYearEnum.Third,
      Fourth: CollegeYearEnum.Fourth,
    };
    try {
      // Если вы хотите установить курс в числовом значении, используя строку:
      this.selectedItem.courseNumber =
        courseNumberMapping[
          this.selectedItem.courseNumber as keyof typeof courseNumberMapping
        ];

      console.log(this.selectedItem);
      if (this.isEditMode) {
        await this.api.put<GroupDTO>(
          'Group',
          this.selectedItem,
          this.selectedItem.groupId!
        );
      } else {
        const newGroup = await this.api
          .post<GroupDTO>('Group', this.selectedItem)
          .toPromise();
        this.groups.push(newGroup!);
      }
      this.closeModal();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
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
