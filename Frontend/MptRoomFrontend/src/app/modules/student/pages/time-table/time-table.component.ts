import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { StudentDTO } from '../../../../models/DTO/student.dto';

@Component({
  selector: 'app-time-table',
  imports: [HeaderComponent, CommonModule],
  templateUrl: './time-table.component.html',
  styleUrl: './time-table.component.scss',
})
export class TimeTableComponent {
  user$!: StudentDTO;

  ngOnInit() {}
}
