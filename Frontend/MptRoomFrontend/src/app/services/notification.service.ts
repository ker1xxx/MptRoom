// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationModel } from '../models/helpers/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationModel | null>(
    null
  );
  notification$ = this.notificationSubject.asObservable();

  show(message: string, type: 'success' | 'error' = 'success') {
    this.notificationSubject.next({ message, type });
    setTimeout(() => this.clear(), 3000);
  }

  clear() {
    this.notificationSubject.next(null);
  }
}
