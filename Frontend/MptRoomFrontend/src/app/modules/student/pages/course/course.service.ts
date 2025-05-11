import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CourseTab = 'posts' | 'tasks' | 'materials';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private currentTab = new BehaviorSubject<CourseTab>('posts');
  currentTab$ = this.currentTab.asObservable();

  setCurrentTab(tab: CourseTab) {
    this.currentTab.next(tab);
  }
}
