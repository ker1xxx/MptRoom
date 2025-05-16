import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../../services/api.service';
import { SurveyOptionDTO } from '../../../../../../models/DTO/survey-option.dto';
import { SurveyAnswerDTO } from '../../../../../../models/DTO/survey-answer.dto';
import { firstValueFrom } from 'rxjs';
import { PostDTO } from '../../../../../../models/DTO/post.dto';
import { PostViewModel } from '../../../../../../models/VM/post.viewmodel';
import { CourseViewModel } from '../../../../../../models/VM/course.viewmode';
import { StudentDTO } from '../../../../../../models/DTO/student.dto';

@Component({
  selector: 'student-survey-card',
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-card.component.html',
  styleUrl: './survey-card.component.scss',
})
export class SurveyCardComponent {
  @Input() post!: PostViewModel;
  @Input() course$!: CourseViewModel | null;
  options$!: SurveyOptionDTO[];
  selectedOption?: SurveyOptionDTO;
  submitted = false;
  student!: StudentDTO | null;

  constructor(private api: ApiService) {}

  async ngOnInit() {
    this.api
      .get<SurveyOptionDTO[]>(`SurveyOption/post/${this.post.id}`)
      .subscribe((options) => {
        this.options$ = options;
      });
    this.api.student$.subscribe((student) => {
      this.student = student;
      this.api
        .get<SurveyAnswerDTO[]>(
          `SurveyAnswer/post/${this.post.id}/student/${student?.userId!}`
        )
        .subscribe(
          (result) => {
            if (result.length != 0) {
              this.submitted = true;
              this.selectedOption = this.options$.find(
                (so) => so.surveyOptionId === result[0].surveyOptionId
              );
            } else this.submitted = false;
          },
          (error) => {
            this.submitted = false;
          }
        );
    });
  }

  async submit() {
    this.student = await firstValueFrom(this.api.student$);
    const surveyAnswerDTO: SurveyAnswerDTO = {
      studentId: this.student?.userId!,
      postId: this.post.id,
      surveyOptionId: this.selectedOption?.surveyOptionId!,
      commitTime: new Date().toISOString(),
    };
    this.api.post<SurveyAnswerDTO>('SurveyAnswer', surveyAnswerDTO).subscribe(
      (response) => {
        this.submitted = true;
      },
      (error) => {}
    );
    this.submitted = true;
  }
}
