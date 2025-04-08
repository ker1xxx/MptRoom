import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { ApiService } from '../../../../services/api.service';
import { LoaderService } from '../../../../services/loader.service';
import { BehaviorSubject } from 'rxjs';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';

@Component({
  selector: 'app-time-table',
  imports: [HeaderComponent, CommonModule],
  templateUrl: './time-table.component.html',
  styleUrl: './time-table.component.scss',
})
export class TimeTableComponent {
  user$!: StudentDTO;
  schedule$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    await this.loadSchedule();
  }

  private loadSchedule() {
    this.loaderService.loadWithCache(this.schedule$, () =>
      this.apiService.getSchedule()
    );
  }
}
