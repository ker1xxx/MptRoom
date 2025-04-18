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
import { SubjectDTO } from '../../../../models/DTO/subject.dto';

@Component({
  selector: 'admin-subject-page',
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './subject-page.component.html',
  styleUrl: './subject-page.component.scss',
})
export class SubjectPageComponent {
  subjects: SubjectDTO[] = [];
  selectedSubject: SubjectDTO | null = null;
  isModalOpen = false;
  isEditMode = false;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.api.get<SubjectDTO[]>('Subject').subscribe((data) => {
      this.subjects = data;
    });
  }

  openModal(subject?: SubjectDTO) {
    if (subject) {
      this.selectedSubject = { ...subject };
      this.isEditMode = true;
    } else {
      this.selectedSubject = {
        subjectName: '',
        hexademicalColor: '#000000',
      };
      this.isEditMode = false;
    }
    this.isModalOpen = true;
    console.log(this.selectedSubject);
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedSubject = null;
  }

  saveSubject() {
    if (!this.selectedSubject) return;

    if (this.isEditMode && this.selectedSubject.subjectId) {
      this.api
        .put<SubjectDTO>(
          'Subject',
          this.selectedSubject,
          this.selectedSubject.subjectId
        )
        .subscribe(() => {
          this.loadSubjects();
          this.closeModal();
        });
    } else {
      this.api
        .post<SubjectDTO>('Subject', this.selectedSubject)
        .subscribe(() => {
          this.loadSubjects();
          this.closeModal();
        });
    }
  }

  deleteSubject(subjectId: number) {
    if (confirm('Удалить предмет?')) {
      this.api.deleteSubject(subjectId).subscribe(() => {
        this.loadSubjects();
        this.closeModal();
      });
    }
  }
}
