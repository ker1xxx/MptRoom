import { Component } from '@angular/core';
import {
  Subject,
  BehaviorSubject,
  takeUntil,
  map,
  catchError,
  of,
  forkJoin,
  from,
  Observable,
  switchMap,
} from 'rxjs';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { LoaderService } from '../../../../services/loader.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { TeacherTimeTableBodyComponent } from './components/teacher-time-table-body/teacher-time-table-body.component';
import { CommonModule } from '@angular/common';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { LessonSupersedeRequestViewModel } from '../../../../models/VM/lesson-supersede-request.viewmodel';
import { LessonSupersedeRequestDTO } from '../../../../models/DTO/lesson-supersede-request.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { LessonSlotDTO } from '../../../../models/DTO/lesson-slot.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';

@Component({
  selector: 'teacher-time-table',
  imports: [TeacherTimeTableBodyComponent, HeaderComponent, CommonModule],
  templateUrl: './time-table.component.html',
  styleUrl: './time-table.component.scss',
})
export class TeacherTimeTableComponent {
  private destroy$ = new Subject<void>();

  user$!: TeacherDTO;
  schedule$ = new BehaviorSubject<LessonViewModel[]>([]);
  isLoading = true;
  error: string | null = null;

  lessonSuperesedeRequests$ = new BehaviorSubject<
    LessonSupersedeRequestViewModel[]
  >([]);

  private daysOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    await this.apiService.teacher$.subscribe((teacher) => {
      if (teacher) {
        this.user$ = teacher;
        this.loadSchedule();

        this.getLessonSupersedeRequests(teacher.userId!)
          .pipe(
            switchMap((requests) =>
              forkJoin(requests.map((request) => this.mapToViewModel(request)))
            )
          )
          .subscribe({
            next: (lessonSuperesedeRequests) => {
              this.lessonSuperesedeRequests$.next(lessonSuperesedeRequests);
            },
            error: (err) => {
              console.error('Ошибка при загрузке запросов:', err);
              this.lessonSuperesedeRequests$.next([]);
            },
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSchedule() {
    this.loaderService.loadWithCache(this.schedule$, () =>
      this.apiService.getTeacherSchedule().pipe(
        takeUntil(this.destroy$),
        map((lessons) => this.processAndSortLessons(lessons)),
        catchError((error) => {
          console.error('Ошибка загрузки:', error);
          this.error = 'Ошибка загрузки расписания';
          return of([]);
        })
      )
    );

    this.schedule$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.isLoading = false),
      error: () => (this.isLoading = false),
    });
  }

  private processAndSortLessons(lessons: LessonViewModel[]): LessonViewModel[] {
    const currentWeekType = this.getCurrentWeekType();

    return lessons
      .filter(
        (lesson) =>
          lesson.WeekType.toLowerCase() === 'any' ||
          lesson.WeekType.toLowerCase() === currentWeekType
      )
      .sort((a, b) => {
        const dayComparison =
          this.daysOrder.indexOf(a.DayOfWeek) -
          this.daysOrder.indexOf(b.DayOfWeek);
        return dayComparison !== 0
          ? dayComparison
          : a.LessonNumber - b.LessonNumber;
      });
  }

  private getCurrentWeekType(): string {
    const weekNumber = this.getWeekNumber(new Date());
    return weekNumber % 2 === 0 ? 'even' : 'odd';
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
  }

  private getLessonSupersedeRequests(
    teacherId: number
  ): Observable<LessonSupersedeRequestDTO[]> {
    return this.apiService.get<LessonSupersedeRequestDTO[]>(
      `LessonSupersedeRequest/teacher/${teacherId}`
    );
  }

  private getTeacherName(teacherId: number): Observable<string> {
    return this.apiService.getById<TeacherDTO>('Teacher', teacherId).pipe(
      switchMap((teacher) => this.getPersonalData(teacher.personalDataId!)),
      switchMap(
        (personalData) =>
          personalData.lastname +
          ' ' +
          personalData.name +
          ' ' +
          personalData.patronymic
      )
    );
  }

  private getGroupName(groupId: number): Observable<string> {
    return this.apiService
      .getById<GroupDTO>('Group', groupId)
      .pipe(map((group) => group.groupName));
  }

  getPersonalData(personalDataId: number): Observable<PersonalDataDTO> {
    return this.apiService.get<PersonalDataDTO>(
      `personalData/${personalDataId}`
    );
  }

  private getSubjectName(subjectId: number): Observable<string> {
    return this.apiService
      .getById<SubjectDTO>('Subject', subjectId)
      .pipe(map((subject) => subject.subjectName));
  }

  private mapToViewModel(
    dto: LessonSupersedeRequestDTO
  ): Observable<LessonSupersedeRequestViewModel> {
    return forkJoin([
      this.getTeacherName(dto.teacherId),
      this.getGroupName(dto.groupId),
      this.getSubjectName(dto.subjectId),
    ]).pipe(
      map(([teacherName, groupName, subjectName]) => ({
        supersedeRequestId: dto.supersedeRequestId,
        teacherId: dto.teacherId,
        teacherName: teacherName,
        groupId: dto.groupId,
        dateToSupersede: dto.dateToSupersede,
        groupName: groupName,
        lessonSlotId: dto.lessonSlotId,
        lessonSlotName: `${dto.lessonSlotId} Пара`,
        subjectId: dto.subjectId,
        subjectName: subjectName,
        requestTime: dto.requestTime,
        supersedeRequestStatus: dto.supersedeRequestStatus!,
        supersedeRequestType: dto.supersedeRequestType,
      }))
    );
  }

  private lessonSupersedeRequestToViewModel(
    dtos: LessonSupersedeRequestDTO[]
  ): Observable<LessonSupersedeRequestViewModel[]> {
    return forkJoin(dtos.map((dto) => this.mapToViewModel(dto)));
  }

  private mapToDto(
    viewModel: LessonSupersedeRequestViewModel
  ): LessonSupersedeRequestDTO {
    return {
      supersedeRequestId: viewModel.supersedeRequestId,
      teacherId: viewModel.teacherId,
      groupId: viewModel.groupId,
      dateToSupersede: viewModel.dateToSupersede, // предполагается, что это свойство доступно
      lessonSlotId: viewModel.lessonSlotId,
      subjectId: viewModel.subjectId,
      requestTime: viewModel.requestTime,
      affectedLessonId: viewModel.affectedLessonId,
      supersedeRequestStatus: viewModel.supersedeRequestStatus,
      supersedeRequestType: viewModel.supersedeRequestType,
    };
  }

  private lessonSupersedeRequestFromViewModel(
    viewModels: LessonSupersedeRequestViewModel[]
  ): LessonSupersedeRequestDTO[] {
    return viewModels.map(this.mapToDto);
  }
}
