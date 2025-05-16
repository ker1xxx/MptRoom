import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SurveyOptionDTO } from '../../../../../../models/DTO/survey-option.dto';
import { ApiService } from '../../../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseViewModel } from '../../../../../../models/VM/course.viewmode';
import { PostViewModel } from '../../../../../../models/VM/post.viewmodel';
import { StudentDTO } from '../../../../../../models/DTO/student.dto';
import { SurveyAnswerDTO } from '../../../../../../models/DTO/survey-answer.dto';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';
import { PersonalDataDTO } from '../../../../../../models/DTO/personal-data.dto';
import { PostContentComponent } from '../helper/PostContentComponent';

@Component({
  selector: 'teacher-survey-card',
  imports: [CommonModule, FormsModule, RussianDatePipe],
  templateUrl: './survey-card.component.html',
  styleUrl: './survey-card.component.scss',
})
export class SurveyCardComponent implements PostContentComponent {
  @Input() post!: PostViewModel;
  @Input() course$!: CourseViewModel | null;
  options: SurveyOptionDTO[] = [];
  answers: SurveyAnswerDTO[] = [];
  students: StudentDTO[] = [];
  personalDataMap = new Map<number, PersonalDataDTO>();
  expandedOptionId: number | null = null;

  get totalAnswered(): number {
    const uniqueIds = new Set(this.answers.map((a) => a.studentId));
    return uniqueIds.size;
  }

  get totalStudents(): number {
    return this.students.length;
  }

  constructor(private api: ApiService) {}

  getExtraPostData() {
    return this.options;
  }

  ngOnInit() {
    this.api
      .get<SurveyOptionDTO[]>(`SurveyOption/post/${this.post.id}`)
      .subscribe((opts) => {
        this.options = opts;
      });
    this.api
      .get<SurveyAnswerDTO[]>(`SurveyAnswer/post/${this.post.id}`)
      .subscribe((answers) => {
        this.answers = answers;
      });
    this.api
      .get<StudentDTO[]>(`Student/group/${this.post.groupId}`)
      .subscribe((students) => {
        this.students = students;

        const personalDataIds = students
          .map((s) => s.personalDataId)
          .filter((id): id is number => !!id);

        personalDataIds.forEach((id) => {
          this.api
            .getById<PersonalDataDTO>(`PersonalData`, id)
            .subscribe((pd) => {
              this.personalDataMap.set(id, pd);
            });
        });
      });
  }

  toggleOption(optionId: number) {
    this.expandedOptionId =
      this.expandedOptionId === optionId ? null : optionId;
  }

  getRespondents(optionId: number): { fullName: string; time: string }[] {
    return this.answers
      .filter((a) => a.surveyOptionId === optionId)
      .map((a) => {
        const student = this.students.find((s) => s.userId === a.studentId);
        const pd = student
          ? this.personalDataMap.get(student.personalDataId!)
          : undefined;
        const fullName = pd
          ? `${pd.lastname} ${pd.name} ${pd.patronymic ?? ''}`.trim()
          : 'Неизвестный студент';
        return {
          fullName,
          time: a.commitTime,
        };
      });
  }

  getAnswerCount(optionId: number): number {
    return this.answers.filter((a) => a.surveyOptionId === optionId).length;
  }
}
