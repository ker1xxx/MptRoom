import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  SimpleChange,
} from '@angular/core';
import { LessonViewModel } from '../../../../../../models/VM/lesson.viewmodel';
import { TeacherTaskViewModel } from '../../../../../../models/VM/teacher-task.viewmodel';
import { CommonModule } from '@angular/common';
import { TeacherTimeTableCardComponent } from '../../../../shared/time-table-card/time-table-card.component';
import { SubmittedTaskCardComponent } from '../submitted-task-card/submitted-task-card.component';
import { SupersedeRequestType } from '../../../../../../models/enums/supersede-type-request.enum';
import { LessonSupersedeRequestViewModel } from '../../../../../../models/VM/lesson-supersede-request.viewmodel';
import { FormsModule } from '@angular/forms';
import { encodeId } from '../../../../../../helper/util';
import { Router } from '@angular/router';

@Component({
  selector: 'teacher-dashboard-body',
  imports: [
    CommonModule,
    FormsModule,
    TeacherTimeTableCardComponent,
    SubmittedTaskCardComponent,
  ],
  templateUrl: './teacher-dashboard-body.component.html',
  styleUrl: './teacher-dashboard-body.component.scss',
})
export class TeacherDashboardBodyComponent implements OnChanges {
  @Input() schedule: LessonViewModel[] | null = [];
  @Input() tasks: TeacherTaskViewModel[] | null = [];
  @Input() supersedeRequests: LessonSupersedeRequestViewModel[] | null = [];

  dayName: string = '';
  today: string = '';
  SupersedeRequestType = SupersedeRequestType;
  readonly LESSON_SLOTS = [1, 2, 3, 4, 5];

  lessonSlotRows: {
    slot: number;
    original?: LessonViewModel;
    supersede?: LessonViewModel;
  }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hasChanges(changes)) {
      this.processCombinedData();
    }
  }

  constructor(private router: Router) {
    this.initDateStrings();
  }

  private hasChanges(changes: SimpleChanges): boolean {
    return !!changes['schedule'] || !!changes['supersedeRequests'];
  }

  private processCombinedData(): void {
    const processed = this.processScheduleWithSupersedes();
    this.lessonSlotRows = this.LESSON_SLOTS.map((slot) => ({
      slot,
      original: processed.original.find((l) => l.LessonNumber === slot),
      supersede: processed.supersedes.find((l) => l.LessonNumber === slot),
    }));

    console.log('Processed rows:', this.lessonSlotRows);
  }
  get isScheduleEmpty(): boolean {
    return this.lessonSlotRows?.every((row) => !row.original && !row.supersede);
  }

  private initDateStrings(): void {
    const daysOfWeek = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ];
    const monthsOfYear = [
      'Января',
      'Февраля',
      'Марта',
      'Апреля',
      'Мая',
      'Июня',
      'Июля',
      'Августа',
      'Сентября',
      'Октября',
      'Ноября',
      'Декабря',
    ];

    const today = new Date();
    this.dayName = daysOfWeek[today.getDay()];
    this.today = `${today.getDate()} ${monthsOfYear[today.getMonth()]}`;
  }

  private processScheduleWithSupersedes(): {
    original: LessonViewModel[];
    supersedes: LessonViewModel[];
  } {
    const today = new Date().toISOString().split('T')[0];
    const originalLessons = [...this.schedule!];
    const supersedeLessons: LessonViewModel[] = [];

    this.supersedeRequests!.forEach((request) => {
      if (request.dateToSupersede !== today) return;

      // Обработка добавленных/замененных пар
      if (request.supersedeRequestType === SupersedeRequestType.added) {
        const newLesson = this.createLessonFromSupersede(request);
        supersedeLessons.push(newLesson);
      }

      // Модификация существующих уроков
      const originalLesson = originalLessons.find(
        (l) => l.LessonId === request.affectedLessonId
      );

      if (originalLesson) {
        this.modifyOriginalLesson(originalLesson, request);
      }
    });

    return {
      original: this.filterAndSort(originalLessons),
      supersedes: this.filterAndSort(supersedeLessons),
    };
  }

  private modifyOriginalLesson(
    lesson: LessonViewModel,
    request: LessonSupersedeRequestViewModel
  ): void {
    lesson.isModified = true;
    lesson.modificationType = request.supersedeRequestType;
    lesson.newLessonSlot = request.lessonSlotName;

    if (request.supersedeRequestType === SupersedeRequestType.replaced) {
      lesson.LessonTime = request.lessonSlotName;
    }
  }

  navigateToTask(obj: any) {
    const courseHash = encodeId(obj!.courseId!);
    const postHash = encodeId(obj.postId);

    this.router.navigate(['student', 'course', courseHash, postHash]);
  }

  private filterAndSort(lessons: LessonViewModel[]): LessonViewModel[] {
    const dayMapping: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    console;
    return lessons
      .filter((lesson) => dayMapping[lesson.DayOfWeek] === new Date().getDay())
      .sort((a, b) => a.LessonNumber - b.LessonNumber);
  }

  private createLessonFromSupersede(
    request: LessonSupersedeRequestViewModel
  ): LessonViewModel {
    return {
      LessonId: Math.random(), // Используем ID из запроса
      SubjectId: request.subjectId,
      SubjectName: request.subjectName,
      GroupId: request.groupId,
      GroupName: request.groupName,
      TeacherId: request.teacherId,
      TeacherName: request.teacherName,
      DayOfWeek: this.getEnglishDayOfWeek(new Date(request.dateToSupersede)),
      LessonNumber: request.lessonSlotId,
      HexademicalColor: request.hexademicalColor || '#CCCCCC',
      LessonTime: request.lessonSlotName,
      isModified: true,
      modificationType: SupersedeRequestType.added,
      WeekType: '',
      HousingName: '',
      newLessonSlot: '',
      originalLessonSlot: '',
    };
  }

  // Остальные методы остаются без изменений
  getModificationClass(modificationType?: SupersedeRequestType): string {
    return modificationType
      ? SupersedeRequestType[modificationType].toLowerCase()
      : '';
  }

  getStatusText(lesson: LessonViewModel): string {
    switch (lesson.modificationType) {
      case SupersedeRequestType.added:
        return 'Добавлено';
      case SupersedeRequestType.replaced:
        return 'Заменено';
      case SupersedeRequestType.moved:
        return 'Перенесено';
      case SupersedeRequestType.canceled:
        return 'Отменено (с отработкой)';
      default:
        return '';
    }
  }

  private getEnglishDayOfWeek(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  trackByLessonSubject(index: number, lesson: LessonViewModel): string {
    return lesson.SubjectName + lesson.LessonNumber;
  }

  trackByTaskId(index: number, task: TeacherTaskViewModel): string {
    return task.taskId?.toString() || index.toString();
  }
}
