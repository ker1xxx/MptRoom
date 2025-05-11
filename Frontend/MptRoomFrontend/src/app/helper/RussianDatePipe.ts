import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'russianDate' })
export class RussianDatePipe implements PipeTransform {
  private months = [
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

  transform(value: string | Date): string {
    const date = new Date(value);

    if (isNaN(date.getTime())) return 'Неверная дата';

    const day = date.getDate().toString().padStart(2, '0');
    const month = this.months[date.getMonth()];
    const year = date.getFullYear().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${hours}:${minutes}`;
  }
}
