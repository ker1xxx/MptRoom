import { Component } from '@angular/core';
import {
  Observable,
  switchMap,
  forkJoin,
  map,
  tap,
  BehaviorSubject,
  from,
  catchError,
  of,
} from 'rxjs';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { GradeViewModel } from '../../../../models/VM/grade.viewmodel';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { DashboardBodyComponent } from './components/dashboard-body/dashboard-body.component';
import { CommonModule } from '@angular/common';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';

@Component({
  selector: 'student-dashboard',
  imports: [HeaderComponent, DashboardBodyComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  user$!: StudentDTO;
  schedule$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  grades$!: Observable<GradeViewModel[]>;
  tasks$!: Observable<TaskViewModel[]>;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    // Запрашиваем расписание
    this.apiService
      .getSchedule()
      .pipe(
        tap((lessons) => {
          if (lessons && lessons.length > 0) {
            console.log('Уроки получены:', lessons);
          } else {
            console.error('Нет уроков в расписании');
          }
        })
      )
      .subscribe({
        next: (lessons) => {
          if (lessons && lessons.length > 0) {
            this.schedule$.next(lessons);
          } else {
            console.error('Ошибка: Расписание пустое');
          }
        },
        error: (err) => {
          console.error('Ошибка при получении расписания:', err);
        },
      });

    this.user$ = await this.apiService.getStudent();
    console.log('Пользователь загружен:', this.user$);

    this.loadTasks();

    this.apiService.getStudent().then((user) => {
      this.user$ = user;
      console.log('Пользователь загружен:', this.user$);
      this.tasks$;
    });
  }

  // private loadSchedule() {
  //   console.log(this.user);
  //   if (!this.user?.userId) return; // Проверяем, что user и userId не пустые

  //   this.schedule$ = this.apiService.getSchedule();
  // }

  async loadGrades() {
    if (!this.user$?.userId) return;

    // Получаем задания для текущего пользователя
    this.grades$ = this.apiService.getTasksByUser(this.user$.userId).pipe(
      switchMap((tasks) => {
        // Запросы для получения информации по предмету для каждого задания
        const subjectRequest = tasks.map((task) =>
          this.apiService.getSubject(task.postId!)
        );

        const postRequest = tasks.map((task) =>
          this.apiService.getPost(task.postId!)
        );

        // Используем forkJoin для получения всех запросов
        return forkJoin([forkJoin(subjectRequest), forkJoin(postRequest)]).pipe(
          map(([subjects, posts]) => {
            // Преобразуем массив TaskDTO в массив GradeViewModel
            return tasks.map((task, index) => ({
              SidebarColor: subjects[index].hexademicalColor,
              Subject: subjects[index].subjectName, // Извлекаем данные о предмете
              Task: posts[index].postTitle, // Делаем привязку к задаче
              Grade: task.mark ? task.mark.toString() : '0', // Убедитесь, что grade это строка
              Duedate: task.dueTime, // Дата сдачи задания
            }));
          })
        );
      })
    );
  }

  private formatTeacherName(personalData: any): string {
    if (!personalData) return 'N/A';
    const lastName = personalData.lastname || '';
    const firstNameInitial = personalData.name?.[0]
      ? `${personalData.name[0]}.`
      : '';
    const patronymicInitial = personalData.patronymic?.[0]
      ? ` ${personalData.patronymic[0]}.`
      : '';
    return `${lastName} ${firstNameInitial}${patronymicInitial}`.trim();
  }

  async loadTasks() {
    this.tasks$ = from(this.apiService.getTasksByUser(this.user$.userId!)).pipe(
      switchMap((tasks) => {
        console.log('tasks loaded: ', tasks);
        const postIds = tasks.map((t) => t.postId!);
        const teacherIds = tasks.map((t) => t.teacherId);

        return forkJoin({
          subjects: forkJoin(
            postIds.map((id) =>
              from(this.apiService.getSubject(id)).pipe(
                catchError(() =>
                  of({ hexademicalColor: '#CCCCCC', subjectName: 'N/A' })
                )
              )
            )
          ),
          posts: forkJoin(
            postIds.map((id) =>
              from(this.apiService.getPost(id)).pipe(
                catchError(() => of({ postTitle: 'N/A' }))
              )
            )
          ),
          personalData: forkJoin(
            teacherIds.map((id) =>
              from(this.apiService.getTeacher(id)).pipe(
                switchMap((teacher) =>
                  from(
                    this.apiService.getPersonalData(teacher.personalDataId)
                  ).pipe(
                    catchError(() =>
                      of({ lastname: 'N/A', name: ['N/A'], patronymic: '' })
                    )
                  )
                ),
                catchError(() => of({ personalDataId: '' }))
              )
            )
          ),
        }).pipe(
          map(({ subjects, posts, personalData }) =>
            tasks.map((task, index) => ({
              sidebarColor: subjects[index]?.hexademicalColor || '#CCCCCC',
              dueTime: task.dueTime,
              subjectName: subjects[index]?.subjectName || 'N/A',
              taskName: posts[index]?.postTitle || 'N/A',
              teacherName: this.formatTeacherName(personalData[index]),
              taskStatus: task.taskStatus,
            }))
          )
        );
      }),
      catchError((err) => {
        console.error('Error loading tasks:', err);
        return of([]);
      })
    );
  }
}
