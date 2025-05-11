import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'lessonTime' })
export class LessonTimePipe implements PipeTransform {
  transform(value: string): string {
    if (!value || typeof value !== 'string') return 'Неверный формат';

    const parts = value.split(' - ');
    if (parts.length !== 2) return 'Неверный формат';

    const format = (time: string): string => {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    };

    return `${format(parts[0])} - ${format(parts[1])}`;
  }
}
