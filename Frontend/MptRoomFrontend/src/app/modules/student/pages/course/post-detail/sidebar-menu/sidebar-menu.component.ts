import { Component, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { CourseViewModel } from '../../../../../../models/VM/course.viewmode';
import { CommonModule } from '@angular/common';
import { CourseDTO } from '../../../../../../models/DTO/course.dto';
import { encodeId } from '../../../../../../helper/util';

@Component({
  selector: 'app-sidebar-menu',
  imports: [CommonModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
})
export class SidebarMenuComponent implements OnChanges {
  @Input() course$!: CourseViewModel | null;
  darknes_scale = [20, 40, 60];
  darkerColors: string[] = [];

  constructor(private router: Router) {}

  ngOnChanges() {
    if (this.course$) {
      this.darkerColors = this.darknes_scale.map((scale) =>
        this.darkenColor(this.course$!.hexademicalColor, scale)
      );
    }
  }

  private darkenColor(hex: string, amount: number): string {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Переход на страницу курса
  navigateToCourse(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['student', 'course', courseHash]);
  }

  // Переход на страницу с постами
  navigateToPosts(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['student', 'course', courseHash, 'posts']);
  }

  // Переход на страницу с заданиями
  navigateToTasks(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['student', 'course', courseHash, 'tasks']);
  }

  // Переход на страницу с дополнительными материалами
  navigateToMaterials(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['student', 'course', courseHash, 'materials']);
  }
}
